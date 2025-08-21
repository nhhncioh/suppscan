import { NextResponse } from "next/server";
export const runtime = "nodejs";

type RankItem = { url: string; text: string; score: number; domain: string; path: string };

function getDomainPath(u: string): { domain: string; path: string } {
  try {
    const { hostname, pathname } = new URL(u);
    return { domain: hostname.toLowerCase().replace(/^www\./, ""), path: pathname.toLowerCase() };
  } catch { return { domain: "", path: "" }; }
}

function decodeDuck(u: string): string {
  try {
    const url = new URL(u, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
  } catch {}
  return u;
}

function brandToken(s?: string | null): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const BAD_HOST_SNIPPETS = [
  "amazon.", "walmart.", "ebay.", "facebook.", "pinterest.", "reddit.", "youtube.",
  "iherb.", "instacart.", "target.", "shopify.", "shop.app", "bing.", "duckduckgo."
];

function looksLikeProductPath(p: string) {
  return /\/products?\//.test(p) || /\/product\//.test(p) || /\/shop\//.test(p) || /\/item\//.test(p);
}

function scoreUrl(fullUrl: string, text: string, brand: string, qTokens: string[]): number {
  const { domain, path } = getDomainPath(fullUrl);
  const t = text.toLowerCase();

  for (const bad of BAD_HOST_SNIPPETS) if (domain.includes(bad)) return -10;

  let score = 0;
  if (brand && domain.includes(brand)) score += 8;
  if (looksLikeProductPath(path)) score += 4;

  for (const tok of qTokens) {
    if (tok.length < 2) continue;
    if (t.includes(tok)) score += 1;
    if (fullUrl.toLowerCase().includes(tok)) score += 1;
  }

  if (fullUrl.startsWith("https://")) score += 1;
  score += Math.max(0, 3 - Math.log10(Math.max(10, fullUrl.length)));

  return score;
}

async function fetchDuckHtml(q: string) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=us-en&ia=web`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://duckduckgo.com/",
    },
    cache: "no-store",
  });
  return await res.text();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brand      = (searchParams.get("brand")      || "").trim();
    const product    = (searchParams.get("product")    || "").trim();
    const ingredient = (searchParams.get("ingredient") || "").trim();
    const amount     = (searchParams.get("amount")     || "").trim();
    const unit       = (searchParams.get("unit")       || "").trim();

    const parts = [brand, product, ingredient, [amount, unit].filter(Boolean).join(" ")].filter(Boolean);
    if (parts.length === 0) return NextResponse.json({ url: null, reason: "no_query" }, { status: 400 });

    const q = parts.join(" ").replace(/\s+/g, " ").trim();
    const html = await fetchDuckHtml(q);

    const anchors = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gis)];
    const ranked: RankItem[] = [];
    const bTok = brandToken(brand);
    const qTokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    for (const m of anchors) {
      let href = m[1];
      const txt = m[2].replace(/<[^>]+>/g, " ");
      if (!/^https?:\/\//i.test(href)) href = new URL(href, "https://duckduckgo.com").toString();
      href = decodeDuck(href);

      const { domain, path } = getDomainPath(href);
      if (!domain) continue;
      if (ranked.some(r => r.url === href)) continue;

      const score = scoreUrl(href, txt, bTok, qTokens);
      if (score <= -10) continue;
      ranked.push({ url: href, text: txt, score, domain, path });
    }

    if (ranked.length === 0) return NextResponse.json({ url: null, reason: "no_results" }, { status: 404 });

    ranked.sort((a, b) => b.score - a.score || a.url.length - b.url.length);
    let best = ranked[0];

    // Prefer brand domain in top N; if no productish path, take shortest brand URL.
    const top = ranked.slice(0, 12);
    const brandHits = bTok ? top.filter(r => r.domain.includes(bTok)) : [];
    const brandProduct = brandHits.find(r => looksLikeProductPath(r.path));
    if (brandProduct) {
      best = brandProduct;
    } else if (brandHits.length) {
      best = [...brandHits].sort((a, b) => a.path.length - b.path.length || b.score - a.score)[0];
    }

    return NextResponse.json({
      url: best.url,
      source: "duckduckgo",
      query: q,
      debugTop5: ranked.slice(0, 5).map(r => ({ url: r.url, score: r.score })),
    });
  } catch (err) {
    return NextResponse.json({ url: null, error: String(err) }, { status: 500 });
  }
}
