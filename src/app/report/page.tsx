"use client";
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useHistoryStore, HistoryItem } from "@/lib/history";

// Separate the component that uses useSearchParams
function ReportContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const { items } = useHistoryStore();
  const [item, setItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const found = items.find(i => i.id === id) || null;
    setItem(found);
  }, [id, items]);

  const explanation = useMemo(() => item?.explanation ?? null, [item]);

  if (!id) return <div style={{padding:24}}>Missing id.</div>;
  if (!item) return <div style={{padding:24}}>Loading…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", background: "white", color: "black" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h1 style={{ margin:0 }}>SuppScan Report</h1>
        <button onClick={()=>window.print()} className="btn btn-primary">Print / Save PDF</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:24 }}>
        <div>
          {item.imgDataUrl ? <img src={item.imgDataUrl} alt="" style={{width:"100%", border:"1px solid #ddd", borderRadius:8}}/> : null}
          {item.barcode && <div style={{marginTop:8, fontSize:12}}>Barcode: {item.barcode}</div>}
        </div>
        <div>
          <h2 style={{ marginTop:0 }}>{item.brand || "Unknown"} — {item.product || ""}</h2>
          {explanation ? (
            <>
              <h3>Uses</h3>
              <ul>{explanation.uses?.map((u:any, i:number)=><li key={i}>{u.claim} {u.evidence_level?`(${u.evidence_level})`: ""}</li>)}</ul>

              <h3>Take if</h3>
              <ul>{explanation.take_if?.map((t:any, i:number)=><li key={i}><strong>{t.scenario}:</strong> {t.rationale}</li>)}</ul>

              <h3>May help improve</h3>
              <ul>{explanation.may_improve?.map((m:any, i:number)=><li key={i}><strong>{m.area}</strong>{m.evidence_level?` (${m.evidence_level})`:""} {m.typical_timeframe?`— ${m.typical_timeframe}`:""}</li>)}</ul>

              <h3>Label vs guidelines</h3>
              <ul>{explanation.label_vs_guidelines?.map((g:any,i:number)=><li key={i}><strong>{g.ingredient}:</strong> {g.readable}</li>)}</ul>

              <h3>How to take</h3>
              <ul>{explanation.how_to_take?.map((h:any,i:number)=><li key={i}><strong>{h.ingredient}:</strong> {h.timing || ""} {h.with_food?`(${h.with_food})`:""} {h.notes?`— ${h.notes}`:""}</li>)}</ul>

              <h3>Quality considerations</h3>
              <ul>{explanation.quality_considerations?.map((q:any,i:number)=><li key={i}>{q}</li>)}</ul>

              <p style={{fontSize:12, marginTop:24}}>{explanation.disclaimer}</p>
            </>
          ) : <div>No explanation snapshot.</div>}
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ReportLoading() {
  return <div style={{padding:24}}>Loading report...</div>;
}

// Main component with Suspense wrapper
export default function ReportPage() {
  return (
    <Suspense fallback={<ReportLoading />}>
      <ReportContent />
    </Suspense>
  );
}