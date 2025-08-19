"use client";
import React from "react";
import { useProfile } from "@/lib/profile";

export default function ProfileBar() {
  const [p, set] = useProfile();
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-title">Profile</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        <label>
          <div className="muted" style={{fontSize:12}}>Age</div>
          <select
            value={p.ageBand}
            onChange={e=>set({...p, ageBand: e.target.value as any})}
            style={{ width:"100%", background:"#0e0f14", color:"white", border:"1px solid var(--border)", borderRadius:8, padding:"8px" }}
          >
            <option value="0-12">0–12</option>
            <option value="13-18">13–18</option>
            <option value="19-70">19–70</option>
            <option value=">70">&gt; 70</option>
          </select>
        </label>
        <label>
          <div className="muted" style={{fontSize:12}}>Sex</div>
          <select
            value={p.sex}
            onChange={e=>set({...p, sex: e.target.value as any})}
            style={{ width:"100%", background:"#0e0f14", color:"white", border:"1px solid var(--border)", borderRadius:8, padding:"8px" }}
          >
            <option value="unspecified">Unspecified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label style={{ alignSelf:"end" }}>
          <input
            type="checkbox"
            checked={p.pregnant}
            onChange={e=>set({...p, pregnant: e.target.checked})}
            style={{ marginRight:8 }}
          />
          Pregnant
        </label>
      </div>
    </div>
  );
}
