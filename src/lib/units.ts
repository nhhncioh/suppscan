import type { Unit } from "@/types/suppscan";
import { REF_INTAKES } from "@/data/refIntakes";

/** Normalize a dose to a specific unit when possible. */
export function convertDose(
  ingredient: string,
  amount: number | null,
  from: Unit | null,
  to: Unit
): number | null {
  if (amount == null || from == null) return null;
  const key = (ingredient || "").trim().toLowerCase();

  // Vitamin D IU↔mcg (1 mcg = 40 IU)
  if (["vitamin d","d","d3","vitamin d3"].includes(key)) {
    const mcg_per_iu = REF_INTAKES["vitamin d"].mcg_per_iu; // 0.025
    if (from === "iu" && to === "mcg") return amount * mcg_per_iu;
    if (from === "mcg" && to === "iu") return amount / mcg_per_iu;
  }

  // Generic metric conversions
  if (from === to) return amount;
  if (from === "mg" && to === "mcg") return amount * 1000;
  if (from === "mcg" && to === "mg") return amount / 1000;
  if (from === "g" && to === "mg")   return amount * 1000;
  if (from === "mg" && to === "g")   return amount / 1000;
  if (from === "g" && to === "mcg")  return amount * 1_000_000;
  if (from === "mcg" && to === "g")  return amount / 1_000_000;

  return null; // unknown conversion
}

export function fmt(n: number | null, unit?: Unit | null) {
  return n == null ? "?" : `${Number(n.toFixed(0))}${unit ? " " + unit.toUpperCase() : ""}`;
}
