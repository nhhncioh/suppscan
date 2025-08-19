export type Ingredient = {
  name: string;
  amount?: number | null;
  unit?: "mcg" | "mg" | "g" | "iu" | null;
  raw?: string;
};

const unitMap: Record<string, Ingredient["unit"]> = {
  mg: "mg",
  g: "g",
  mcg: "mcg",
  "µg": "mcg",
  ug: "mcg",
  iu: "iu",
  ui: "iu", // FR labels often show UI = IU
};

function nspaces(s: string) {
  return s.replace(/[\u00A0\u202F]/g, " ").replace(/\s{2,}/g, " ").trim();
}
function normNum(x: string): number | null {
  const n = Number(x.replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function stripBrandPrefix(name: string, brand?: string | null) {
  if (!brand) return name;
  const b = nspaces(brand).toLowerCase();
  let t = nspaces(name);
  if (t.toLowerCase().startsWith(b + " ")) t = t.slice(brand.length).trim();
  return t;
}
function tidyName(s: string, brand?: string | null): string {
  let t = nspaces(s).replace(/[•·:*|]+/g, " ").trim();
  t = stripBrandPrefix(t, brand);
  if (/^(?:vit(?:amine)?\s*)?d\s*3?$/i.test(t)) return "Vitamin D3";
  return t;
}

function parseOne(line: string, brand?: string | null) {
  const l = nspaces(line);

  // Vitamin D anywhere on the line (handles FR UI and missing "3")
  // e.g., "Jamieson D 1 000 UI" or "Vitamine D3 1000 IU"
  let m = l.match(/\b(?:vit(?:amine)?\s*)?d\s*3?\s+(?<amount>[\d\s.,]+)\s*(?<unit>iu|ui|mcg|µg|ug)\b/i);
  if (m) {
    return { name: "Vitamin D3", amount: normNum(m.groups!.amount), unit: unitMap[m.groups!.unit.toLowerCase()], raw: l };
  }

  // Generic: <name> <amount> <unit>  (allow brand before the real name; we grab the last name-like segment)
  m = l.match(/^(?<name>.+?)\s+(?<amount>\d[\d\s.,]*)\s*(?<unit>iu|ui|mg|mcg|µg|ug|g)\b/i);
  if (!m) return null;

  // Take the tail-most token cluster as the name (before the amount); then strip brand if prefixed
  const name = tidyName(m.groups!.name, brand);
  return {
    name,
    amount: normNum(m.groups!.amount),
    unit: unitMap[m.groups!.unit.toLowerCase()],
    raw: l,
  };
}

export function extractIngredients(lines: string[], brandGuess?: string | null) {
  const out: Ingredient[] = [];
  const seen = new Set<string>();
  const L = lines.map(nspaces).filter(Boolean);

  for (let i = 0; i < L.length; i++) {
    let ing = parseOne(L[i], brandGuess);

    // two-line window (e.g., "D3" + "1 000 UI")
    if (!ing && i + 1 < L.length) ing = parseOne(L[i] + " " + L[i + 1], brandGuess);

    if (ing) {
      const key = `${ing.name}|${ing.amount ?? ""}|${ing.unit ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(ing);
      }
      if ((L[i] + " " + (L[i + 1] || "")) === ing.raw) i++; // skip next if we consumed it
    }
  }

  // de-dupe by name (keep first)
  const uniq: Ingredient[] = [];
  const byName = new Set<string>();
  for (const ing of out) {
    const k = ing.name.toLowerCase();
    if (!byName.has(k)) {
      byName.add(k);
      uniq.push(ing);
    }
  }
  return uniq;
}
