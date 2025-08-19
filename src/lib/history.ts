"use client";
import { useEffect, useState } from "react";
import type { IngredientAmount } from "@/types/suppscan";

export type HistoryItem = {
  id: string;
  when: number;
  brand?: string | null;
  product?: string | null;
  barcode?: string | null;
  imgDataUrl?: string | null;
  ingredients?: IngredientAmount[];
  explanation?: any; // snapshot for report
};

const KEY = "suppscan_history_v1";

function load(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useHistoryStore() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => { setItems(load()); }, []);
  const add = (x: HistoryItem) => { const next = [x, ...items].slice(0, 50); setItems(next); save(next); };
  const remove = (id: string) => { const next = items.filter(i => i.id !== id); setItems(next); save(next); };
  const clear = () => { setItems([]); save([]); };
  return { items, add, remove, clear };
}

export function dataUrlFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
