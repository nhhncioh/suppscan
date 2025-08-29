// src/components/ResultCard.tsx - Fixed syntax error
"use client";

import ProductLink from "@/components/ProductLink";
import React, { useEffect, useMemo, useState } from "react";
import { getTrustedMarkLink } from "@/lib/confidence";
import { detectFormNotes } from "@/lib/forms";
import { chooseProductUrl } from "@/lib/productUrlHeuristics";
import { SymptomMatcher, type SymptomMatch, type InteractionWarning } from "@/lib/symptomMatcher";
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
  const [symptomMatches, setSymptomMatches] = useState<SymptomMatch[]>([]);
  const [personalizedMessage, setPersonalizedMessage] = useState<string>('');
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  
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

  // Enhanced symptom matching with interactions
  useEffect(() => {
    if (explanation || extracted) {
      const supplementProfile = {
        name: productName,
        ingredients: (explanation?.ingredients || extracted?.ingredients || []).map((ing: any) => ing.name || ''),
        keyIngredient: retailFirstIngredient
      };
      
      const analysis = SymptomMatcher.analyzeSupplementForUser(supplementProfile);
      setSymptomMatches(analysis.matches);
      setPersonalizedMessage(analysis.personalizedMessage);
      setInteractionWarnings(analysis.interactions);
      setOverallScore(analysis.overallScore);
    }
  }, [explanation, extracted, productName, retailFirstIngredient]);

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
              title={confidence?.reasons?.join?.('; ') || ''}
              style={{
                background: confidence.level === "high" ? '#0c1a10' : 
                           confidence.level === "medium" ? '#1a0f0c' : '#1a1a0c',
                borderColor: confidence.level === "high" ? '#2e7d32' : 
                            confidence.level === "medium" ? '#d32f2f' : '#f57c00',
                color: confidence.level === "high" ? '#4caf50' : 
                       confidence.level === "medium" ? '#f44336' : '#ff9800'
              }}
            >
              {confidence.level} confidence
            </span>
          )}
          
          {/* Overall Symptom Match Score */}
          {overallScore > 0 && (
            <span 
              className="chip"
              title={`This supplement matches ${symptomMatches.length} of your symptoms`}
              style={{
                background: overallScore >= 6 ? '#0c1a10' : overallScore >= 3 ? '#1a0f0c' : '#1a1a0c',
                borderColor: overallScore >= 6 ? '#2e7d32' : overallScore >= 3 ? '#f57c00' : '#d32f2f',
                color: overallScore >= 6 ? '#4caf50' : overallScore >= 3 ? '#ff9800' : '#f44336'
              }}
            >
              {overallScore >= 6 ? 'Excellent' : overallScore >= 3 ? 'Good' : 'Fair'} match ({overallScore.toFixed(1)})
            </span>
          )}
        </div>
        
        {badges?.length > 0 && (
          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:8}}>
            {badges.map((b:string, i:number) => (
              <span key={i} className="badge" style={{color:"#4caf50"}}>{b}</span>
            ))}
          </div>
        )}
        
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:8}}>
          {marks?.map((m:string,i:number) => {
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

      {/* Personalized Message Banner */}
      {personalizedMessage && (
        <div style={{
          margin: '0 20px 16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          border: '1px solid #34d399'
        }}>
          <div style={{
            color: 'white',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: symptomMatches.length > 0 ? '8px' : '0'
          }}>
            {personalizedMessage}
          </div>
          {symptomMatches.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {symptomMatches.slice(0, 4).map(match => (
                <span
                  key={match.symptomId}
                  style={{
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {match.symptomName}
                  <span style={{ 
                    fontSize: '10px', 
                    opacity: 0.8,
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '1px 4px'
                  }}>
                    {match.confidence}
                  </span>
                </span>
              ))}
              {symptomMatches.length > 4 && (
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  padding: '4px 8px'
                }}>
                  +{symptomMatches.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interaction Warnings */}
      {interactionWarnings.length > 0 && (
        <div style={{
          margin: '0 20px 16px',
          padding: '12px 16px',
          background: interactionWarnings.some(w => w.severity === 'serious') 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '12px',
          border: interactionWarnings.some(w => w.severity === 'serious') 
            ? '1px solid #f87171' 
            : '1px solid #fbbf24'
        }}>
          <div style={{
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⚠️ {interactionWarnings.some(w => w.severity === 'serious') ? 'Important' : 'Supplement'} Interactions
          </div>
          {interactionWarnings.slice(0, 2).map((warning, i) => (
            <div key={i} style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: i < interactionWarnings.length - 1 ? '6px' : '0',
              lineHeight: '1.4'
            }}>
              • {warning.warning}
            </div>
          ))}
          {interactionWarnings.length > 2 && (
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '4px'
            }}>
              +{interactionWarnings.length - 2} more interaction(s) to consider
            </div>
          )}
        </div>
      )}

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
            {/* Enhanced Symptom Matching Section */}
            {symptomMatches.length > 0 && (
              <div style={{marginBottom: 20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 Your Symptom Matches
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px'}}>
                  {symptomMatches.map(match => (
                    <div key={match.symptomId} style={{
                      padding: '12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#10b981',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>{match.symptomName}</span>
                        <span style={{
                          fontSize: '10px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {match.confidence}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6ee7b7',
                        opacity: 0.9
                      }}>
                        {match.reason}
                        {match.severity && (
                          <span style={{ marginLeft: '8px' }}>
                            • Severity: {match.severity}/5
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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

            {!allUnknown && gl.length > 0 && (
              <div style={{marginBottom: 20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📊 Label vs Guidelines
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {gl
                    .filter((g:any) => g?.category !== "unknown")
                    .map((g:any,i:number) => (
                      <div key={i} style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid #23252c',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          color: '#f4f5f7',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>
                          {g.ingredient}
                        </div>
                        <div style={{
                          color: '#a2a6ad',
                          fontSize: '14px'
                        }}>
                          {g.readable}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {explanation?.uses && explanation.uses.length > 0 && (
              <div style={{marginBottom: 20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 Common Uses
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {explanation.uses.map((use:any, i:number) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid #23252c',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        color: '#e2e8f0',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {use.claim} {use.evidence_level && (
                          <span style={{
                            color: '#a2a6ad',
                            fontSize: '12px'
                          }}>
                            ({use.evidence_level})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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