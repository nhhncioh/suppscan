export function buildKeywords(opts: {
  brand?: string | null;
  product?: string | null;
  ingredient?: string | null;
  amount?: number | null;
  unit?: string | null;
}) {
  const parts = [
    opts.brand?.toString() ?? "",
    opts.product?.toString() ?? "",
    opts.ingredient?.toString() ?? "",
    opts.amount ? `${opts.amount} ${opts.unit ?? ""}` : "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return parts || null;
}

export function slugify(s?: string) {
  return (s ?? "")
    .toLowerCase()
    .replace(/vit[\.\s]*d3?\b/g, "vitamin d") // normalize variants
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function guessTlds(locale?: string) {
  // No cheats; just a generic priority list with a light locale nudge
  const base: string[] = [".com", ".co.uk", ".ca", ".de", ".fr", ".it", ".es", ".com.au"];
  if (!locale) return base;
  const low = locale.toLowerCase();
  const front: string[] = [];
  if (low.includes("ca")) front.push(".ca");
  if (low.includes("gb") || low.includes("uk")) front.push(".co.uk");
  if (low.includes("au")) front.push(".com.au");
  // return locale-favored first, then base (dedup)
  return Array.from(new Set([...front, ...base]));
}

export function brandToHosts(brand?: string, locale?: string) {
  const b = (brand ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (!b) return [] as string[];
  // try compact and hyphenated brand shapes
  const cores = Array.from(new Set([
    b.replace(/\s+/g, ""),
    b.replace(/\s+/g, "-"),
  ]));
  const tlds = guessTlds(locale);
  const hosts: string[] = [];
  for (const core of cores) {
    for (const t of tlds) {
      hosts.push(`www.${core}${t}`, `${core}${t}`);
    }
  }
  return hosts;
}
