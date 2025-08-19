export type EvidencePack = {
  uses?: { claim: string; evidence: "strong" | "mixed" | "limited" | "unknown" }[];
  how_to_take?: { timing: string; notes?: string }[];
  take_if?: { scenario: string; rationale: string }[];
  may_improve?: { area: string; evidence_level: "strong" | "mixed" | "limited" | "unknown"; typical_timeframe?: string | null }[];
};

export const EVIDENCE: Record<string, EvidencePack> = {
  "vitamin d": {
    uses: [
      { claim: "Bone health in deficiency", evidence: "strong" },
      { claim: "Immune support (respiratory infections)", evidence: "mixed" }
    ],
    how_to_take: [{ timing: "with a fat-containing meal", notes: "Fat-soluble; improves absorption." }]
  },
  "vitamin c": {
    uses: [
      { claim: "Prevent scurvy / correct deficiency", evidence: "strong" },
      { claim: "Reduce common cold duration (regular use)", evidence: "mixed" },
      { claim: "Support iron absorption (non-heme)", evidence: "strong" }
    ],
    how_to_take: [{ timing: "with or without food", notes: "Split large doses to reduce GI upset." }],
    take_if: [
      { scenario: "Low fruit/vegetable intake", rationale: "Dietary vitamin C may be insufficient." },
      { scenario: "Smoker or secondhand smoke", rationale: "Higher vitamin C turnover in smokers." },
      { scenario: "Clinician-confirmed deficiency", rationale: "Use under guidance to correct deficiency." }
    ],
    may_improve: [
      { area: "Common cold duration", evidence_level: "mixed", typical_timeframe: "with regular use; start early" },
      { area: "Iron absorption (non-heme)", evidence_level: "strong", typical_timeframe: "when taken with iron" }
    ]
  }
};

// Normalization of common label variants → canonical key above
const ALIASES: Record<string, string> = {
  "d": "vitamin d",
  "d3": "vitamin d",
  "vitamin d3": "vitamin d",
  "c": "vitamin c",
  "ascorbic acid": "vitamin c"
};

export function canonicalIngredient(name: string | null | undefined) {
  const n = (name || "").trim().toLowerCase();
  if (!n) return null;
  return EVIDENCE[n] ? n : (ALIASES[n] ?? null);
}

export function getEvidence(name: string | null | undefined): EvidencePack | null {
  const key = canonicalIngredient(name);
  return key ? EVIDENCE[key] : null;
}
