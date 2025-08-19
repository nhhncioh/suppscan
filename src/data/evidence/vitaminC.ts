export const EVIDENCE_VITAMIN_C = {
  uses: [
    { claim: "Prevent scurvy / correct deficiency", evidence: "strong" },
    { claim: "Reduce common cold duration (regular use)", evidence: "mixed" },
    { claim: "Support iron absorption (non-heme)", evidence: "strong" }
  ],
  how_to_take: [
    { timing: "with or without food", notes: "Split large doses to reduce GI upset." }
  ],
  take_if: [
    { scenario: "Low fruit/vegetable intake", rationale: "Dietary vitamin C may be insufficient." },
    { scenario: "Smoker or secondhand smoke", rationale: "Higher vitamin C turnover in smokers." },
    { scenario: "Clinician-confirmed deficiency", rationale: "Use under guidance to correct deficiency." }
  ],
  may_improve: [
    { area: "Common cold duration", evidence_level: "mixed", typical_timeframe: "with regular use; start early" },
    { area: "Iron absorption (non-heme)", evidence_level: "strong", typical_timeframe: "when taken with iron" }
  ]
} as const;
