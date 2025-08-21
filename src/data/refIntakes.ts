/** Reference intakes used for auto suggestions in PriceWidget.
 *  NOTE: Values are simplified; always show the disclaimer in UI.
 */
export const REF_INTAKES = {
  "vitamin d": {
    units: ["iu", "mcg"],
    mcg_per_iu: 0.025,
    rda_ai: [
      { group: "0-12", value: 400, unit: "iu" },
      { group: "13-18", value: 600, unit: "iu" },
      { group: "19-70", value: 600, unit: "iu" },
      { group: ">70",  value: 800, unit: "iu" },
      { group: "pregnancy", value: 600, unit: "iu" }
    ],
    ul: { value: 4000, unit: "iu" }
  },

  "vitamin c": {
    units: ["mg"],
    rda_ai: [
      { group: "0-12", value: 45,  unit: "mg" },
      { group: "13-18", value: 75,  unit: "mg" },
      { group: "19-70", value: 90,  unit: "mg" },
      { group: ">70",  value: 90,  unit: "mg" },
      { group: "pregnancy", value: 85, unit: "mg" }
    ],
    ul: { value: 2000, unit: "mg" }
  },

  /** Collagen: no official RDA; common trial doses ~10 g/day. */
  "collagen": {
    units: ["g"],
    rda_ai: [
      { group: "0-12", value: 5,  unit: "g" },
      { group: "13-18", value: 10, unit: "g" },
      { group: "19-70", value: 10, unit: "g" },
      { group: ">70",  value: 10, unit: "g" },
      { group: "pregnancy", value: 10, unit: "g" }
    ],
    ul: null
  },

  /** Magnesium: simplified adult RDAs; UL for supplements is 350 mg. */
  "magnesium": {
    units: ["mg"],
    rda_ai: [
      { group: "0-12", value: 240, unit: "mg" },
      { group: "13-18", value: 360, unit: "mg" },
      { group: "19-70", value: 400, unit: "mg" },
      { group: ">70",  value: 400, unit: "mg" },
      { group: "pregnancy", value: 350, unit: "mg" }
    ],
    ul: { value: 350, unit: "mg" } // UL for supplemental Mg only
  },

  /** Potassium: AI (sex-specific in reality); simplified here. */
  "potassium": {
    units: ["mg"],
    rda_ai: [
      { group: "0-12", value: 2300, unit: "mg" },
      { group: "13-18", value: 3000, unit: "mg" },
      { group: "19-70", value: 3000, unit: "mg" },
      { group: ">70",  value: 3000, unit: "mg" },
      { group: "pregnancy", value: 2700, unit: "mg" }
    ],
    ul: null
  },

  /** Sodium: use conservative daily target; keep an eye on total diet intake. */
  "sodium": {
    units: ["mg"],
    rda_ai: [
      { group: "0-12", value: 1200, unit: "mg" },
      { group: "13-18", value: 1500, unit: "mg" },
      { group: "19-70", value: 1500, unit: "mg" },
      { group: ">70",  value: 1300, unit: "mg" },
      { group: "pregnancy", value: 1500, unit: "mg" }
    ],
    // Many orgs suggest limiting to ~2000 mg sodium/day
    ul: { value: 2000, unit: "mg" }
  }
} as const;

export type RefKey = keyof typeof REF_INTAKES;
