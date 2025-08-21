"use client";
import React, { useMemo, useState } from "react";
import { useHistoryStore, HistoryItem } from "@/lib/history";
import PriceWidget from "@/components/PriceWidget";

function ItemCard({ item }: { item: HistoryItem }) {
  const explanation = item.explanation || {};
  return (
    <div className="card" style={{height:"100%", display:"grid", gap:12}}>
      {item.imgDataUrl && <img src={item.imgDataUrl} style={{width:"100%", borderRadius:8}} alt=""/>}
      <div style={{fontWeight:700}}>{item.brand || "Unknown"} — {item.product || ""}</div>

      <div>
        <div className="muted">Ingredients</div>
        <ul className="list">
          {(item.ingredients || []).map((i:any, idx:number)=>(
            <li key={idx}><strong>{(i.name||"").toUpperCase()}</strong> — {i.amount ?? "?"} {(i.unit||"").toUpperCase()}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="muted">Label vs. guidelines</div>
        <ul className="list">
          {(explanation.label_vs_guidelines || []).map((g:any, i:number)=>(
            <li key={i}><strong>{g.ingredient}:</strong> {g.readable}</li>
          ))}
        </ul>
      </div>

      <PriceWidget dense />
    </div>
  );
}

export default function ComparePage() {
  const { items } = useHistoryStore();
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  const opt = items.map(i => ({ id: i.id, title: `${i.brand || "Unknown"} — ${i.product || ""}` }));
  const A = useMemo(()=> items.find(i=>i.id===a) || null, [a, items]);
  const B = useMemo(()=> items.find(i=>i.id===b) || null, [b, items]);

  return (
    <div style={{maxWidth:1000, margin:"0 auto", padding:24}}>
      <h1 style={{marginTop:0}}>Compare</h1>
      <div className="card" style={{marginBottom:12}}>
        <div className="section-title">Choose two scans</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <select className="input" value={a} onChange={e=>setA(e.target.value)}>
            <option value="">Select first…</option>
            {opt.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <select className="input" value={b} onChange={e=>setB(e.target.value)}>
            <option value="">Select second…</option>
            {opt.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        </div>
      </div>

      {A && B ? (
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
          <ItemCard item={A}/>
          <ItemCard item={B}/>
        </div>
      ) : (
        <div className="muted">Select two items from your history to compare ingredients, guideline alignment, and price per dose.</div>
      )}
    </div>
  );
}
