"use client";
import React from "react";
import type { Confidence } from "@/lib/confidence";

type Props = {
  explanation: any;
  extracted?: any;
  barcode?: string | null;
  confidence?: Confidence | null;
};

export default function ResultCard({ explanation, extracted, barcode, confidence }: Props) {
  const badges: string[] = extracted?.badges || [];
  return (
    <div className="card">
      <div className="section-title" style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
        <span>What this is (beta)</span>
        {confidence && (
          <span className="chip" title={confidence.reasons.join("; ")}>
            Confidence: {confidence.level} ({confidence.score}%)
          </span>
        )}
        {barcode && <span className="chip">Barcode: {barcode}</span>}
        {badges.map((b:string, i:number)=><span key={i} className="chip">{b}</span>)}
      </div>

      <div style={{display:"grid", gap:16}}>
        <div>
          <div className="muted">Product</div>
          <div style={{fontWeight:600}}>
            {extracted?.brandGuess || "Unknown"} — {extracted?.productGuess || ""}
          </div>
        </div>

        <div>
          <div className="muted">Label (key ingredient)</div>
          <ul className="list">
            {(extracted?.ingredients || []).map((i:any, idx:number)=>(
              <li key={idx}>{(i.name||"").toUpperCase()} — {i.amount ?? "?"} {(i.unit||"").toUpperCase()}</li>
            ))}
          </ul>
        </div>

        {!!explanation?.take_if?.length && (
          <div>
            <div className="muted">Take if</div>
            <ul className="list">
              {explanation.take_if.map((t:any, i:number)=><li key={i}><strong>{t.scenario}:</strong> {t.rationale}</li>)}
            </ul>
          </div>
        )}

        {!!explanation?.may_improve?.length && (
          <div>
            <div className="muted">May help improve</div>
            <ul className="list">
              {explanation.may_improve.map((m:any, i:number)=><li key={i}><strong>{m.area}</strong>{m.evidence_level?` (${m.evidence_level})`:""} {m.typical_timeframe?`— ${m.typical_timeframe}`:""}</li>)}
            </ul>
          </div>
        )}

        <div>
          <div className="muted">Label vs. guidelines</div>
          <ul className="list">
            {explanation.label_vs_guidelines?.map((g:any, i:number)=>(
              <li key={i}><strong>{g.ingredient}:</strong> {g.readable}</li>
            ))}
          </ul>
        </div>

        {!!explanation?.how_to_take?.length && (
          <div>
            <div className="muted">How to take</div>
            <ul className="list">
              {explanation.how_to_take.map((h:any, i:number)=><li key={i}><strong>{h.ingredient}:</strong> {h.timing || ""} {h.with_food?`(${h.with_food})`:""} {h.notes?`— ${h.notes}`:""}</li>)}
            </ul>
          </div>
        )}

        {!!explanation?.quality_considerations?.length && (
          <div>
            <div className="muted">Quality considerations</div>
            <ul className="list">
              {explanation.quality_considerations.map((q:any, i:number)=><li key={i}>{q}</li>)}
            </ul>
          </div>
        )}

        {explanation?.disclaimer && (
          <p className="muted" style={{fontSize:12, marginTop:8}}>{explanation.disclaimer}</p>
        )}
      </div>
    </div>
  );
}
