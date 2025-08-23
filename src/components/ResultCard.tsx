// src/components/ResultCard.tsx - FIXED - Using your exact original logic
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

  // YOUR ORIGINAL LOGIC - PRESERVED EXACTLY
  const gl = Array.isArray(explanation?.label_vs_guidelines) 
    ? explanation.label_vs_guidelines 
    : [];
  
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
        padding: '10px 16px',
        border: 'none',
        backgroundColor: activeTab === tab ? '#007bff' : 'transparent',
        color: activeTab === tab ? 'white' : '#a2a6ad',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: activeTab === tab ? '600' : 'normal',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        background: activeTab === tab 
          ? 'linear-gradient(135deg, #4ade80, #22c55e)' 
          : 'rgba(255, 255, 255, 0.02)',
        borderBottom: activeTab === tab ? '2px solid #4ade80' : '2px solid transparent'
      }}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span style={{
          backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.3)' : '#4ade80',
          color: activeTab === tab ? 'white' : '#0b0c0f',
          borderRadius: '12px',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: '600',
          minWidth: '18px',
          textAlign: 'center'
        }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #121319 0%, #0b0c0f 100%)',
      border: '1px solid #23252c',
      borderRadius: '16px',
      overflow: 'hidden',
      marginTop: '16px'
    }}>
      
      {/* Enhanced Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #1a1d24 0%, #141821 100%)',
        borderBottom: '1px solid #23252c'
      }}>
        <div style={{marginTop:8}}>
          <ProductLink 
            brand={brandStr} 
            product={productName} 
            ingredient={retailFirstIngredient} 
            amount={retailAmount} 
            unit={retailUnit} 
          />
        </div>
        
        <div style={{
          display:"flex", 
          gap:8, 
          alignItems:"center", 
          flexWrap:"wrap",
          marginTop: 12
        }}>
          <span style={{color: '#f4f5f7', fontWeight: '600'}}>Analysis Results</span>
          {confidence && (
            <span 
              className="chip" 
              title={confidence?.reasons?.join?.("; ") || ""}
              style={{
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                color: '#4ade80',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}
            >
              Confidence: {confidence.level} ({confidence.score}%)
            </span>
          )}
          {barcode && (
            <span 
              className="chip"
              style={{
                background: 'rgba(96, 165, 250, 0.1)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                color: '#60a5fa',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}
            >
              Barcode: {barcode}
            </span>
          )}
          {badges.map((b, i)=>(
            <span 
              key={i} 
              className="chip"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}
            >
              {b}
            </span>
          ))}
          {marks.map((m, i)=>{
            const href = getTrustedMarkLink(m);
            return href
              ? (
                <a key={i} className="chip" href={href} target="_blank" rel="noopener noreferrer"
                   style={{
                     background: 'rgba(96, 165, 250, 0.1)',
                     border: '1px solid rgba(96, 165, 250, 0.3)',
                     color: '#60a5fa',
                     fontSize: '12px',
                     padding: '4px 8px',
                     borderRadius: '12px',
                     fontWeight: '500',
                     textDecoration: 'none'
                   }}>
                  {m}
                </a>
              )
              : (
                <span 
                  key={i} 
                  className="chip"
                  style={{
                    background: 'rgba(96, 165, 250, 0.1)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    color: '#60a5fa',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}
                >
                  {m}
                </span>
              );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: '#0e0f14',
        borderBottom: '1px solid #23252c',
        padding: '8px 16px',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <TabButton tab="analysis">🔬 Analysis</TabButton>
        <TabButton tab="reviews" count={reviewCount}>⭐ Reviews</TabButton>
        <TabButton tab="price">💰 Pricing</TabButton>
      </div>

      {/* Tab Content */}
      <div style={{padding: '20px'}}>
        {activeTab === 'analysis' && (
          <div>
            {/* ORIGINAL ANALYSIS CONTENT - EXACTLY AS YOU HAD IT */}
            
            {explanation?.summary && (
              <div style={{marginBottom: 20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📋 Summary
                </div>
                <p style={{
                  margin: 0, 
                  color: '#e2e8f0', 
                  lineHeight: '1.6',
                  fontSize: '15px'
                }}>
                  {explanation.summary}
                </p>
              </div>
            )}

            {!!explanation?.ingredients?.length && (
              <div style={{marginTop:16}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🧪 Active ingredients
                </div>
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {explanation.ingredients.map((i:any, idx:number)=>(
                    <li key={idx}>
                      <strong style={{color: '#f4f5f7'}}>{(i.name||"").toUpperCase()}</strong> — {i.amount ?? "?"} {String(i.unit||"").toUpperCase()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!explanation?.take_if?.length && (
              <div style={{marginTop:16}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 Take if
                </div>
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {explanation.take_if.map((t:any, i:number)=>(
                    <li key={i}>
                      <strong style={{color: '#f4f5f7'}}>{t.scenario}:</strong> {t.rationale}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!explanation?.may_improve?.length && (
              <div style={{marginTop:16}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🌟 May help improve
                </div>
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {explanation.may_improve.map((m:any, i:number)=>(
                    <li key={i}>
                      <strong style={{color: '#f4f5f7'}}>{m.area}</strong>
                      {m.evidence_level ? ` (${m.evidence_level})` : ""}
                      {m.typical_timeframe ? ` — ${m.typical_timeframe}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* THE CORE DOSAGE ANALYSIS - YOUR ORIGINAL LOGIC */}
            <div style={{marginTop:16}}>
              <div style={{
                fontWeight: '600', 
                color: '#f4f5f7', 
                marginBottom: '8px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Dosage vs Guidelines
              </div>
              {allUnknown ? (
                <div style={{
                  color: '#a2a6ad',
                  fontStyle: 'italic',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid #23252c'
                }}>
                  We don't have numeric baselines for these ingredients yet, but you can still use the guidance above.
                </div>
              ) : (
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {gl.map((g:any, i:number)=>(
                    <li key={i}>
                      <strong style={{color: '#f4f5f7'}}>{g.ingredient}:</strong> {g.readable}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!!formNotes.length && (
              <div style={{marginTop:16}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💊 Form & absorption notes
                </div>
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {formNotes.map((f:any, i:number)=>(
                    <li key={i}>
                      <strong style={{color: '#f4f5f7'}}>{f.form}:</strong> {f.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!explanation?.how_to_take?.length && (
              <div style={{marginTop:16}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⏰ How to take
                </div>
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {explanation.how_to_take.map((h:any, i:number)=>(
                    <li key={i}>
                      <strong style={{color: '#f4f5f7'}}>{h.ingredient}:</strong> {h.timing || ""} {h.with_food ? `(${h.with_food})` : ""} {h.notes ? `— ${h.notes}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanation?.quality_considerations?.length && (
              <div style={{marginTop:16}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '8px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🏆 Quality considerations
                </div>
                <ul style={{margin: '0 0 12px 20px', lineHeight: '1.55', color: '#d1d5db'}}>
                  {explanation.quality_considerations.map((q:any,i:number)=>(
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {explanation?.disclaimer && (
              <div style={{
                marginTop: 24,
                padding: '12px',
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#fcd34d',
                lineHeight: '1.4'
              }}>
                <strong>⚠️ Disclaimer:</strong> {explanation.disclaimer}
              </div>
            )}

            {(improvedProductUrl || amazonUrl) && (
              <div style={{
                marginTop: 20,
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px solid #23252c'
              }}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🛒 Where to buy
                </div>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {improvedProductUrl && (
                    <a 
                      href={improvedProductUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Official Website ↗
                    </a>
                  )}
                  {amazonUrl && (
                    <a 
                      href={amazonUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Amazon ↗
                    </a>
                  )}
                </div>
              </div>
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

        {activeTab === 'price' && <PriceWidget />}
      </div>
    </div>
  );
}