"use client";
import { useEffect, useState } from "react";
import type { StackItem, Profile, IngredientAmount } from "@/types/suppscan";
import { compareToGuidelines } from "@/lib/guidelines";

const KEY = "suppscan_stack_v1";

function load(): StackItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: StackItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useStack() {
  const [items, setItems] = useState<StackItem[]>([]);
  useEffect(()=>{ setItems(load()); }, []);
  const add = (i: StackItem) => { const next = [i, ...items]; setItems(next); save(next); };
  const clear = () => { setItems([]); save([]); };
  return { items, add, clear };
}

export function totalsByIngredient(items: StackItem[]) {
  const map = new Map<string, { amount: number, unit: IngredientAmount["unit"] }>();
  for (const it of items) {
    for (const ing of it.ingredients) {
      if (ing.amount == null || !ing.unit) continue;
      const key = ing.name.trim().toLowerCase();
      const prev = map.get(key);
      if (!prev) map.set(key, { amount: ing.amount, unit: ing.unit });
      else if (prev.unit === ing.unit) prev.amount += ing.amount;
      // note: cross-unit merge could be added using convertDose per nutrient
    }
  }
  return map; // key -> {amount, unit}
}

export function stackVerdicts(items: StackItem[], profile: Profile) {
  const totals = totalsByIngredient(items);
  const list: ReturnType<typeof compareToGuidelines>[] = [];
  for (const [name, t] of totals.entries()) {
    list.push(compareToGuidelines(name, t.amount, t.unit || null, profile));
  }
  return list;
}
