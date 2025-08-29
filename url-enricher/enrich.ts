
import fs from "fs/promises";
import path from "path";
import { load as cheerioLoad } from "cheerio";
import { distance as levenshtein } from "fastest-levenshtein";
import pLimit from "p-limit";

type Row = {
  brand: string;
  product_name: string;
  category?: string;
  form?: string;
  variant_generic?: string;
  size_label?: string;
  brand_domain?: string;            // optional in your CSV; helps bias candidates
  source_priority?: string;         // comma list: amazon,iherb,walmart,vitaminshoppe,costco,brand
  canonical_product_url?: string;
  review_url_1?: string;
  review_url_2?: string;
  last_verified_utc?: string;
  notes?: string;
};

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => {
  if (a.startsWith("--")) {
    const key = a.replace(/^--/, "");
    const val = arr[i+1] && !arr[i+1].startsWith("--") ? arr[i+1] : "true";
    return [key, val];
  }
  return [];
}).filter(Boolean));

const IN = args["in"];
const OUT = args["out"];
const CONCURRENCY = parseInt(args["concurrency"] || "5", 10);
const LIMIT = args["limit"] ? parseInt(args["limit"], 10) : undefined;
const ONLY_MISSING = args["only-missing"] === "true";

if (!IN || !OUT) {
  console.error("Usage: node dist/enrich.js --in input.csv --out output.csv [--concurrency 5] [--only-missing] [--limit 200]");
  process.exit(1);
}

const sleep = (ms:number) => new Promise(res => setTimeout(res, ms));

async function readCSV(file: string): Promise<Row[]> {
  const text = await fs.readFile(file, "utf8");
  const [header, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const cols = header.split(",");
  return lines.map(line => {
    const vals = parseCSVRow(line, cols.length);
    const obj: any = {};
    cols.forEach((c, i) => obj[c.trim()] = (vals[i] || "").trim());
    return obj as Row;
  });
}

// naive CSV row parser supporting quoted commas
function parseCSVRow(line: string, expected: number): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '"' && (i===0 || line[i-1] !== "\\")) {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  while (out.length < expected) out.push("");
  return out;
}

function csvEscape(s: string): string {
  if (s == null) return "";
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function writeCSV(file: string, rows: Row[]) {
  const cols = Object.keys(rows[0] || {
    brand:"",product_name:"",category:"",form:"",variant_generic:"",size_label:"",
    brand_domain:"",source_priority:"",canonical_product_url:"",review_url_1:"",review_url_2:"",
    last_verified_utc:"",notes:""
  });
  const header = cols.join(",");
  const body = rows.map(r => cols.map(c => csvEscape((r as any)[c] ?? "")).join(",")).join("\n");
  await fs.writeFile(file, header + "\n" + body, "utf8");
}

function norm(s:string) {
  return (s||"").toLowerCase().replace(/\s+/g," ").trim();
}

function scoreTextMatch(a: string, b: string) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  const d = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - (d / Math.max(1, maxLen)); // 1 = identical
}

type Candidate = { url: string; score: number; sourceWeight: number };

const DEFAULT_SOURCES = ["brand","amazon","iherb","walmart","vitaminshoppe","costco","gnc","target","bestbuy","superstore","loblaws","shoppersdrugmart"];

function domainKey(u: string) {
  try {
    const d = new URL(u).hostname.replace(/^www\./,"");
    return d;
  } catch { return ""; }
}

function preferDomains(row: Row): string[] {
  const prefs = (row.source_priority || "").split(",").map(s => s.trim()).filter(Boolean);
  // Map short keys to domains
  const map: Record<string,string[]> = {
    brand: row.brand_domain ? [row.brand_domain.replace(/^https?:\/\//,"").replace(/^www\./,"")] : [],
    amazon: ["amazon.com","amazon.ca"],
    iherb: ["iherb.com"],
    walmart: ["walmart.com","walmart.ca"],
    vitaminshoppe: ["vitaminshoppe.com"],
    costco: ["costco.com","costco.ca"],
    gnc: ["gnc.com"],
    target: ["target.com"],
    bestbuy: ["bestbuy.com","bestbuy.ca"],
    superstore: ["realcanadiansuperstore.ca"],
    loblaws: ["loblaws.ca"],
    shoppersdrugmart: ["shoppersdrugmart.ca","well.ca"]
  };
  const out: string[] = [];
  const add = (k:string) => (map[k]||[]).forEach(d => { if (!out.includes(d)) out.push(d); });
  (prefs.length ? prefs : DEFAULT_SOURCES).forEach(add);
  return out;
}

function buildQueries(row: Row) {
  const parts = [row.brand, row.product_name, row.variant_generic, row.size_label].filter(Boolean).join(" ");
  const brandSite = row.brand_domain ? ` site:${row.brand_domain}` : "";
  return [
    `${parts}${brandSite}`,
    `${row.brand} ${row.product_name} ${row.variant_generic||""}`.trim(),
    `${row.brand} ${row.product_name} reviews`,
  ];
}

// Very light HTML SERP querying via DuckDuckGo HTML (no API key).
// Note: honor each website's TOS when fetching target pages.
async function searchDuckDuckGo(query: string): Promise<string[]> {
  const url = "https://duckduckgo.com/html/?q=" + encodeURIComponent(query);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SuppScanBot/1.0)" } });
  const html = await res.text();
  const $ = cheerioLoad(html);
  const links = $("a.result__a, a.result__url").map((i, el) => $(el).attr("href")).get()
    .filter(Boolean) as string[];
  // DDG sometimes wraps URLs with '/l/?kh=-1&uddg=<encoded>'
  const clean = links.map(href => {
    try {
      const u = new URL(href.startsWith("http") ? href : "https://duckduckgo.com" + href);
      const uddg = u.searchParams.get("uddg");
      return uddg ? decodeURIComponent(uddg) : href;
    } catch { return href; }
  });
  return clean;
}

async function fetchAndValidate(row: Row, url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SuppScanBot/1.0)" } });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerioLoad(html);
    // prefer a canonical if present
    const canonical = $('link[rel="canonical"]').attr("href") || url;

    // Try JSON-LD Product blocks
    const scripts = Array.from($('script[type="application/ld+json"]')).map(s => $(s).text()).filter(Boolean);
    let productScore = 0;
    let brandScore = 0;
    for (const script of scripts) {
      try {
        const json = JSON.parse(script);
        const items = Array.isArray(json) ? json : [json];
        for (const obj of items) {
          const types = ([] as any[]).concat((obj["@type"]||[]));
          const typeStr = (typeof obj["@type"]==="string") ? obj["@type"] : types.join(",");
          if (typeStr && typeStr.toLowerCase().includes("product")) {
            const name = obj["name"] || "";
            const brand = (typeof obj["brand"] === "string") ? obj["brand"] : (obj["brand"] && obj["brand"]["name"]) || "";
            productScore = Math.max(productScore, scoreTextMatch(name || "", `${row.product_name} ${row.variant_generic||""}`));
            brandScore = Math.max(brandScore, scoreTextMatch(brand || "", row.brand));
          }
        }
      } catch {}
    }

    // fallback: use page title or h1
    if (productScore < 0.5) {
      const title = ($("title").first().text() || "").trim();
      productScore = Math.max(productScore, scoreTextMatch(title, `${row.product_name} ${row.variant_generic||""}`));
    }
    if (brandScore < 0.5) {
      const dom = domainKey(url);
      brandScore = Math.max(brandScore, norm(dom).includes(norm(row.brand).split(" ").join(""))
        ? 0.6 : 0);
    }

    const ok = productScore >= 0.55 && brandScore >= 0.5;
    if (!ok) return null;

    // best guess for review url: same page or anchor
    let reviewUrl = canonical;
    if ($("#reviews").length || $('[id*="review"]').length) {
      const anchorId = $("#reviews").attr("id") || $('[id*="review"]').first().attr("id");
      if (anchorId) reviewUrl = canonical.split("#")[0] + "#" + anchorId;
    }

    return { canonical, reviewUrl };
  } catch {
    return null;
  }
}

function weightForDomain(dom: string, preferred: string[]) {
  const ix = preferred.findIndex(d => dom.endsWith(d));
  return ix >= 0 ? (preferred.length - ix) : 0;
}

async function enrichRow(row: Row): Promise<Row> {
  try {
    if (args["only-missing"] === "true" && row.canonical_product_url) {
      return row;
    }
    const preferred = preferDomains(row);

    // 1) Direct brand guess if brand_domain exists
    if (row.brand_domain) {
      // Skip guessing slugs; go directly to search with site: filter
    }

    // 2) Search candidates
    const queries = buildQueries(row);
    let candidates: Candidate[] = [];
    for (const q of queries) {
      const urls = await searchDuckDuckGo(q);
      for (const u of urls) {
        const dom = domainKey(u);
        const sw = weightForDomain(dom, preferred);
        // deprioritize obvious non-product pages
        if (!dom) continue;
        if (/\/(cart|faq|contact|login|account|polic|blog|article|terms|privacy)/i.test(u)) continue;
        candidates.push({ url: u, score: 0, sourceWeight: sw });
      }
      // be gentle
      await sleep(500);
    }
    // de-dupe by URL
    const seen = new Set<string>();
    candidates = candidates.filter(c => (seen.has(c.url) ? false : (seen.add(c.url), true)));

    // Sort by sourceWeight desc then try validation
    candidates.sort((a,b) => b.sourceWeight - a.sourceWeight);

    for (const c of candidates.slice(0, 10)) {
      const validated = await fetchAndValidate(row, c.url);
      if (validated) {
        row.canonical_product_url = validated.canonical;
        row.review_url_1 = validated.reviewUrl;
        // for retailers with separate "see all reviews" links, we could later add review_url_2
        row.last_verified_utc = new Date().toISOString();
        row.notes = row.notes ? (row.notes + " | enriched") : "enriched";
        return row;
      }
    }

    // last resort: leave as-is
    row.notes = row.notes ? (row.notes + " | no_match") : "no_match";
    return row;
  } catch (e:any) {
    row.notes = row.notes ? (row.notes + ` | error: ${e?.message||"unknown"}`) : `error: ${e?.message||"unknown"}`;
    return row;
  }
}

async function main() {
  const rows = await readCSV(IN);
  const subset = LIMIT ? rows.slice(0, LIMIT) : rows;
  const limit = pLimit(CONCURRENCY);

  let processed = 0;
  const enriched = await Promise.all(subset.map(r => limit(async () => {
    const out = await enrichRow(r);
    processed++;
    if (processed % 25 === 0) {
      console.log(`Processed ${processed}/${subset.length}`);
    }
    return out;
  })));

  // Merge back if LIMIT was used
  if (LIMIT && LIMIT < rows.length) {
    for (let i=0;i<LIMIT;i++) rows[i] = enriched[i];
    await writeCSV(OUT, rows);
  } else {
    await writeCSV(OUT, enriched);
  }
  console.log("Wrote:", OUT);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
