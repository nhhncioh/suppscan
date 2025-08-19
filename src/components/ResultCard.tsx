"use client";
import React from "react";

export default function ResultCard({ explanation, extracted }: { explanation: any; extracted: any; }) {
  const k = explanation?.product_summary || {};
  const ings: any[] = extracted?.ingredients || [];
  const badges: string[] = extracted?.badges || [];
  const npn = k.npn || extracted?.npn || null;

  const section = (t: string) => <div style={{ fontWeight: 700, margin: "14px 0 8px" }}>{t}</div>;
  const bulletList: React.CSSProperties = { margin: "0 0 12px 18px", lineHeight: 1.5 };

  return (
    <div style={{ textAlign: "left", marginTop: 16, background: "#111", border: "1px solid #333", borderRadius: 12, padding: 18 }}>
      <div style={{ textAlign: "center", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>What this is (beta)</div>

      {section("Product")}
      <div style={{ opacity: 0.95, fontWeight: 500 }}>
        {(k.brand || extracted?.brandGuess) ?? "Unknown brand"} — {(k.product || extracted?.productGuess) ?? "Unknown product"}
        {npn ? <> · NPN {npn}</> : null}
      </div>
      {badges.length > 0 && (
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {badges.map((b, i) => (
            <span key={i} style={{ fontSize:12, padding:"4px 8px", border:"1px solid #2e7d32", borderRadius:999, background:"#0c1a10" }}>
              {b}
            </span>
          ))}
        </div>
      )}

      {explanation.overview && (<>{section("Overview")}<div>{explanation.overview}</div></>)}

      {section("Label (key ingredient)")}
      <ul style={bulletList}>
        {ings.length === 0 ? <li>Unknown</li> :
          ings.map((i, idx) => <li key={idx}><strong>{i.name}</strong>{i.amount ? ` — ${i.amount}` : ""}{i.unit ? ` ${i.unit.toUpperCase()}` : ""}</li>)}
      </ul>

      {section("Take if")}
      <ul style={{ ...bulletList, listStyle: "none", paddingLeft: 0 }}>
        {(explanation.take_if || []).map((t: any, i: number) => (
          <li key={i} style={{ marginLeft: 0 }}>
            <span style={{ marginRight: 6 }}>✓</span>
            <strong>{t?.scenario || "—"}</strong>
            {t?.rationale ? <span style={{ opacity: 0.85 }}> — {t.rationale}</span> : null}
          </li>
        ))}
      </ul>

      {section("May help improve")}
      <ul style={bulletList}>
        {(explanation.may_improve || []).map((m: any, i: number) => (
          <li key={i}>
            {m?.area || "—"}
            {m?.evidence_level ? <> — <em style={{ opacity:0.8 }}>{m.evidence_level}</em></> : null}
            {m?.typical_timeframe ? ` • ${m.typical_timeframe}` : ""}
          </li>
        ))}
      </ul>

      {section("Label vs. guidelines")}
      <ul style={bulletList}>
        {(explanation.label_vs_guidelines || []).map((g: any, i: number) => (
          <li key={i}>
            {g?.ingredient ? <strong>{g.ingredient}:</strong> : null} {g?.readable || "guidance unavailable"}
          </li>
        ))}
      </ul>

      {section("Typical adult dose")}
      <ul style={bulletList}>
        {(explanation.typical_adult_dose || []).map((d: any, i: number) => (
          <li key={i}>
            {(d?.ingredient || "Ingredient")}: {d?.range ?? "unknown"}{d?.unit ? ` ${d.unit}` : ""}{d?.context ? ` (${d.context})` : ""}
          </li>
        ))}
      </ul>

      {(explanation.how_to_take?.length ?? 0) > 0 && (
        <>
          {section("How to take")}
          <ul style={bulletList}>
            {explanation.how_to_take.map((h: any, i: number) => (
              <li key={i}>
                {(h?.ingredient || "Ingredient")}: {h?.timing || "timing: n/a"}{h?.with_food ? ` • with food: ${h.with_food}` : ""}{h?.notes ? ` • ${h.notes}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}

      {section("Upper limits & warnings")}
      <ul style={bulletList}>
        {(explanation.upper_limits_and_warnings || []).map((w: any, i: number) => (
          <li key={i}>{typeof w === "string" ? w : (w?.note || "—")}</li>
        ))}
      </ul>

      {(explanation.interactions_and_contraindications?.length ?? 0) > 0 && (
        <>
          {section("Interactions / contraindications")}
          <ul style={bulletList}>
            {explanation.interactions_and_contraindications.map((x: any, i: number) => (
              <li key={i}>{x?.item ? <><strong>{x.item}:</strong> </> : null}{x?.note || ""}</li>
            ))}
          </ul>
        </>
      )}

      {section("Quality considerations")}
      <ul style={bulletList}>
        {(explanation.quality_considerations || []).map((q: any, i: number) => (
          <li key={i}>{typeof q === "string" ? q : JSON.stringify(q)}</li>
        ))}
      </ul>

      {(explanation.references?.length ?? 0) > 0 && (
        <>
          {section("References")}
          <ul style={bulletList}>
            {explanation.references.map((r: any, i: number) => (
              <li key={i}><a href={r?.url} target="_blank" rel="noreferrer">{r?.title || r?.url}</a></li>
            ))}
          </ul>
        </>
      )}

      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
        {explanation.disclaimer || "General information only; not medical advice."}
      </div>
    </div>
  );
}
