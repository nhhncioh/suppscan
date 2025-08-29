
// src/lib/evidence.ts
export type EvidenceLevel = 'strong' | 'moderate' | 'limited' | 'preliminary';

export const EvidenceCopy: Record<EvidenceLevel, {label: string; short: string; tooltip: string}> = {
  strong:      { label: 'Strong',     short: 'Most helpful',  tooltip: 'Multiple high-quality studies for this goal in similar populations.' },
  moderate:    { label: 'Moderate',   short: 'High potential', tooltip: 'Some good studies; effectiveness varies by person and context.' },
  limited:     { label: 'Limited',    short: 'May help',       tooltip: 'Early or mixed evidence; may help as part of a stack.' },
  preliminary: { label: 'Preliminary',short: 'Lower priority', tooltip: 'Anecdotal or early-stage evidence only.' },
};

export interface EvidenceEntry { supplement: string; goal: string; level: EvidenceLevel; note?: string; }

export const EvidenceTable: EvidenceEntry[] = [
  { supplement: 'Iron',              goal: 'energy',           level: 'strong',     note: 'If ferritin/iron is low; otherwise less helpful.' },
  { supplement: 'B12',               goal: 'energy',           level: 'moderate',   note: 'Useful if B12 status is low.' },
  { supplement: 'B-Complex',         goal: 'energy',           level: 'moderate',   note: 'Covers multiple co-factors for energy metabolism.' },
  { supplement: 'CoQ10',             goal: 'energy',           level: 'limited',    note: 'More helpful in older adults or statin use.' },
  { supplement: 'Magnesium',         goal: 'sleep',            level: 'moderate',   note: 'Magnesium glycinate often preferred for sleep.' },
  { supplement: 'Magnesium',         goal: 'energy',           level: 'limited',    note: 'May reduce fatigue via sleep/relaxation pathways.' },
  { supplement: 'Chromium',          goal: 'energy',           level: 'limited',    note: 'Glycemic control may reduce afternoon crashes.' },
  { supplement: 'Fiber',             goal: 'gut-regularity',   level: 'strong',     note: 'Adequate daily fiber strongly supports regularity.' },
  { supplement: 'Adaptogenic herbs', goal: 'energy',           level: 'limited',    note: 'Mixed evidence; some users report improved stress resilience.' },
];

export function getEvidenceLevel(supplement: string, goal: string) {
  const row = EvidenceTable.find(r => r.supplement.toLowerCase() === supplement.toLowerCase() && r.goal === goal);
  return row ? row.level : null;
}
