import type { Unit } from "@/types/suppscan";
import { REF_INTAKES } from "@/data/refIntakes";

/** Normalize a dose to a specific unit when possible. Supports Vitamin D IU↔mcg. */
export function convertDose(
  ingredient: string,
  amount: number | null,
  from: Unit | null,
  to: Unit
): number | null {
  if (amount == null || from == null) return null;
  const key = ingredient.trim().toLowerCase();

  // Vitamin D conversion
  if (key === "vitamin d" || key === "d" || key === "d3" || key === "vitamin d3") {
    const mcg_per_iu = REF_INTAKES["vitamin d"].mcg_per_iu; // 0.025
    if (from === "iu" && to === "mcg") return amount * mcg_per_iu;
    if (from === "mcg" && to === "iu") return amount / mcg_per_iu;
  }

  // No known conversion
  return from === to ? amount : null;
}

export function fmt(n: number | null, unit?: Unit | null) {
  return n == null ? "?" : `${Number(n.toFixed(0))}${unit ? " " + unit.toUpperCase() : ""}`;
}
