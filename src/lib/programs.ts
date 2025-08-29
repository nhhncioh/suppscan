
// src/lib/programs.ts
import { EvidenceLevel, getEvidenceLevel } from '@/lib/evidence';
export interface ProgramStep { title: string; details: string; timing?: string; }
export interface ProgramStackItem { name: string; timing: string; dosageText?: string; note?: string; evidence?: EvidenceLevel; }
export interface Program { id: 'energy'|'sleep'|'gut-regularity'|'focus'; title: string; whenToUse: string[]; summary: string; stack: ProgramStackItem[]; stepsWeek1: ProgramStep[]; stepsWeek2: ProgramStep[]; disclaimer?: string; }

export const ProgramsCatalog: Program[] = [
  { id: 'energy', title: 'Energy Reset (2 weeks)', whenToUse: ['tired','energy','crash','wake','afternoon'],
    summary: 'Reduce afternoon crashes and raise daytime energy with a simple stack.',
    stack: [
      { name: 'Iron',      timing: 'AM away from coffee/tea', note: 'Only if iron status tends to be low', evidence: getEvidenceLevel('Iron','energy') ?? 'moderate' },
      { name: 'B-Complex', timing: 'AM with breakfast',       note: 'Co-factors for energy pathways',     evidence: getEvidenceLevel('B-Complex','energy') ?? 'moderate' },
      { name: 'Magnesium', timing: 'Evening, ideally glycinate', note: 'Supports sleep quality which feeds daytime energy', evidence: getEvidenceLevel('Magnesium','energy') ?? 'limited' },
      { name: 'Chromium',  timing: 'With meals',               note: 'Glycemic support to lower crashes', evidence: getEvidenceLevel('Chromium','energy') ?? 'limited' },
    ],
    stepsWeek1: [
      { title: 'Hydration baseline', details: 'Target 2L/day; add electrolytes as needed.' },
      { title: 'AM routine', details: 'Take B-Complex with breakfast; Iron mid-morning away from coffee if using.' },
      { title: 'Lunch focus', details: 'Protein + fiber-rich carbs to reduce crash risk.' },
      { title: 'Evening wind-down', details: 'Magnesium glycinate 60–90 min before bed.' },
    ],
    stepsWeek2: [
      { title: 'Refine timing', details: 'Move B-Complex earlier if sleep is light; keep iron away from inhibitors.' },
      { title: 'Stabilize meals', details: 'Add chromium with the highest-carb meal.' },
      { title: 'Light movement', details: '10–15 min walk after meals helps glucose control.' },
    ],
    disclaimer: 'Informational only. Not medical advice. Consider labs for iron/B12 status.' },
  { id: 'sleep', title: 'Sleep Support (2 weeks)', whenToUse: ['sleep','insomnia','restless'],
    summary: 'Nudge circadian rhythm and relax the nervous system.',
    stack: [
      { name: 'Magnesium', timing: 'Evening', note: 'Glycinate or threonate forms are common choices', evidence: getEvidenceLevel('Magnesium','sleep') ?? 'moderate' },
      { name: 'Fiber',     timing: 'Anytime with water', note: 'GI regularity can improve sleep comfort', evidence: getEvidenceLevel('Fiber','gut-regularity') ?? 'strong' },
    ],
    stepsWeek1: [
      { title: 'Evening routine', details: 'Screens dimmed, cooler room, magnesium 60–90 min pre-bed.' },
      { title: 'Caffeine cut-off', details: 'Last caffeine 8+ hours before target bedtime.' },
    ],
    stepsWeek2: [
      { title: 'Consistent wake-time', details: 'Anchor the wake time, weekends included.' },
    ],
    disclaimer: 'Informational only. Not medical advice.' },
  { id: 'gut-regularity', title: 'Gut Regularity (2 weeks)', whenToUse: ['constip','irregular','bloat'],
    summary: 'Gentle nutrition tactics to support daily regularity.',
    stack: [
      { name: 'Fiber', timing: 'Daily; increase gradually', note: 'Psyllium or mixed soluble fiber', evidence: getEvidenceLevel('Fiber','gut-regularity') ?? 'strong' },
      { name: 'Magnesium', timing: 'Evening if needed', note: 'Citrate form can loosen stools; glycinate if too loose', evidence: 'limited' },
    ],
    stepsWeek1: [
      { title: 'Gradual fiber', details: 'Add 5–10g/day; drink water to tolerance.' },
      { title: 'Meal rhythm', details: 'Regular meals and light walks after eating.' },
    ],
    stepsWeek2: [
      { title: 'Fine-tune forms', details: 'Adjust magnesium form/amount based on tolerance.' },
    ],
    disclaimer: 'Informational only. Not medical advice.' },
];

function matchGoalFromSymptoms(selected: string[]): ('energy'|'sleep'|'gut-regularity'|'focus')[] {
  const s = selected.map(x => x.toLowerCase());
  const out = new Set<'energy'|'sleep'|'gut-regularity'|'focus'>();
  if (s.some(x => x.includes('tired') || x.includes('energy') || x.includes('crash') || x.includes('wake'))) out.add('energy');
  if (s.some(x => x.includes('sleep') || x.includes('insomnia'))) out.add('sleep');
  if (s.some(x => x.includes('constip') || x.includes('irregular') || x.includes('bloat'))) out.add('gut-regularity');
  if (s.some(x => x.includes('focus') || x.includes('brain') || x.includes('fog'))) out.add('focus');
  return Array.from(out);
}

export function getProgramsForSelection(selectedSymptomIds: string[]): Program[] {
  const goals = matchGoalFromSymptoms(selectedSymptomIds);
  return ProgramsCatalog.filter(p => goals.some(g => g === p.id));
}
