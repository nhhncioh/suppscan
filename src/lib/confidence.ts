// src/lib/confidence.ts - COMPLETE FILE
import type { IngredientAmount } from "@/types/suppscan";
import type { CleanlinessScore, IngredientAnalysis } from "./ingredientCleanliness";

/* ===== Types ===== */
export type UploadResult = {
  ocr?: { raw_text?: string; lines?: string[]; confidence?: string } | null;
  extracted?: {
    ingredients?: IngredientAmount[];
    brandGuess?: string | null;
    productGuess?: string | null;
    badges?: string[];
    marks?: string[];
    cleanlinessScore?: CleanlinessScore; // NEW
    ingredientAnalysis?: IngredientAnalysis[]; // NEW
  } | null;
  meta?: { name?: string; type?: string; size?: number; uploadedAt?: string } | null;
  barcode?: string | null;
  explanation?: any | null;
};

export type Confidence = { 
  score: number; 
  level: "Low" | "Medium" | "High"; 
  reasons: string[] 
};

/* ===== Dietary / marketing badges from OCR text ===== */
const BADGE_PATTERNS: Record<string, RegExp[]> = {
  "Vegan": [/\bvegan\b/i],
  "Vegetarian": [/\bvegetarian\b/i],
  "Gluten-free": [/\bgluten[-\s]?free\b/i],
  "Non-GMO": [/\bnon[-\s]?gmo\b/i, /\bgmo[-\s]?free\b/i, /\bno\s*gmos?\b/i],
  "Sugar-free": [/\bsugar[-\s]?free\b/i, /\bno\s+added\s+sugar\b/i],
  "Dairy-free": [/\bdairy[-\s]?free\b/i, /\blactose[-\s]?free\b/i],
  "Soy-free": [/\bsoy[-\s]?free\b/i],
  "Keto-friendly": [/\bketo(\s+friendly)?\b/i],
  "Paleo": [/\bpaleo\b/i],
  "Halal": [/\bhalal\b/i],
  "Kosher": [/\bkosher\b/i],
  "Organic": [/\borganic\b/i],
  "Natural": [/\bnatural\b/i, /\ball\s+natural\b/i],
  "3rd-party tested": [/\bthird[-\s]?party\b.*\btested\b/i, /\bindependent\b.*\btested\b/i],
  "GMP": [/\bgmp\b/i, /\bgood\s+manufacturing\s+practices?\b/i],
  "FDA Registered": [/\bfda\s+registered\b/i, /\bregistered\s+facility\b/i]
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
  ],
  "ConsumerLab": [
    /\bconsumerlab\b/i,
    /\bcl\s+quality\s+reviewed\b/i
  ],
  "Labdoor": [
    /\blabdoor\b/i
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
    "BSCG Certified Drug Free": "https://www.bscg.org/certified-drug-free-database",
    "ConsumerLab": "https://www.consumerlab.com/",
    "Labdoor": "https://labdoor.com/"
  };
  return map[mark] || null;
}

/* ===== Enhanced Confidence scoring ===== */
export function scoreConfidence(u: UploadResult): Confidence {
  const reasons: string[] = [];
  let score = 0;

  // OCR quality signals
  const lineCount = u.ocr?.lines?.length ?? 0;
  const textLen = (u.ocr?.raw_text || "").length;
  const ocrConfidence = u.ocr?.confidence || "unknown";
  
  if (lineCount >= 30 || textLen >= 1200) { 
    score += 25; 
    reasons.push("Strong OCR text extraction"); 
  } else if (lineCount >= 10 || textLen >= 400) { 
    score += 18; 
    reasons.push("Adequate OCR text extraction"); 
  } else if (lineCount >= 5 || textLen >= 200) {
    score += 12;
    reasons.push("Basic OCR text extraction");
  } else { 
    score += 8; 
    reasons.push("Limited OCR text extraction"); 
  }

  // OCR confidence bonus
  if (ocrConfidence === "high") {
    score += 5;
    reasons.push("High OCR confidence");
  } else if (ocrConfidence === "medium") {
    score += 3;
  }

  // Extraction completeness
  const ings = u.extracted?.ingredients ?? [];
  const ingCount = ings.length;
  const parsedAmounts = ings.filter(i => i?.amount != null && !!i?.unit).length;
  
  if (ingCount >= 5) { 
    score += 20; 
    reasons.push("Multiple ingredients parsed"); 
  } else if (ingCount >= 3) { 
    score += 15; 
    reasons.push("Several ingredients parsed"); 
  } else if (ingCount >= 1) { 
    score += 10; 
    reasons.push("At least one ingredient parsed"); 
  } else { 
    reasons.push("No ingredients parsed"); 
  }
  
  if (parsedAmounts >= 3) { 
    score += 12; 
    reasons.push("Multiple doses parsed"); 
  } else if (parsedAmounts >= 1) { 
    score += 8; 
    reasons.push("At least one dose parsed"); 
  }

  // Identity detection
  if (u.extracted?.brandGuess) { 
    score += 8; 
    reasons.push("Brand detected"); 
  }
  if (u.extracted?.productGuess) { 
    score += 6; 
    reasons.push("Product name detected"); 
  }

  // Quality indicators
  const badges = u.extracted?.badges ?? [];
  const trustedMarks = u.extracted?.marks ?? [];
  
  if (badges.length >= 3) {
    score += 10;
    reasons.push("Multiple quality badges detected");
  } else if (badges.length >= 1) {
    score += 6;
    reasons.push("Quality badges detected");
  }

  if (trustedMarks.length > 0) {
    score += 12;
    reasons.push("Trusted certification marks detected");
  }

  // Barcode bonus
  if (u.barcode) { 
    score += 5; 
    reasons.push("Barcode detected"); 
  }

  // NEW: Cleanliness scoring impact
  const cleanlinessScore = u.extracted?.cleanlinessScore;
  if (cleanlinessScore) {
    if (cleanlinessScore.category === 'excellent') {
      score += 15;
      reasons.push("Excellent ingredient quality (clean formulation)");
    } else if (cleanlinessScore.category === 'good') {
      score += 10;
      reasons.push("Good ingredient quality");
    } else if (cleanlinessScore.category === 'fair') {
      score += 5;
      reasons.push("Fair ingredient quality");
    } else {
      score -= 3;
      reasons.push("Concerning ingredient quality detected");
    }

    // Additional bonus for having cleanliness analysis at all
    score += 3;
    reasons.push("Ingredient cleanliness analyzed");
    
    // Bonus for clean ingredients
    if (cleanlinessScore.positives.length > 0) {
      score += Math.min(cleanlinessScore.positives.length * 2, 10);
      reasons.push(`${cleanlinessScore.positives.length} beneficial ingredients identified`);
    }
  }

  // Explanation quality
  const exp = u.explanation || {};
  const hasGuidelineUseful = Array.isArray(exp.label_vs_guidelines)
    && exp.label_vs_guidelines.some((g: any) => g?.category && g.category !== "unknown");
  const sectionCount =
    (Array.isArray(exp.uses) && exp.uses.length ? 1 : 0) +
    (Array.isArray(exp.how_to_take) && exp.how_to_take.length ? 1 : 0) +
    (Array.isArray(exp.take_if) && exp.take_if.length ? 1 : 0) +
    (Array.isArray(exp.may_improve) && exp.may_improve.length ? 1 : 0);

  if (hasGuidelineUseful) { 
    score += 10; 
    reasons.push("Guidelines comparison available"); 
  }
  if (sectionCount >= 3) { 
    score += 8; 
    reasons.push("Comprehensive explanation generated"); 
  }

  // File quality indicators
  const fileSize = u.meta?.size ?? 0;
  if (fileSize > 500000) { // > 500KB
    score += 5;
    reasons.push("High resolution image");
  } else if (fileSize > 100000) { // > 100KB
    score += 3;
    reasons.push("Good resolution image");
  }

  // Determine confidence level
  let level: "Low" | "Medium" | "High";
  if (score >= 80) {
    level = "High";
  } else if (score >= 50) {
    level = "Medium";
  } else {
    level = "Low";
  }

  // Cap the score at 100
  score = Math.min(score, 100);

  return {
    score: Math.round(score),
    level,
    reasons
  };
}

/* ===== Brand quality assessment ===== */
export function assessBrandQuality(brandName?: string | null): {
  tier: 'premium' | 'good' | 'budget' | 'unknown';
  score: number;
  reasoning: string;
} {
  if (!brandName) {
    return { tier: 'unknown', score: 3, reasoning: 'Brand not detected' };
  }

  const brand = brandName.toLowerCase();
  
  // Premium brands (highest quality standards)
  const premiumBrands = [
    'thorne', 'life extension', 'nordic naturals', 'pure encapsulations',
    'designs for health', 'metagenics', 'orthomolecular', 'integrative therapeutics'
  ];
  
  // Good quality brands
  const goodBrands = [
    'garden of life', 'now foods', 'solgar', 'nature made', 'country life',
    'rainbow light', 'new chapter', 'bluebonnet', 'natural factors'
  ];
  
  // Budget brands (lower cost, basic quality)
  const budgetBrands = [
    'nature bounty', 'spring valley', 'kirkland', 'vitafusion', 'one a day',
    'centrum', 'equate', 'member\'s mark'
  ];

  if (premiumBrands.some(p => brand.includes(p))) {
    return { 
      tier: 'premium', 
      score: 5, 
      reasoning: 'Premium brand with high quality standards' 
    };
  } else if (goodBrands.some(g => brand.includes(g))) {
    return { 
      tier: 'good', 
      score: 4, 
      reasoning: 'Well-established brand with good reputation' 
    };
  } else if (budgetBrands.some(b => brand.includes(b))) {
    return { 
      tier: 'budget', 
      score: 3, 
      reasoning: 'Budget brand - basic quality standards' 
    };
  } else {
    return { 
      tier: 'unknown', 
      score: 3, 
      reasoning: 'Unknown brand - quality assessment pending' 
    };
  }
}

/* ===== Ingredient form quality assessment ===== */
export function assessIngredientForms(ingredients: IngredientAmount[]): {
  score: number;
  highlights: string[];
  concerns: string[];
} {
  const highlights: string[] = [];
  const concerns: string[] = [];
  let score = 3; // baseline

  for (const ing of ingredients) {
    const name = ing.name?.toLowerCase() || '';
    
    // High-quality forms (bioavailable)
    if (name.includes('glycinate') || name.includes('bisglycinate')) {
      highlights.push(`${ing.name} - highly bioavailable chelated form`);
      score += 0.3;
    } else if (name.includes('picolinate')) {
      highlights.push(`${ing.name} - well-absorbed form`);
      score += 0.2;
    } else if (name.includes('methylcobalamin') || name.includes('methyl')) {
      highlights.push(`${ing.name} - active methylated form`);
      score += 0.3;
    } else if (name.includes('d3') && name.includes('vitamin d')) {
      highlights.push(`${ing.name} - bioactive form of vitamin D`);
      score += 0.2;
    } else if (name.includes('k2') && name.includes('vitamin k')) {
      highlights.push(`${ing.name} - bioactive form of vitamin K`);
      score += 0.2;
    }
    
    // Lower quality forms
    else if (name.includes('oxide') && (name.includes('magnesium') || name.includes('zinc'))) {
      concerns.push(`${ing.name} - oxide form has poor bioavailability`);
      score -= 0.2;
    } else if (name.includes('cyanocobalamin')) {
      concerns.push(`${ing.name} - synthetic form, methylcobalamin preferred`);
      score -= 0.1;
    } else if (name.includes('dl-') || name.includes('racemic')) {
      concerns.push(`${ing.name} - synthetic racemic form`);
      score -= 0.2;
    }
  }

  return {
    score: Math.max(1, Math.min(5, score)),
    highlights: highlights.slice(0, 5), // Limit to top 5
    concerns: concerns.slice(0, 5)
  };
}

/* ===== Overall quality assessment ===== */
export function getOverallQualityAssessment(u: UploadResult): {
  overallScore: number;
  category: 'excellent' | 'good' | 'fair' | 'poor';
  brandAssessment: ReturnType<typeof assessBrandQuality>;
  ingredientFormAssessment: ReturnType<typeof assessIngredientForms>;
  cleanlinessAssessment?: CleanlinessScore;
  summary: string;
} {
  const brandAssessment = assessBrandQuality(u.extracted?.brandGuess);
  const ingredientFormAssessment = assessIngredientForms(u.extracted?.ingredients || []);
  const cleanlinessAssessment = u.extracted?.cleanlinessScore;
  
  // Calculate weighted overall score
  let totalScore = 0;
  let weights = 0;
  
  // Brand quality (25% weight)
  totalScore += brandAssessment.score * 0.25;
  weights += 0.25;
  
  // Ingredient forms (20% weight)
  totalScore += ingredientFormAssessment.score * 0.20;
  weights += 0.20;
  
  // Cleanliness (30% weight if available)
  if (cleanlinessAssessment) {
    totalScore += (cleanlinessAssessment.overall / 2) * 0.30; // Convert 1-10 to 1-5 scale
    weights += 0.30;
  }
  
  // Quality certifications (15% weight)
  const trustedMarks = u.extracted?.marks || [];
  const certificationScore = Math.min(5, 3 + trustedMarks.length * 0.5);
  totalScore += certificationScore * 0.15;
  weights += 0.15;
  
  // Third-party testing (10% weight)
  const badges = u.extracted?.badges || [];
  const testingScore = badges.some(b => b.includes('3rd-party') || b.includes('tested')) ? 5 : 3;
  totalScore += testingScore * 0.10;
  weights += 0.10;
  
  const overallScore = weights > 0 ? totalScore / weights : 3;
  
  let category: 'excellent' | 'good' | 'fair' | 'poor';
  if (overallScore >= 4.5) category = 'excellent';
  else if (overallScore >= 3.5) category = 'good';
  else if (overallScore >= 2.5) category = 'fair';
  else category = 'poor';
  
  // Generate summary
  let summary = `This supplement scores ${overallScore.toFixed(1)}/5.0 for overall quality (${category}). `;
  
  if (brandAssessment.tier === 'premium') {
    summary += "Premium brand with excellent reputation. ";
  } else if (brandAssessment.tier === 'good') {
    summary += "Reputable brand with good quality standards. ";
  }
  
  if (cleanlinessAssessment) {
    summary += `Ingredient cleanliness rated ${cleanlinessAssessment.category}. `;
  }
  
  if (ingredientFormAssessment.highlights.length > 0) {
    summary += `Contains bioavailable ingredient forms. `;
  }
  
  if (trustedMarks.length > 0) {
    summary += `Third-party certified for quality assurance.`;
  }
  
  return {
    overallScore: Math.round(overallScore * 10) / 10,
    category,
    brandAssessment,
    ingredientFormAssessment,
    cleanlinessAssessment,
    summary: summary.trim()
  };
}

/* ===== Export helper functions ===== */
export { analyzeIngredientCleanliness } from './ingredientCleanliness';

// Re-export types for convenience
export type { CleanlinessScore, IngredientAnalysis } from './ingredientCleanliness';