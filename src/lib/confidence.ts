import type { IngredientAmount } from "@/types/suppscan";

export type UploadResult = {
  ocr?: { raw_text?: string; lines?: string[] } | null;
  extracted?: { ingredients?: IngredientAmount[]; brandGuess?: string | null; productGuess?: string | null; badges?: string[] } | null;
  meta?: { name?: string; type?: string; size?: number } | null;
  barcode?: string | null;
};

export type Confidence = { score: number; level: "Low" | "Medium" | "High"; reasons: string[] };

export function scoreConfidence(u: UploadResult): Confidence {
  const reasons: string[] = [];
  let score = 0;

  const lineCount = u.ocr?.lines?.length ?? 0;
  if (lineCount >= 30) { score += 30; reasons.push("OCR detected many lines"); }
  else if (lineCount >= 10) { score += 20; reasons.push("OCR detected enough text"); }
  else { score += 10; reasons.push("Limited text detected"); }

  const ingCount = u.extracted?.ingredients?.length ?? 0;
  if (ingCount >= 3) { score += 30; reasons.push("Multiple ingredients parsed"); }
  else if (ingCount >= 1) { score += 20; reasons.push("At least one ingredient parsed"); }
  else { reasons.push("No ingredients parsed"); }

  const hasBrand = !!u.extracted?.brandGuess;
  if (hasBrand) { score += 10; reasons.push("Brand detected"); }

  const hasProduct = !!u.extracted?.productGuess;
  if (hasProduct) { score += 10; reasons.push("Product detected"); }

  if (u.barcode) { score += 10; reasons.push("Barcode detected"); }

  if ((u.meta?.size ?? 0) > 0) { score += 5; }

  if (score > 100) score = 100;
  const level: Confidence["level"] = score >= 75 ? "High" : score >= 45 ? "Medium" : "Low";
  return { score, level, reasons };
}

const BADGE_WORDS: Record<string, string[]> = {
  Vegan: ["vegan", "plant-based"],
  "Gluten-free": ["gluten free", "gluten-free"],
  "Dairy-free": ["dairy free", "dairy-free", "lactose free"],
  Kosher: ["kosher"],
  Halal: ["halal"],
  NonGMO: ["non gmo", "non-gmo", "gmo free"]
};

export function detectBadgesFromText(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const t = raw.toLowerCase();
  const out: string[] = [];
  for (const [badge, keys] of Object.entries(BADGE_WORDS)) {
    if (keys.some(k => t.includes(k))) out.push(badge);
  }
  return out;
}
