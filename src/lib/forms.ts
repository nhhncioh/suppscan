export type FormNote = { ingredient: string; form: string; note: string };

const RULES: Array<{ match: RegExp; form: string; note: string }> = [
  // Magnesium forms
  { match: /\bmagnesium\b.*\bglycinate\b/i, form: "Magnesium glycinate", note: "Gentle on GI; good absorption; calming." },
  { match: /\bmagnesium\b.*\boxide\b/i,    form: "Magnesium oxide",     note: "Lower absorption; can be laxative." },
  { match: /\bmagnesium\b.*\bcitrate\b/i,  form: "Magnesium citrate",   note: "Moderate absorption; may loosen stools." },

  // B12
  { match: /\b(b12|cobalamin)\b.*\bmethyl/i, form: "Vitamin B12 (methylcobalamin)", note: "Active form; good bioavailability." },
  { match: /\b(b12|cobalamin)\b.*\bcyano/i,  form: "Vitamin B12 (cyanocobalamin)",  note: "Stable form; converts to active forms." },

  // Folate
  { match: /\b(5[-\s]?mthf|l[-\s]?methylfolate|levomefolate)\b/i, form: "Folate (5-MTHF)", note: "Active folate; useful if MTHFR variants." },
  { match: /\bfolic\s*acid\b/i, form: "Folic acid", note: "Synthetic folate; adequate for most." },

  // Iron
  { match: /\bferrous\s+sulfate\b/i,    form: "Iron (ferrous sulfate)",    note: "Common; can upset stomach; take with vitamin C." },
  { match: /\bferrous\s+fumarate\b/i,   form: "Iron (ferrous fumarate)",   note: "Higher elemental iron; GI side effects possible." },
  { match: /\bferrous\s+gluconate\b/i,  form: "Iron (ferrous gluconate)",  note: "Gentler; lower elemental iron per mg." },
  { match: /\bbisglycinate\b/i,         form: "Iron (bisglycinate)",      note: "Chelated; gentler on GI; decent absorption." },

  // Omega-3
  { match: /\b(ethyl\s+ester|ee)\b/i, form: "Omega-3 (ethyl ester)", note: "Take with meals; absorption lower vs triglyceride." },
  { match: /\b(triglyceride|rtg|re-esterified)\b/i, form: "Omega-3 (triglyceride)", note: "Better absorption; take with food." },

  // Curcumin
  { match: /\b(curcumin|turmeric)\b.*\b(piperine|black\s+pepper)\b/i, form: "Curcumin + piperine", note: "Piperine boosts absorption; watch drug interactions." },

  // CoQ10
  { match: /\bubiquinol\b/i, form: "CoQ10 (ubiquinol)", note: "Higher bioavailability; useful in older adults." },
  { match: /\bubiquinone\b/i, form: "CoQ10 (ubiquinone)", note: "Standard form; take with fat-containing meal." },

  // Zinc
  { match: /\bzinc\b.*\bpicolinate\b/i, form: "Zinc picolinate", note: "Good absorption; may upset stomach if empty." },
  { match: /\bzinc\b.*\bcitrate\b/i,    form: "Zinc citrate",    note: "Decent absorption; can be taken with food." },
  { match: /\bzinc\b.*\bgluconate\b/i,  form: "Zinc gluconate",  note: "Common form; mild GI effects possible." }
];

export function detectFormNotes(ingredientNames: string[]): FormNote[] {
  const out: FormNote[] = [];
  for (const name of ingredientNames) {
    for (const rule of RULES) {
      if (rule.match.test(name)) {
        out.push({ ingredient: name, form: rule.form, note: rule.note });
        break;
      }
    }
  }
  return out;
}
