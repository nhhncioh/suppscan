"use client";
import React from "react";
import { useStack, stackVerdicts } from "@/lib/stack";
import { useProfile } from "@/lib/profile";

export default function StackPanel() {
  const { items, clear } = useStack();
  const [profile] = useProfile();
  const verdicts = stackVerdicts(items, profile);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="section-title" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>Stack (totals)</span>
        <button className="btn btn-ghost" onClick={clear} disabled={!items.length}>Clear</button>
      </div>

      {!items.length ? (
        <div className="muted">No items added yet.</div>
      ) : (
        <ul className="list">
          {verdicts.map((v, i) => (
            <li key={i}><strong>{v.ingredient}:</strong> {v.readable}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
