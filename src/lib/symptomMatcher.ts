// src/lib/symptomMatcher.ts

// ================== Types ==================
export interface EnhancedRecommendation {
  name: string;
  priorityScore: string;       // word label, not numeric
  priorityLabel: string;       // "Most helpful" | "High potential" | "May help" | "Lower priority"
  effectivenessLevel: string;
  orthodoxy: 'mainstream' | 'functional' | 'alternative';
  evidenceStrength: 'strong' | 'moderate' | 'limited' | 'emerging';
  dosageInfo: {
    typical: string;
    range: string;
    timing: string;
    withFood: 'required' | 'recommended' | 'not_necessary';
    notes?: string;
  };
  mechanism: string;
  matchedSymptoms: string[];
}

export type SymptomMatch = {
  supplement: string;              // canonical key in SUPPLEMENT_DATA
  displayName: string;             // Title-cased name for UI
  matchedBy: Array<'name' | 'ingredient' | 'keyIngredient'>;
  score: number;
  effectivenessLevel: string;
  orthodoxy: 'mainstream' | 'functional' | 'alternative';
  evidenceStrength: 'strong' | 'moderate' | 'limited' | 'emerging';
  dosageInfo: {
    typical: string;
    range: string;
    timing: string;
    withFood: 'required' | 'recommended' | 'not_necessary';
    notes?: string;
  };
  mechanism: string;
};

export type InteractionWarning = {
  type: 'drug' | 'supplement' | 'food' | 'condition';
  severity: 'mild' | 'moderate' | 'serious';
  description: string;
  recommendation: string;
};

// ================== Data ==================
const SUPPLEMENT_DATA: Record<string, {
  symptoms: string[];
  confidence: 'high' | 'moderate' | 'low';
  orthodoxy: 'mainstream' | 'functional' | 'alternative';
  evidenceStrength: 'strong' | 'moderate' | 'limited' | 'emerging';
  effectivenessLevel: string;
  dosage: {
    typical: string;
    range: string;
    timing: string;
    withFood: 'required' | 'recommended' | 'not_necessary';
    notes?: string;
  };
  mechanism: string;
}> = {
  iron: {
    symptoms: ['tired', 'fatigue', 'cold-hands', 'hair-loss', 'brittle-nails', 'low-energy'],
    confidence: 'high',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '18mg (women) / 8mg (men)',
      range: '18–45mg',
      timing: 'With vitamin C; away from calcium',
      withFood: 'recommended',
      notes: 'Avoid taking with coffee or calcium'
    },
    mechanism: 'Supports oxygen transport and energy production'
  },
  b12: {
    symptoms: ['tired', 'brain-fog', 'poor-concentration', 'cold-hands', 'tingling', 'low-energy'],
    confidence: 'high',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '500–1000mcg',
      range: '250–2000mcg',
      timing: 'Morning preferred',
      withFood: 'not_necessary'
    },
    mechanism: 'Supports red blood cell formation and nerve function'
  },
  magnesium: {
    symptoms: ['poor-sleep', 'muscle-cramps', 'stress', 'anxiety', 'constipation', 'tired', 'migraines'],
    confidence: 'high',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '200–400mg (glycinate/citrate)',
      range: '200–600mg',
      timing: 'Evening preferred for sleep',
      withFood: 'recommended',
      notes: 'Glycinate best for stress/sleep; citrate can loosen stools'
    },
    mechanism: 'Cofactor in hundreds of enzymatic reactions; calms nervous system'
  },
  'vitamin d': {
    symptoms: ['tired', 'low-mood', 'poor-immunity', 'bone-health'],
    confidence: 'high',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '1000–2000 IU',
      range: '1000–5000 IU',
      timing: 'With food',
      withFood: 'required',
      notes: 'Pair with K2 if using higher doses'
    },
    mechanism: 'Regulates immune function and mood pathways'
  },
  coq10: {
    symptoms: ['tired', 'exercise-fatigue', 'statin-use', 'heart-health'],
    confidence: 'moderate',
    orthodoxy: 'functional',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '100–200mg',
      range: '100–300mg',
      timing: 'With food (fat-containing meal)',
      withFood: 'required'
    },
    mechanism: 'Supports mitochondrial energy production'
  },
  'b-complex': {
    symptoms: ['tired', 'stress', 'brain-fog', 'low-mood'],
    confidence: 'moderate',
    orthodoxy: 'mainstream',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: 'One capsule with breakfast',
      range: 'As labeled',
      timing: 'Morning preferred',
      withFood: 'recommended'
    },
    mechanism: 'Cofactors for energy and neurotransmitter synthesis'
  },
  chromium: {
    symptoms: ['afternoon-crash', 'sugar-cravings', 'unstable-blood-sugar'],
    confidence: 'moderate',
    orthodoxy: 'functional',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '200mcg',
      range: '100–400mcg',
      timing: 'With meals',
      withFood: 'recommended'
    },
    mechanism: 'Improves insulin sensitivity and glucose tolerance'
  },
  'adaptogenic herbs': {
    symptoms: ['stress', 'anxiety', 'afternoon-crash', 'low-mood'],
    confidence: 'moderate',
    orthodoxy: 'functional',
    evidenceStrength: 'limited',
    effectivenessLevel: 'May Help',
    dosage: {
      typical: 'As labeled (e.g., ashwagandha 300–600mg)',
      range: 'Varies',
      timing: 'Morning/early afternoon',
      withFood: 'recommended'
    },
    mechanism: 'Modulates stress response systems'
  },
  'omega-3': {
    symptoms: ['low-mood', 'inflammation', 'joint-pain', 'heart-health', 'brain-fog'],
    confidence: 'high',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '1–2g EPA+DHA',
      range: '1–4g',
      timing: 'With meals',
      withFood: 'required'
    },
    mechanism: 'Resolves inflammation; supports brain function'
  },
  creatine: {
    symptoms: ['exercise-fatigue', 'low-energy', 'brain-fog'],
    confidence: 'high',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '3–5g daily',
      range: '3–10g',
      timing: 'Anytime; post-workout optional',
      withFood: 'not_necessary'
    },
    mechanism: 'Regenerates ATP for quick energy'
  },
  'l-theanine': {
    symptoms: ['anxiety', 'stress', 'poor-sleep'],
    confidence: 'moderate',
    orthodoxy: 'mainstream',
    evidenceStrength: 'strong',
    effectivenessLevel: 'Highly Effective',
    dosage: {
      typical: '100–200mg',
      range: '100–400mg',
      timing: 'With caffeine for focus; evening for sleep',
      withFood: 'not_necessary',
      notes: 'Synergistic with caffeine to smooth jitters'
    },
    mechanism: 'Promotes alpha brain waves; calms without sedation'
  },
  ashwagandha: {
    symptoms: ['stress', 'anxiety', 'poor-sleep', 'low-energy'],
    confidence: 'moderate',
    orthodoxy: 'functional',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '300–600mg KSM-66/Sensoril',
      range: '300–1000mg',
      timing: 'Morning/afternoon',
      withFood: 'recommended'
    },
    mechanism: 'Modulates HPA axis and cortisol'
  },
  rhodiola: {
    symptoms: ['stress', 'low-energy', 'afternoon-crash', 'brain-fog'],
    confidence: 'moderate',
    orthodoxy: 'functional',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '200–400mg',
      range: '100–600mg',
      timing: 'Morning',
      withFood: 'not_necessary'
    },
    mechanism: 'Adaptogen; supports stress resilience'
  },
  zinc: {
    symptoms: ['poor-immunity', 'acne', 'wound-healing', 'low-testosterone'],
    confidence: 'moderate',
    orthodoxy: 'mainstream',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '10–25mg',
      range: '5–40mg',
      timing: 'With food',
      withFood: 'required',
      notes: 'Separate from iron for best absorption'
    },
    mechanism: 'Immune function and tissue repair'
  },
  collagen: {
    symptoms: ['joint-pain', 'skin-health', 'hair-nails'],
    confidence: 'moderate',
    orthodoxy: 'functional',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '10g',
      range: '5–20g',
      timing: 'Anytime',
      withFood: 'not_necessary'
    },
    mechanism: 'Provides amino acids for connective tissue'
  },
  melatonin: {
    symptoms: ['poor-sleep', 'jet-lag', 'circadian-shift'],
    confidence: 'moderate',
    orthodoxy: 'mainstream',
    evidenceStrength: 'moderate',
    effectivenessLevel: 'Helpful',
    dosage: {
      typical: '0.5–3mg',
      range: '0.5–5mg',
      timing: '30–60 minutes before bed',
      withFood: 'not_necessary',
      notes: 'Start low to avoid grogginess'
    },
    mechanism: 'Regulates circadian rhythm and sleep onset'
  }
};

// ================== Helpers ==================
const normalizeText = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const _norm = (s?: string | null) =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const ALIASES: Record<string, string[]> = {
  magnesium: ['magnesium', 'magnesium glycinate', 'magnesium citrate', 'magnesium oxide', 'mg glycinate'],
  'vitamin d': ['vitamin d', 'vitamin d3', 'cholecalciferol'],
  'omega-3': ['omega 3', 'omega-3', 'epa', 'dha', 'fish oil'],
  creatine: ['creatine', 'creatine monohydrate'],
  'l-theanine': ['l theanine', 'l-theanine', 'theanine'],
  ashwagandha: ['ashwagandha', 'withania somnifera', 'ksm-66', 'sensoril'],
  rhodiola: ['rhodiola', 'rhodiola rosea'],
  zinc: ['zinc', 'zn'],
  collagen: ['collagen', 'hydrolyzed collagen', 'collagen peptides'],
  melatonin: ['melatonin'],
  iron: ['iron', 'ferrous', 'ferric'],
  b12: ['b12', 'cyanocobalamin', 'methylcobalamin', 'cobalamin'],
  coq10: ['coq10', 'ubiquinone', 'ubiquinol'],
  chromium: ['chromium', 'chromium picolinate'],
  'b-complex': ['b complex', 'b-complex', 'b vitamins']
};

const titleCase = (s: string) => s.replace(/(^|\s)\w/g, (m) => m.toUpperCase());

function confidenceToLabel(conf: 'high' | 'moderate' | 'low'): string {
  if (conf === 'high') return 'Most helpful';
  if (conf === 'moderate') return 'High potential';
  return 'May help';
}

function matchSymptoms(productText: string): string[] {
  const results: string[] = [];
  const normalized = normalizeText(productText);

  for (const [, data] of Object.entries(SUPPLEMENT_DATA)) {
    for (const symptom of data.symptoms) {
      if (normalized.includes(symptom)) results.push(symptom);
    }
  }
  return Array.from(new Set(results));
}

export function normalizeToEnhancedRecommendation(supplement: string): EnhancedRecommendation {
  const data = SUPPLEMENT_DATA[supplement];
  return {
    name: supplement,
    priorityScore: confidenceToLabel(data.confidence),
    priorityLabel: confidenceToLabel(data.confidence),
    effectivenessLevel: data.effectivenessLevel,
    orthodoxy: data.orthodoxy,
    evidenceStrength: data.evidenceStrength,
    dosageInfo: {
      typical: data.dosage.typical,
      range: data.dosage.range,
      timing: data.dosage.timing,
      withFood: data.dosage.withFood,
      notes: data.dosage.notes || ''
    },
    mechanism: data.mechanism,
    matchedSymptoms: data.symptoms
  };
}

// ================== Engines ==================
export class SymptomMatcher {
  static analyzeSymptoms(selectedSymptoms: string[]): EnhancedRecommendation[] {
    if (!selectedSymptoms || selectedSymptoms.length === 0) return [];

    const matches: { supplement: string; score: number }[] = [];

    for (const [supplement, data] of Object.entries(SUPPLEMENT_DATA)) {
      const overlap = data.symptoms.filter(s => selectedSymptoms.includes(s)).length;
      if (overlap > 0) {
        let score = 0;
        if (overlap >= 2) score += 1;
        if (data.confidence === 'high') score += 2;
        else if (data.confidence === 'moderate') score += 1;
        matches.push({ supplement, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.map(m => normalizeToEnhancedRecommendation(m.supplement)).slice(0, 8);
  }

  static analyzeSupplement(supplementText: string): EnhancedRecommendation[] {
    if (!supplementText) return [];
    const matchedSymptoms = matchSymptoms(supplementText);
    if (matchedSymptoms.length === 0) return [];

    const matchedSupplements = Object.keys(SUPPLEMENT_DATA).filter(supplement =>
      SUPPLEMENT_DATA[supplement].symptoms.some(symptom => matchedSymptoms.includes(symptom))
    );

    return matchedSupplements.map(normalizeToEnhancedRecommendation);
  }

  /** Lightweight product→knowledge-base matcher used by scanner UI */
  static matchSupplement(profile: { name?: string; ingredients?: string[]; keyIngredient?: string | null }): SymptomMatch[] {
    const name = _norm(profile?.name);
    const keyIng = _norm(profile?.keyIngredient || undefined);
    const ingredients = (profile?.ingredients || []).map(x => _norm(x)).filter(Boolean);

    const out: SymptomMatch[] = [];

    for (const [key, data] of Object.entries(SUPPLEMENT_DATA)) {
      const aliases = ALIASES[key] || [key];
      const displayName = titleCase(key);
      let score = 0;
      const matchedBy: Array<'name' | 'ingredient' | 'keyIngredient'> = [];

      if (name && aliases.some(a => name.includes(a))) {
        score += 2;
        matchedBy.push('name');
      }

      if (keyIng && aliases.some(a => a === keyIng)) {
        score += 3;
        matchedBy.push('keyIngredient');
      }

      const ingHits = ingredients.filter(ing => aliases.some(a => ing.includes(a)));
      if (ingHits.length > 0) {
        score += Math.min(3, ingHits.length);
        matchedBy.push('ingredient');
      }

      if (score > 0) {
        out.push({
          supplement: key,
          displayName,
          matchedBy,
          score,
          effectivenessLevel: data.effectivenessLevel,
          orthodoxy: data.orthodoxy,
          evidenceStrength: data.evidenceStrength,
          dosageInfo: {
            typical: data.dosage.typical,
            range: data.dosage.range,
            timing: data.dosage.timing,
            withFood: data.dosage.withFood,
            notes: data.dosage.notes
          },
          mechanism: data.mechanism
        });
      }
    }

    out.sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
    return out;
  }

  static generatePersonalizedMessage(matches: SymptomMatch[]): string {
    if (!matches || matches.length === 0) return '';
    const top = matches.slice(0, 2);
    const parts = top.map(m => {
      const withFood =
        m.dosageInfo.withFood === 'required' ? 'with food' :
        m.dosageInfo.withFood === 'recommended' ? 'with food' : 'with or without food';
      const dose = m.dosageInfo?.typical ? `Typical dose ${m.dosageInfo.typical}` : '';
      const timing = m.dosageInfo?.timing ? `; ${m.dosageInfo.timing}` : '';
      const note = m.dosageInfo?.notes ? ` — ${m.dosageInfo.notes}` : '';
      return `${m.displayName}: ${dose}${timing} (${withFood})${note}`;
    });
    return `We detected ${top.map(m => m.displayName).join(' & ')} in this product. ${parts.join(' • ')}`;
  }

  /** Wrapper the scanner expects */
  static analyzeSupplementForUser(profile: { name?: string; ingredients?: string[]; keyIngredient?: string | null }) {
    const matches = this.matchSupplement(profile);
    const personalizedMessage = this.generatePersonalizedMessage(matches);
    const interactions: InteractionWarning[] = [];
    const overallScore = matches.length ? Math.max(...matches.map(m => m.score)) : 0;
    return { matches, personalizedMessage, interactions, overallScore };
  }
}

// Also expose a top-level named function (works with `import * as SymptomMatcher ...`)
export function analyzeSupplementForUser(profile: { name?: string; ingredients?: string[]; keyIngredient?: string | null }) {
  return SymptomMatcher.analyzeSupplementForUser(profile);
}

export default SymptomMatcher;