function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/vit[\.\s]*d3?\b/g, "vitamin d")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function chooseProductUrl(params: {
  manufacturerUrl?: string;
  currentUrl?: string;
  productName?: string;
  firstIngredient?: string;
}): string | undefined {
  const { manufacturerUrl, currentUrl, productName, firstIngredient } = params;
  if (currentUrl && /\/products?\//i.test(currentUrl)) return currentUrl;

  let host = "";
  try { if (manufacturerUrl) host = new URL(manufacturerUrl).host; } catch {}
  if (!host) {
    try { if (currentUrl) host = new URL(currentUrl).host; } catch {}
  }
  if (!host) return currentUrl;

  const base = (productName || firstIngredient || "").trim();
  if (!base) return currentUrl;

  const slug = slugify(base);
  if (!slug) return currentUrl;

  // Prefer modern /products/<slug>
  const preferred = `https://${host}/products/${slug}`;
  if (!currentUrl || /\.php($|\?)/i.test(currentUrl) || !/\/products?\//i.test(currentUrl)) {
    return preferred;
  }
  return currentUrl;
}
