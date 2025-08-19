export type Unit = "iu" | "mcg" | "mg" | "g";

export type IngredientAmount = {
  name: string;
  amount: number | null;
  unit: Unit | null;
};

export type Profile = {
  ageBand: "0-12" | "13-18" | "19-70" | ">70";
  sex: "male" | "female" | "unspecified";
  pregnant: boolean;
};

export type GuidelineVerdict = {
  ingredient: string;
  label_amount: number | null;
  label_unit: Unit | null;
  rda_or_ai: string | null;
  ul: { value: number | null; unit: Unit | null } | null;
  category: "below_rda" | "within_range" | "above_ul" | "unknown";
  explanation: string;
  readable: string; // e.g., "1000 IU — within general recommended range — do not exceed 4000 IU/day"
};

export type StackItem = {
  id: string;                // random id
  when: number;              // epoch ms
  brand?: string | null;
  product?: string | null;
  ingredients: IngredientAmount[];
};
