"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/lib/profile";
import { REF_INTAKES } from "@/data/refIntakes";

type Unit = "iu" | "mcg" | "mg" | "g" | string;

type Props = {
  ingredientName?: string | null;
  labelAmount?: number | null;
  labelUnit?: Unit | null;
  dense?: boolean;
};

/** Try to match an ingredient name to a REF_INTAKES key */
function matchRefKey(name?: string | null): keyof typeof REF_INTAKES | null {
  if (!name) return null;
  const s = name.toLowerCase();

  if (/\b(vitamin\s*d|d3|cholecalciferol)\b/.test(s)) return "vitamin d";
  if (/\b(vitamin\s*c|ascorbic)\b/.test(s))      return "vitamin c" as any;

  if (/\bcollagen\b|\bpeptides?\b/.test(s))      return "collagen" as any;

  if (/\bmag(nesium)?\b/.test(s))                return "magnesium" as any;
  if (/\bpotassium\b|\bk\b/.test(s))             return "potassium" as any;
  if (/\bsodium\b|\bna\b|\bsalt\b/.test(s))      return "sodium" as any;

  // protein: we’ll support after adding weight to Profile (g/kg/day).
  return null;
}

/** Convert doses across common units */
function convertDose(value: number, from: Unit | null | undefined, to: Unit | null | undefined): number {
  if (value == null || !isFinite(value) || !from || !to || from.toLowerCase() === to.toLowerCase()) return value;
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  // mg <-> g
  if (f === "mg" && t === "g")   return value / 1000;
  if (f === "g"  && t === "mg")  return value * 1000;

  // Vitamin D IU <-> mcg
  const vd = REF_INTAKES["vitamin d"] as any;
  if (vd?.mcg_per_iu) {
    const mcgPerIU = vd.mcg_per_iu as number; // 0.025
    if (f === "iu" && t === "mcg") return value * mcgPerIU;
    if (f === "mcg" && t === "iu") return value / mcgPerIU;
  }
  return value;
}

export default function PriceWidget({ ingredientName, labelAmount, labelUnit, dense }: Props) {
  const [profile] = useProfile();

  const [price, setPrice] = useState<string>("");
  const [unitsPerBottle, setUnitsPerBottle] = useState<string>("");
  const [unitsPerServing, setUnitsPerServing] = useState<string>("1");
  const [servingsPerDay, setServingsPerDay] = useState<string>("1");

  const suggestions = useMemo(() => {
    const key = matchRefKey(ingredientName || "");
    if (!key || !labelAmount || !labelUnit) return null;

    const group = profile.pregnant ? "pregnancy" :
      profile.ageBand === "0-12" ? "0-12" :
      profile.ageBand === "13-18" ? "13-18" :
      profile.ageBand === ">70" ? ">70" : "19-70";

    const spec = REF_INTAKES[key] as any;
    const row = (spec?.rda_ai || []).find((r: any) => r.group === group);
    if (!row) return null;

    const perServingDose = convertDose(labelAmount, labelUnit, row.unit);
    if (!perServingDose || !isFinite(perServingDose)) return null;

    const target = row.value as number; // daily target (RDA/AI or typical dose)
    const servings = target / perServingDose;
    if (!isFinite(servings) || servings <= 0) return null;

    return {
      rdaValue: target,
      rdaUnit: row.unit as Unit,
      perServingDose,
      perServingUnit: row.unit as Unit,
      servingsForRda: Math.max(0.25, Math.round(servings * 10) / 10),
    };
  }, [ingredientName, labelAmount, labelUnit, profile]);

  useEffect(() => {
    if (servingsPerDay === "1" && suggestions?.servingsForRda) {
      setServingsPerDay(String(suggestions.servingsForRda));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!suggestions]);

  const parsed = {
    price: parseFloat(price) || 0,
    count: parseFloat(unitsPerBottle) || 0,
    perServing: parseFloat(unitsPerServing) || 1,
    servingsPerDay: parseFloat(servingsPerDay) || 1,
  };

  const metrics = useMemo(() => {
    const { price, count, perServing, servingsPerDay } = parsed;
    if (!price || !count || !perServing || !servingsPerDay) return null;
    const unitsPerDay = perServing * servingsPerDay;
    if (!unitsPerDay) return null;
    const daysPerBottle = count / unitsPerDay;
    if (!isFinite(daysPerBottle) || daysPerBottle <= 0) return null;
    const perDose = price / (count / perServing);
    const perDay  = price / daysPerBottle;
    const per30   = perDay * 30;
    return { daysPerBottle: Math.floor(daysPerBottle), perDose, perDay, per30 };
  }, [parsed.price, parsed.count, parsed.perServing, parsed.servingsPerDay]);

  const fmt = (n:number) => `$${n.toFixed(2)}`;

  return (
    <div className="card" style={{ marginTop: dense ? 8 : 12 }}>
      <div className="section-title">Price per dose</div>

      <div className="row" style={{ gap: 8, flexWrap:"wrap", marginBottom:8 }}>
        <button className="btn btn-ghost" onClick={() => setServingsPerDay("1")}>Follow label: 1 serving/day</button>
        {suggestions && (
          <button className="btn btn-ghost"
            onClick={() => setServingsPerDay(String(suggestions.servingsForRda))}
            title={`Daily target ~${suggestions.rdaValue} ${String(suggestions.rdaUnit).toUpperCase()}`}>
            Match guidance: {suggestions.servingsForRda} / day
          </button>
        )}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
        <div>
          <input className="input" placeholder="Price ($)" value={price} onChange={e=>setPrice(e.target.value)} />
          <div className="muted" style={{fontSize:11, marginTop:4}}>Bottle price</div>
        </div>
        <div>
          <input className="input" placeholder="Units/bottle" value={unitsPerBottle} onChange={e=>setUnitsPerBottle(e.target.value)} />
          <div className="muted" style={{fontSize:11, marginTop:4}}>Capsules / scoops</div>
        </div>
        <div>
          <input className="input" placeholder="Units/serving" value={unitsPerServing} onChange={e=>setUnitsPerServing(e.target.value)} />
          <div className="muted" style={{fontSize:11, marginTop:4}}>Per label (e.g., 1)</div>
        </div>
        <div>
          <input className="input" placeholder="Servings/day" value={servingsPerDay} onChange={e=>setServingsPerDay(e.target.value)} />
          <div className="muted" style={{fontSize:11, marginTop:4}}>How many you take</div>
        </div>
      </div>

      {metrics ? (
        <div style={{marginTop:10}}>
          <div style={{fontSize:18, fontWeight:700}}>{fmt(metrics.perDay)} / day</div>
          <div className="muted" style={{marginTop:2}}>
            {fmt(metrics.perDose)} / serving · {fmt(metrics.per30)} / 30 days · ~{metrics.daysPerBottle} days/bottle
          </div>
          {suggestions && (
            <div className="muted" style={{marginTop:6, fontSize:12}}>
              Using label dose of {suggestions.perServingDose.toFixed(0)} {String(suggestions.perServingUnit).toUpperCase()} per serving ·
              Daily target ~{suggestions.rdaValue} {String(suggestions.rdaUnit).toUpperCase()}
            </div>
          )}
        </div>
      ) : (
        <div className="muted" style={{marginTop:8}}>Enter price and counts to calculate.</div>
      )}
    </div>
  );
}
