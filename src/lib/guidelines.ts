import type { Profile, Unit, GuidelineVerdict } from "@/types/suppscan";
import type { RefKey } from "@/data/refIntakes";
import { REF_INTAKES } from "@/data/refIntakes";
import { convertDose, fmt } from "@/lib/units";

export function groupForProfile(p: Profile): "0-12"|"13-18"|"19-70"|">70"|"pregnancy" {
  if (p.pregnant && (p.sex === "female" || p.sex === "unspecified")) return "pregnancy";
  return p.ageBand;
}

function keyFromName(name: string): RefKey | null {
  const k = name.trim().toLowerCase();
  if (["vitamin d","d","d3","vitamin d3"].includes(k)) return "vitamin d";
  return null;
}

export function compareToGuidelines(
  ingredientName: string,
  labelAmount: number | null,
  labelUnit: Unit | null,
  profile: Profile
): GuidelineVerdict {
  const k = keyFromName(ingredientName);
  if (!k) {
    return {
      ingredient: ingredientName,
      label_amount: labelAmount, label_unit: labelUnit,
      rda_or_ai: null, ul: null, category: "unknown",
      explanation: "No local guideline available.",
      readable: `${fmt(labelAmount, labelUnit)} — guidance unknown`
    };
  }

  const ref = REF_INTAKES[k];
  const group = groupForProfile(profile);
  const rda = ref.rda_ai.find(x => x.group === group) ?? null;
  const ul  = ref.ul ?? null;

  // Normalize label to the ref unit (we'll use IU for Vitamin D)
  const labelInIU =
    labelUnit === "iu" ? labelAmount :
    convertDose(ingredientName, labelAmount, labelUnit, "iu");

  let category: GuidelineVerdict["category"] = "unknown";
  let explanation = "Insufficient data.";
  if (labelInIU != null && rda) {
    if (ul?.value && labelInIU > ul.value) {
      category = "above_ul";
      explanation = `Above upper limit of ${fmt(ul.value, ul.unit)} for this group.`;
    } else if (labelInIU >= rda.value && (!ul?.value || labelInIU <= ul.value)) {
      category = "within_range";
      explanation = `Within general recommended intake (${fmt(rda.value, rda.unit)}) for this group.`;
    } else if (labelInIU < rda.value) {
      category = "below_rda";
      explanation = `Below typical recommended intake (${fmt(rda.value, rda.unit)}).`;
    }
  }

  const readableBase = `${fmt(labelAmount, labelUnit)} — ${
    category === "within_range" ? "within general recommended range" :
    category === "below_rda" ? "below typical intake guidance" :
    category === "above_ul" ? "above the upper limit" : "guidance unknown"
  }`;

  const readable = ul?.value
    ? `${readableBase} — do not exceed ${fmt(ul.value, ul.unit)}/day`
    : readableBase;

  const rdaText = rda ? `${fmt(rda.value, rda.unit)}/day` : null;

  return {
    ingredient: ingredientName,
    label_amount: labelAmount,
    label_unit: labelUnit,
    rda_or_ai: rdaText,
    ul: ul ?? { value: null, unit: null },
    category,
    explanation,
    readable
  };
}
