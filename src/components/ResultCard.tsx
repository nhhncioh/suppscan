"use client";

import ProductLink from "@/components/ProductLink";
import React, { useEffect, useMemo, useState } from "react";
import { getTrustedMarkLink } from "@/lib/confidence";
import { detectFormNotes } from "@/lib/forms";
import { chooseProductUrl } from "@/lib/productUrlHeuristics";
import dynamic from 'next/dynamic';

const ReviewsTab = dynamic(() => import('./ReviewsTab'), {
  loading: () => <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading reviews...</div>
});

const PriceWidget = dynamic(() => import('./PriceWidget'), {
  loading: () => <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading calculator...</div>
});

type ConfidenceT = { level: string; score: number; reasons?: string[] } | null;
type Props = { explanation: any; extracted?: any; barcode?: string | null; confidence?: ConfidenceT; };

export default function ResultCard({ explanation, extracted, barcode, confidence }: Props) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'reviews' | 'price'>('analysis');
  const [reviewCount, setReviewCount] = useState<number>(0);
  
  useEffect(() => {
    const handleSwitchToPriceTab = () => {
      setActiveTab('price');
    };
    
    document.addEventListener('switchToPriceTab', handleSwitchToPriceTab);
    
    return () => {
      document.removeEventListener('switchToPriceTab', handleSwitchToPriceTab);
    };
  }, []);

  const brandStr = (explanation?.brand ?? extracted?.brandGuess ?? "") as string;
  const productName = (explanation?.product ?? extracted?.productGuess ?? "") as string;

  const manufacturerUrl =
    (explanation?.links?.manufacturer as string) ||
    (explanation?.links?.website as string) ||
    (explanation?.website as string) || "";

  const retailFirstIngredient = (
    explanation?.label?.key_ingredient ??
    explanation?.ingredients?.[0]?.name ??
    extracted?.ingredients?.[0]?.name ??
    ""
  ) as string;

  const retailAmount = (
    explanation?.ingredients?.[0]?.amount ??
    extracted?.ingredients?.[0]?.amount ??
    null
  ) as number | null;

  const retailUnit = (
    explanation?.ingredients?.[0]?.unit ??
    extracted?.ingredients?.[0]?.unit ??
    null
  ) as string | null;

  const [amazonUrl, setAmazonUrl] = useState<string | null>(null);

  useEffect(() => {
    const payload = {
      brand: brandStr,
      product: productName,
      ingredient: retailFirstIngredient,
      amount: retailAmount,
      unit: retailUnit,
      manufacturerUrl,
    };
    fetch("/api/amazon/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => r.json())
      .then(d => { if (d?.ok && d?.url) setAmazonUrl(d.url); })
      .catch(()=>{});
  }, [brandStr, productName, retailFirstIngredient, retailAmount, retailUnit, manufacturerUrl]);

  const gl = Array.isArray(explanation?.label_vs_guidelines) ?
    explanation.label_vs_guidelines : [];
  const allUnknown = gl.length > 0 && gl.every((g:any)=>g?.category === "unknown");

  const formNotes = useMemo(() => {
    const names = (extracted?.ingredients || []).map((i:any)=>String(i.name||""));
    return detectFormNotes(names);
  }, [extracted]);

  const badges: string[] = extracted?.badges || [];
  const marks: string[] = extracted?.marks || [];

  const currentProductUrl =
    (explanation?.links?.product_page as string) ||
    (explanation?.product_page as string) ||
    "";

  const improvedProductUrl = chooseProductUrl({
    manufacturerUrl,
    currentUrl: currentProductUrl,
    productName,
    firstIngredient: retailFirstIngredient,
  }) || currentProductUrl || manufacturerUrl || "";

  const TabButton = ({ 
    tab, 
    children, 
    count 
  }: { 
    tab: 'analysis' | 'reviews' | 'price'; 
    children: React.ReactNode;
    count?: number;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`tab-button ${activeTab === tab ? 'active' : ''}`}
      style={{
        padding: '8px 16px',
        border: 'none',
        backgroundColor: activeTab === tab ? '#007bff' : 'transparent',
        color: activeTab === tab ? 'white' : '#666',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
      {count !== undefined && (
        <span style={{
          backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.3)' : '#e9ecef',
          color: activeTab === tab ? 'white' : '#666',
          borderRadius: '12px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="card">
      <div style={{marginTop:8}}>
        <ProductLink brand={brandStr} product={productName} ingredient={retailFirstIngredient} amount={retailAmount} unit={retailUnit} />
      </div>
      
      <div className="section-title" style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
        <span>What this is (beta)</span>
        {confidence && (
          <span className="chip" title={confidence?.reasons?.join?.("; ") || ""}>
            Confidence: {confidence.level} ({confidence.score}%)
          </span>
        )}
        {barcode && <span className="chip">Barcode: {barcode}</span>}
        {badges.map((b, i)=><span key={i} className="chip">{b}</span>)}
        {marks.map((m, i)=>{
          const href = getTrustedMarkLink(m);
          return href
            ? <a key={i} className="chip" href={href} target="_blank" rel="noreferrer">{m} · Verify ↗</a>
            : <span key={i} className="chip">{m}</span>;
        })}
      </div>

      <div>
        <div>
          <div className="muted">Product</div>
          <h2 style={{ margin: "4px 0 2px 0" }}>
            {brandStr || "Unknown"} — {productName || ""}
          </h2>

          <div style={{marginTop:8, display:"flex", gap:8, flexWrap:"wrap"}}>
            {amazonUrl ? (
              <a className="btn" href={amazonUrl} target="_blank" rel="noreferrer">Amazon page ↗</a>
            ) : improvedProductUrl ? (
              <a className="btn" href={improvedProductUrl} target="_blank" rel="noreferrer">Product page ↗</a>
            ) : null}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          marginTop: 16, 
          marginBottom: 16, 
          display: 'flex', 
          gap: 8,
          borderBottom: '1px solid #e9ecef',
          paddingBottom: 8
        }}>
          <TabButton tab="analysis">
            Analysis
          </TabButton>
          <TabButton tab="reviews" count={reviewCount > 0 ? reviewCount : undefined}>
            What People Are Saying
          </TabButton>
          <TabButton tab="price">
            Price Calculator
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'analysis' && (
          <div>
            <div style={{marginTop:12}}>
              <div className="muted">Label (key ingredient)</div>
              <ul className="list">
                {(extracted?.ingredients || []).map((i:any, idx:number)=>(
                  <li key={idx}>
                    {String(i.name||"").toUpperCase()} — {i.amount ?? "?"} {String(i.unit||"").toUpperCase()}
                  </li>
                ))}
              </ul>
            </div>

            {!!explanation?.take_if?.length && (
              <div style={{marginTop:12}}>
                <div className="muted">Take if</div>
                <ul className="list">
                  {explanation.take_if.map((t:any, i:number)=>(
                    <li key={i}><strong>{t.scenario}:</strong> {t.rationale}</li>
                  ))}
                </ul>
              </div>
            )}

            {!!explanation?.may_improve?.length && (
              <div style={{marginTop:12}}>
                <div className="muted">May help improve</div>
                <ul className="list">
                  {explanation.may_improve.map((m:any, i:number)=>(
                    <li key={i}>
                      <strong>{m.area}</strong>
                      {m.evidence_level ? ` (${m.evidence_level})` : ""}
                      {m.typical_timeframe ? ` — ${m.typical_timeframe}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{marginTop:12}}>
              <div className="muted">Label vs. guidelines</div>
              {allUnknown ? (
                <div className="muted">
                  We don't have numeric baselines for these ingredients yet, but you can still use the guidance above.
                </div>
              ) : (
                <ul className="list">
                  {gl.map((g:any, i:number)=>(
                    <li key={i}><strong>{g.ingredient}:</strong> {g.readable}</li>
                  ))}
                </ul>
              )}
            </div>

            {!!formNotes.length && (
              <div style={{marginTop:12}}>
                <div className="muted">Form & absorption notes</div>
                <ul className="list">
                  {formNotes.map((f:any, i:number)=>(
                    <li key={i}><strong>{f.form}:</strong> {f.note}</li>
                  ))}
                </ul>
              </div>
            )}

            {!!explanation?.how_to_take?.length && (
              <div style={{marginTop:12}}>
                <div className="muted">How to take</div>
                <ul className="list">
                  {explanation.how_to_take.map((h:any, i:number)=>(
                    <li key={i}>
                      <strong>{h.ingredient}:</strong> {h.timing || ""} {h.with_food ? `(${h.with_food})` : ""} {h.notes ? `— ${h.notes}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation?.quality_considerations?.length ? (
              <div style={{marginTop:12}}>
                <div className="muted">Quality considerations</div>
                <ul className="list">
                  {explanation.quality_considerations.map((q:any, i:number)=>(
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {explanation?.disclaimer && (
              <p className="muted" style={{fontSize:12, marginTop:12}}>
                {explanation.disclaimer}
              </p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab 
            productName={productName} 
            brandName={brandStr}
            onReviewCountChange={setReviewCount}
          />
        )}

        {activeTab === 'price' && (
          <PriceWidget 
            ingredientName={retailFirstIngredient}
            labelAmount={retailAmount}
            labelUnit={retailUnit}
            dense={false}
          />
        )}
      </div>
    </div>
  );
}