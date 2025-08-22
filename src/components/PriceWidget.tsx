"use client";
import React, { useMemo, useState, useCallback } from "react";
import { useProfile } from "@/lib/profile";
import { REF_INTAKES } from "@/data/refIntakes";

type Unit = "iu" | "mcg" | "mg" | "g" | string;

type Props = {
  ingredientName?: string | null;
  labelAmount?: number | null;
  labelUnit?: Unit | null;
  dense?: boolean;
};

// Memoized ingredient matching function
const matchRefKey = (name?: string | null): keyof typeof REF_INTAKES | null => {
  if (!name) return null;
  const s = name.toLowerCase();

  if (/\b(vitamin\s*d|d3|cholecalciferol)\b/.test(s)) return "vitamin d";
  if (/\b(vitamin\s*c|ascorbic)\b/.test(s)) return "vitamin c" as any;
  if (/\bcollagen\b|\bpeptides?\b/.test(s)) return "collagen" as any;
  if (/\bmag(nesium)?\b/.test(s)) return "magnesium" as any;
  if (/\bpotassium\b|\bk\b/.test(s)) return "potassium" as any;
  if (/\bsodium\b|\bna\b|\bsalt\b/.test(s)) return "sodium" as any;

  return null;
};

// Optimized unit conversion
const convertDose = (value: number, from: Unit | null | undefined, to: Unit | null | undefined): number => {
  if (value == null || !isFinite(value) || !from || !to || from.toLowerCase() === to.toLowerCase()) return value;
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  if (f === "mg" && t === "g") return value / 1000;
  if (f === "g" && t === "mg") return value * 1000;

  // Only check vitamin D conversion if needed
  if ((f === "iu" && t === "mcg") || (f === "mcg" && t === "iu")) {
    const vd = REF_INTAKES["vitamin d"] as any;
    if (vd?.mcg_per_iu) {
      const mcgPerIU = vd.mcg_per_iu as number;
      if (f === "iu" && t === "mcg") return value * mcgPerIU;
      if (f === "mcg" && t === "iu") return value / mcgPerIU;
    }
  }
  
  return value;
};

export default function PriceWidget({ ingredientName, labelAmount, labelUnit, dense }: Props) {
  const [profile] = useProfile();

  const [price, setPrice] = useState<string>("");
  const [unitsPerBottle, setUnitsPerBottle] = useState<string>("");
  const [unitsPerServing, setUnitsPerServing] = useState<string>("1");
  const [servingsPerDay, setServingsPerDay] = useState<string>("1");

  // Memoized suggestions calculation - only recalculates when dependencies change
  const suggestions = useMemo(() => {
    const key = matchRefKey(ingredientName);
    if (!key || !labelAmount || !labelUnit) return null;

    const group = profile.pregnant ? "pregnancy" :
      profile.ageBand === "0-12" ? "0-12" :
      profile.ageBand === "13-18" ? "13-18" :
      profile.ageBand === ">70" ? ">70" : "19-70";

    const spec = REF_INTAKES[key] as any;
    const row = spec?.rda_ai?.find((r: any) => r.group === group);
    if (!row) return null;

    const perServingDose = convertDose(labelAmount, labelUnit, row.unit);
    if (!perServingDose || !isFinite(perServingDose)) return null;

    const target = row.value as number;
    const rawServings = target / perServingDose;
    
    // Round to whole numbers only (never 0.5 pills)
    let practicalServings;
    if (rawServings <= 0.5) practicalServings = 1; // Always at least 1
    else if (rawServings <= 1.5) practicalServings = 1;
    else if (rawServings <= 2.5) practicalServings = 2;
    else if (rawServings <= 3.5) practicalServings = 3;
    else practicalServings = Math.round(rawServings);

    if (!isFinite(practicalServings) || practicalServings <= 0) return null;

    return {
      rdaValue: target,
      rdaUnit: row.unit as Unit,
      perServingDose,
      servingsForGuidance: practicalServings,
      actualDailyDose: perServingDose * practicalServings
    };
  }, [ingredientName, labelAmount, labelUnit, profile]);

  // Memoized calculations
  const parsed = useMemo(() => ({
    price: parseFloat(price) || 0,
    count: parseFloat(unitsPerBottle) || 0,
    perServing: parseFloat(unitsPerServing) || 1,
    servingsPerDay: parseFloat(servingsPerDay) || 1,
  }), [price, unitsPerBottle, unitsPerServing, servingsPerDay]);

  const metrics = useMemo(() => {
    const { price, count, perServing, servingsPerDay } = parsed;
    if (!price || !count || !perServing || !servingsPerDay) return null;
    
    const unitsPerDay = perServing * servingsPerDay;
    if (!unitsPerDay) return null;
    
    const daysPerBottle = count / unitsPerDay;
    if (!isFinite(daysPerBottle) || daysPerBottle <= 0) return null;
    
    const pricePerServing = (price / count) * perServing;
    const pricePerDay = (price / count) * unitsPerDay;
    
    return { 
      daysPerBottle: Math.floor(daysPerBottle), 
      pricePerServing, 
      pricePerDay, 
      per30Days: pricePerDay * 30 
    };
  }, [parsed]);

  // Optimized event handlers
  const handleFollowLabel = useCallback(() => setServingsPerDay("1"), []);
  const handleMatchGuidance = useCallback(() => {
    if (suggestions?.servingsForGuidance) {
      setServingsPerDay(String(suggestions.servingsForGuidance));
    }
  }, [suggestions]);

  const fmt = useCallback((n: number) => `$${n.toFixed(2)}`, []);

  return (
    <div className="card" style={{ marginTop: dense ? 8 : 12 }}>
      <div className="section-title">Price per dose</div>

      {/* Smart Buttons */}
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button 
          className="btn btn-ghost" 
          onClick={handleFollowLabel}
          style={{ fontSize: 13 }}
        >
          Follow label: 1 serving/day
        </button>
        {suggestions && (
          <button 
            className="btn btn-ghost"
            onClick={handleMatchGuidance}
            title={`To get ~${suggestions.rdaValue} ${String(suggestions.rdaUnit).toUpperCase()} daily target`}
            style={{ fontSize: 13 }}
          >
            Match guidance: {suggestions.servingsForGuidance} serving{suggestions.servingsForGuidance !== 1 ? 's' : ''}/day
          </button>
        )}
      </div>

      {/* Input Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <div>
          <input 
            className="input" 
            placeholder="29.99" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
          />
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Bottle price ($)</div>
        </div>
        
        <div>
          <input 
            className="input" 
            placeholder="120" 
            value={unitsPerBottle} 
            onChange={e => setUnitsPerBottle(e.target.value)} 
          />
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Units per bottle</div>
        </div>
        
        <div>
          <input 
            className="input" 
            placeholder="1" 
            value={unitsPerServing} 
            onChange={e => setUnitsPerServing(e.target.value)} 
          />
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Units per dose</div>
        </div>
        
        <div>
          <input 
            className="input" 
            placeholder="1" 
            value={servingsPerDay} 
            onChange={e => setServingsPerDay(e.target.value)} 
          />
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Doses per day</div>
        </div>
      </div>

      {/* Results */}
      {metrics ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(metrics.pricePerDay)} / day</div>
          <div className="muted" style={{ marginTop: 2 }}>
            {fmt(metrics.pricePerServing)} / dose · {fmt(metrics.per30Days)} / month · ~{metrics.daysPerBottle} days supply
          </div>
          {suggestions && (
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Each dose: {suggestions.perServingDose.toFixed(0)} {String(suggestions.rdaUnit).toUpperCase()} · 
              Daily total: {suggestions.actualDailyDose?.toFixed(0)} {String(suggestions.rdaUnit).toUpperCase()} · 
              Target: {suggestions.rdaValue} {String(suggestions.rdaUnit).toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <div className="muted" style={{ marginTop: 8 }}>Enter price and bottle details to calculate cost per dose.</div>
      )}
    </div>
  );
}