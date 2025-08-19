"use client";
import React from "react";
import { useHistoryStore } from "@/lib/history";

export default function HistoryPanel() {
  const { items, remove, clear } = useHistoryStore();
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="section-title" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>History</span>
        <button className="btn btn-ghost" onClick={clear} disabled={!items.length}>Clear</button>
      </div>
      {!items.length ? (
        <div className="muted">No scans saved yet.</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(0, 1fr))", gap:12 }}>
          {items.map(i => (
            <div key={i.id} className="card" style={{ padding:12 }}>
              {i.imgDataUrl ? <img src={i.imgDataUrl} alt="" style={{width:"100%", borderRadius:8}}/> : null}
              <div style={{ marginTop:8, fontWeight:600 }}>{i.brand || "Unknown"} — {i.product || ""}</div>
              {i.barcode && <div className="muted" style={{fontSize:12}}>Barcode: {i.barcode}</div>}
              <div className="row" style={{marginTop:8}}>
                <a className="btn btn-ghost" href={`/report?id=${encodeURIComponent(i.id)}`}>Report</a>
                <button className="btn btn-ghost" onClick={()=>remove(i.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
