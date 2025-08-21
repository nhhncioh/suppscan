import type { IngredientAmount } from "@/types/suppscan";

/* ===== Types ===== */
export type UploadResult = {
  ocr?: { raw_text?: string; lines?: string[] } | null;
  extracted?: {
    ingredients?: IngredientAmount[];
    brandGuess?: string | null;
    productGuess?: string | null;
    badges?: string[];
    marks?: string[];
  } | null;
  meta?: { name?: string; type?: string; size?: number } | null;
  barcode?: string | null;
  explanation?: any | null;
};

export type Confidence = { score: number; level: "Low" | "Medium" | "High"; reasons: string[] };

/* ===== Dietary / marketing badges from OCR text ===== */
const BADGE_PATTERNS: Record<string, RegExp[]> = {
  "Vegan":        [/\bvegan\b/i],
  "Vegetarian":   [/\bvegetarian\b/i],
  "Gluten-free":  [/\bgluten[-\s]?free\b/i],
  "Non-GMO":      [/\bnon[-\s]?gmo\b/i, /\bgmo[-\s]?free\b/i, /\bno\s*gmos?\b/i],
  "Sugar-free":   [/\bsugar[-\s]?free\b/i, /\bno\s+added\s+sugar\b/i],
  "Dairy-free":   [/\bdairy[-\s]?free\b/i, /\blactose[-\s]?free\b/i],
  "Soy-free":     [/\bsoy[-\s]?free\b/i],
  "Keto-friendly":[/\bketo(\s+friendly)?\b/i],
  "Paleo":        [/\bpaleo\b/i],
  "Halal":        [/\bhalal\b/i],
  "Kosher":       [/\bkosher\b/i],
  "3rd-party tested": [/\bthird[-\s]?party\b.*\btested\b/i, /\bindependent\b.*\btested\b/i],
  "GMP":          [/\bgmp\b/i, /\bgood\s+manufacturing\s+practices?\b/i]
};

export function detectBadgesFromText(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const [label, patterns] of Object.entries(BADGE_PATTERNS)) {
    if (patterns.some(rx => rx.test(raw))) out.push(label);
  }
  return Array.from(new Set(out));
}

/* ===== Trusted certification marks ===== */
const TRUST_MARK_PATTERNS: Record<string, RegExp[]> = {
  "USP Verified": [
    /\busp\s+verified\b/i,
    /\busp\b(?=.*verified)/i
  ],
  "NSF Certified for Sport": [
    /\bnsf\b.*certified.*sport/i,
    /\bcertified\s+for\s+sport\b/i
  ],
  "NSF Certified": [
    /\bnsf\b.*certified\b/i
  ],
  "Informed Choice": [
    /\binformed[-\s]?choice\b/i
  ],
  "Informed Sport": [
    /\binformed[-\s]?sport\b/i
  ],
  "BSCG Certified Drug Free": [
    /\bbscg\b.*certified.*drug.*free/i,
    /\bcertified.*drug.*free\b/i
  ]
};

export function detectTrustedMarksFromText(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const [label, patterns] of Object.entries(TRUST_MARK_PATTERNS)) {
    if (patterns.some(rx => rx.test(raw))) out.push(label);
  }
  return Array.from(new Set(out));
}

export function getTrustedMarkLink(mark: string): string | null {
  const map: Record<string, string> = {
    "USP Verified": "https://www.quality-supplements.org/verified-products",
    "NSF Certified for Sport": "https://www.nsfsport.com/certified-products",
    "NSF Certified": "https://www.nsf.org/certified-products-systems",
    "Informed Choice": "https://www.informed-choice.org/certified-product-brands",
    "Informed Sport": "https://www.informed-sport.com/certified-products",
    "BSCG Certified Drug Free": "https://www.bscg.org/certified-drug-free-database"
  };
  return map[mark] || null;
}

/* ===== Confidence scoring (improved) ===== */
export function scoreConfidence(u: UploadResult): Confidence {
  const reasons: string[] = [];
  let score = 0;

  // OCR signals
  const lineCount = u.ocr?.lines?.length ?? 0;
  const textLen = (u.ocr?.raw_text || "").length;
  if (lineCount >= 30 || textLen >= 1200) { score += 25; reasons.push("Strong OCR text"); }
  else if (lineCount >= 10 || textLen >= 400) { score += 18; reasons.push("Adequate OCR text"); }
  else { score += 8; reasons.push("Limited OCR text"); }

  // Extraction completeness
  const ings = u.extracted?.ingredients ?? [];
  const ingCount = ings.length;
  const parsedAmounts = ings.filter(i => i?.amount != null && !!i?.unit).length;
  if (ingCount >= 3) { score += 18; reasons.push("Multiple ingredients parsed"); }
  else if (ingCount >= 1) { score += 12; reasons.push("At least one ingredient parsed"); }
  else { reasons.push("No ingredients parsed"); }
  if (parsedAmounts >= 1) { score += 10; reasons.push("At least one dose parsed"); }
  if (parsedAmounts >= 3) { score += 6; }

  // Identity
  if (u.extracted?.brandGuess) { score += 8; reasons.push("Brand detected"); }
  if (u.extracted?.productGuess) { score += 6; reasons.push("Product detected"); }

  // Barcode
  if (u.barcode) { score += 5; reasons.push("Barcode detected"); }

  // Explanation quality
  const exp = u.explanation || {};
  const hasGuidelineUseful = Array.isArray(exp.label_vs_guidelines)
    && exp.label_vs_guidelines.some((g: any) => g?.category && g.category !== "unknown");
  const sectionCount =
    (Array.isArray(exp.uses) && exp.uses.length ? 1 : 0) +
    (Array.isArray(exp.take_if) && exp.take_if.length ? 1 : 0) +
    (Array.isArray(exp.may_improve) && exp.may_improve.length ? 1 : 0) +
    (Array.isArray(exp.how_to_take) && exp.how_to_take.length ? 1 : 0);

  if (hasGuidelineUseful) { score += 12; reasons.push("Numeric guideline match present"); }
  if (sectionCount >= 3) { score += 12; reasons.push("Most guidance sections filled"); }
  else if (sectionCount >= 1) { score += 6; reasons.push("Some guidance sections filled"); }

  if (score > 100) score = 100;
  const level: Confidence["level"] = score >= 80 ? "High" : score >= 55 ? "Medium" : "Low";
  return { score, level, reasons };
}
