
// src/lib/sideEffects.ts
export interface Watchout { supplement: string; message: string; severity: 'info' | 'warn'; }
const has = (symptoms: string[], substr: string) => symptoms.some(s => s.toLowerCase().includes(substr));

export function sideEffectWatch(selectedSymptomIds: string[], recSupplementNames: string[]): Watchout[] {
  const out: Watchout[] = [];
  const add = (supplement: string, message: string, severity: 'info' | 'warn' = 'info') => out.push({ supplement, message, severity });

  const hasConstipation = has(selectedSymptomIds, 'constip');
  const hasDiarrhea     = has(selectedSymptomIds, 'diarr');
  const hasSleepIssue   = has(selectedSymptomIds, 'sleep');
  const hasAfternoonCrash = has(selectedSymptomIds, 'crash') || has(selectedSymptomIds, 'energy') || has(selectedSymptomIds, 'tired');

  for (const name of recSupplementNames.map(n => n.toLowerCase())) {
    if (name === 'iron') {
      if (hasConstipation) add('Iron', 'Iron can worsen constipation. Consider gentle forms (bisglycinate) and adequate water/fiber.', 'warn');
      add('Iron', 'Best absorbed away from coffee/tea/dairy; vitamin C may help absorption.');
    }
    if (name === 'magnesium') {
      if (hasDiarrhea) add('Magnesium', 'Some forms (citrate/oxide) can loosen stools; consider glycinate/malate instead.', 'warn');
      if (hasSleepIssue) add('Magnesium', 'For sleep support, magnesium glycinate in the evening is often preferred.');
    }
    if (name === 'chromium' && hasAfternoonCrash) add('Chromium', 'May support glycemic control; pair with protein/whole-food meals.');
    if (name.includes('b-complex') && hasSleepIssue) add('B-Complex', 'B vitamins can be stimulating for some; take earlier in the day.');
    if (name.includes('fiber')) add('Fiber', 'Increase gradually and drink water to avoid GI discomfort.');
  }
  return out;
}
