/** Minimal starter — expand as needed */
export const REF_INTAKES = {
  "vitamin d": {
    units: ["iu", "mcg"],
    // 1 mcg = 40 IU  (=> mcg_per_iu = 0.025)
    mcg_per_iu: 0.025,
    rda_ai: [
      { group: "0-12", value: 400, unit: "iu" },
      { group: "13-18", value: 600, unit: "iu" },
      { group: "19-70", value: 600, unit: "iu" },
      { group: ">70", value: 800, unit: "iu" },
      { group: "pregnancy", value: 600, unit: "iu" }
    ],
    ul: { value: 4000, unit: "iu" }
  }
} as const;

export type RefKey = keyof typeof REF_INTAKES;
