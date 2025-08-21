import { buildKeywords, slugify, brandToHosts } from "@/lib/retail";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) SuppScan/1.0 Chrome/122 Safari/537.36";

async function fetchText(url: string, ms = 3500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return { ok: false as const };
    const text = await res.text();
    return { ok: true as const, text, finalUrl: res.url };
  } catch {
    return { ok: false as const };
  } finally {
    clearTimeout(id);
  }
}

function looksLikeProduct(html: string) {
  const h = html.toLowerCase();
  if (h.includes('property="og:type"') && h.includes('content="product"')) return true;
  if (h.includes('itemtype="http://schema.org/product"')) return true;
  if (h.includes("add to cart") || h.includes("add-to-cart")) return true;
  if (h.includes('"@type":"Product"')) return true; // JSON-LD
  return false;
}

export async function discoverProductUrl(input: {
  brand?: string | null;
  product?: string | null;
  ingredient?: string | null;
  amount?: number | null;
  unit?: string | null;
  locale?: string | null; // navigator.language-ish
}) {
  const { brand, product, ingredient, amount, unit, locale } = input;
  const keywords = buildKeywords({ brand, product, ingredient, amount, unit }) ?? "";
  const prodSlug = slugify(product || ingredient || "");
  const hosts = brandToHosts(brand ?? "", locale ?? undefined);

  // Path patterns we’ll try in order
  const productPaths = Array.from(
    new Set(
      [
        prodSlug && `/products/${prodSlug}`,
        prodSlug && `/product/${prodSlug}`,
        prodSlug && `/collections/${prodSlug}`,
        prodSlug && `/collections/${prodSlug}/products/${prodSlug}`,
        prodSlug && `/shop/${prodSlug}`,
        prodSlug && `/en/products/${prodSlug}`,
        prodSlug && `/fr/produits/${prodSlug}`,
      ].filter(Boolean) as string[]
    )
  );

  const searchPaths = [
    `/search?q=${encodeURIComponent(keywords)}`,
    `/search?type=product&q=${encodeURIComponent(keywords)}`, // Shopify
    `/catalogsearch/result/?q=${encodeURIComponent(keywords)}`, // Magento
    `/?s=${encodeURIComponent(keywords)}`,
  ];

  // Probe each host for product-like pages first, then on-site search
  for (const host of hosts) {
    const base = `https://${host}`;

    for (const p of productPaths) {
      const url = base + p;
      const r = await fetchText(url);
      if (r.ok && r.text && looksLikeProduct(r.text)) {
        return { url: r.finalUrl || url, source: "manufacturer" as const };
      }
    }

    for (const sp of searchPaths) {
      const url = base + sp;
      const r = await fetchText(url);
      if (r.ok && r.text) {
        // If search page itself reveals a product result (quick heuristic)
        if (looksLikeProduct(r.text)) return { url: r.finalUrl || url, source: "manufacturer-search" as const };
        // still useful as a search page on the brand site
        return { url, source: "manufacturer-search" as const };
      }
    }
  }

  // Fallback: universal Amazon search (generic, works for anything)
  const tld = (locale || "").toLowerCase().includes("ca")
    ? "ca"
    : (locale || "").toLowerCase().includes("gb") || (locale || "").toLowerCase().includes("uk")
    ? "co.uk"
    : (locale || "").toLowerCase().includes("au")
    ? "com.au"
    : "com";
  const amazon = `https://www.amazon.${tld}/s?k=${encodeURIComponent(keywords)}&i=hpc&ref=SuppScan`;
  return { url: amazon, source: "amazon-search" as const };
}
