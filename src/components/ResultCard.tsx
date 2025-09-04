// src/components/ResultCard.tsx - Complete Enhanced Version with Review System
"use client";

import ProductLink from "@/components/ProductLink";
import React, { useEffect, useMemo, useState } from "react";
import { getTrustedMarkLink } from "@/lib/confidence";
import { detectFormNotes } from "@/lib/forms";
import { chooseProductUrl } from "@/lib/productUrlHeuristics";
import { SymptomMatcher, type SymptomMatch, type InteractionWarning } from "@/lib/symptomMatcher";
import { useProfileStore } from '@/lib/userProfile';
import { getPersonalizedAnalysis } from '@/lib/profileIntegration';
import { User, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import review system components
import { PostScanReviewPrompt, ProductInsightsDisplay } from './ReviewSystem';

const ReviewsTab = dynamic(() => import('./ReviewsTab'), {
  loading: () => <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading reviews...</div>
});

const PriceWidget = dynamic(() => import('./PriceWidget'), {
  loading: () => <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading calculator...</div>
});

type ConfidenceT = { level: string; score: number; reasons?: string[] } | null;
type Props = { explanation: any; extracted?: any; barcode?: string | null; confidence?: ConfidenceT; };

// Inline PersonalizedSection Component - PRESERVED
function PersonalizedSection({ supplementData }: {
  supplementData: {
    name?: string;
    brand?: string;
    ingredients?: string[];
    keyIngredient?: string;
    form?: string;
    price?: number;
  };
}) {
  const { profile, isComplete } = useProfileStore();
  
  const personalizedAnalysis = useMemo(() => {
    if (!profile || !isComplete) return null;
    return getPersonalizedAnalysis(supplementData, profile);
  }, [supplementData, profile, isComplete]);

  if (!personalizedAnalysis) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <User size={20} color="#6366f1" />
          <div>
            <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600', margin: 0 }}>
              Get Personalized Analysis
            </h4>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>
              Create your health profile for customized recommendations
            </p>
          </div>
        </div>
        <a 
          href="/profile"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Setup Profile
        </a>
      </div>
    );
  }

  const { goalAlignment, riskAssessment, dosageRecommendations, lifestyleCompatibility, personalizedMessage } = personalizedAnalysis;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <User size={20} color="#10b981" />
        <div>
          <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Personalized for {profile.name}
          </h4>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>
            {personalizedMessage}
          </p>
        </div>
      </div>

      {/* Goal Alignment */}
      {(goalAlignment.primaryMatches.length > 0 || goalAlignment.secondaryMatches.length > 0) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Target size={16} color="#10b981" />
            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
              Goal Alignment ({goalAlignment.relevanceScore}% match)
            </span>
          </div>
          
          {goalAlignment.primaryMatches.map((match, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ color: '#e5e7eb', fontSize: '13px' }}>{match}</span>
            </div>
          ))}
          
          {goalAlignment.secondaryMatches.map((match, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <Info size={14} color="#3b82f6" />
              <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{match}</span>
            </div>
          ))}
        </div>
      )}

      {/* Risk Assessment */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          {riskAssessment.safetyScore >= 80 ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <AlertTriangle size={16} color="#f59e0b" />
          )}
          <span style={{ 
            color: riskAssessment.safetyScore >= 80 ? '#10b981' : '#f59e0b', 
            fontSize: '14px', 
            fontWeight: '600' 
          }}>
            Safety Score: {riskAssessment.safetyScore}/100
          </span>
        </div>

        {/* Warnings */}
        {[...riskAssessment.medicationInteractions, ...riskAssessment.allergyWarnings, ...riskAssessment.conditionConsiderations].map((warning, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '4px',
            padding: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px'
          }}>
            <AlertTriangle size={14} color="#ef4444" style={{ marginTop: '1px' }} />
            <span style={{ color: '#fecaca', fontSize: '12px', lineHeight: '1.4' }}>{warning}</span>
          </div>
        ))}
      </div>

      {/* Dosage Recommendations */}
      {dosageRecommendations.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Info size={16} color="#3b82f6" />
            <span style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>
              Personalized Dosage
            </span>
          </div>
          
          {dosageRecommendations.map((rec, index) => (
            <div key={index} style={{
              padding: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              marginBottom: '8px'
            }}>
              <div style={{ color: '#93c5fd', fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>
                {rec.adjustmentReason}
              </div>
              <div style={{ color: '#e5e7eb', fontSize: '12px', lineHeight: '1.4' }}>
                {rec.recommendedDosage} • {rec.timing} • {rec.withFood ? 'With food' : 'With or without food'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lifestyle Compatibility */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '8px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: lifestyleCompatibility.dietaryCompatibility ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '2px' }}>
            {lifestyleCompatibility.dietaryCompatibility ? '✅' : '❌'}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>Diet Compatible</div>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: lifestyleCompatibility.formPreference ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '2px' }}>
            {lifestyleCompatibility.formPreference ? '✅' : '➖'}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>Preferred Form</div>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: lifestyleCompatibility.budgetFit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '2px' }}>
            {lifestyleCompatibility.budgetFit ? '✅' : '💰'}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '11px' }}>Budget Fit</div>
        </div>
      </div>
    </div>
  );
}

export default function ResultCard({ explanation, extracted, barcode, confidence }: Props) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'reviews' | 'price' | 'community'>('analysis');
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [symptomMatches, setSymptomMatches] = useState<SymptomMatch[]>([]);
  const [personalizedMessage, setPersonalizedMessage] = useState<string>('');
  const [interactionWarnings, setInteractionWarnings] = useState<InteractionWarning[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [showReviewPrompt, setShowReviewPrompt] = useState(true);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
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

  // Enhanced symptom matching with interactions - PRESERVED
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
    tab: 'analysis' | 'reviews' | 'price' | 'community'; 
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
      
      {/* Enhanced Header - PRESERVED */}
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

      {/* Personalized Message Banner - PRESERVED */}
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

      {/* Interaction Warnings - PRESERVED */}
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

      {/* Tab Navigation - ENHANCED WITH NEW COMMUNITY TAB */}
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
        <TabButton tab="community">👥 Community</TabButton>
        <TabButton tab="price">💰 Pricing</TabButton>
      </div>

      {/* Tab Content */}
      <div style={{padding: '20px'}}>
        {activeTab === 'analysis' && (
          <div>
            {/* PERSONALIZED ANALYSIS SECTION - PRESERVED */}
            <PersonalizedSection 
              supplementData={{
                name: productName,
                brand: brandStr,
                ingredients: (explanation?.ingredients || extracted?.ingredients || []).map((ing: any) => ing.name || ''),
                keyIngredient: retailFirstIngredient,
                form: extracted?.form,
                price: extracted?.price
              }}
            />

            {/* Enhanced Symptom Matching Section - PRESERVED */}
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
            
            {/* ALL ORIGINAL ANALYSIS CONTENT - EXACTLY PRESERVED */}
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

        {/* NEW COMMUNITY TAB - Enhanced Review System Integration */}
        {activeTab === 'community' && (
          <div>
            {/* Product Insights Display */}
            <ProductInsightsDisplay
              productName={productName}
              brandName={brandStr}
              barcode={barcode || undefined}
            />

            {/* Post-Scan Review Prompt */}
            {showReviewPrompt && (
              <div style={{ marginTop: '24px' }}>
                <PostScanReviewPrompt
                  productName={productName}
                  brandName={brandStr}
                  barcode={barcode || undefined}
                  onReviewSubmitted={() => {
                    setReviewSubmitted(true);
                    setShowReviewPrompt(false);
                  }}
                />
              </div>
            )}

            {/* Success message after review submission */}
            {reviewSubmitted && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#10b981', fontSize: '1.25rem', marginBottom: '8px' }}>
                  ✅ Review Submitted!
                </div>
                <div style={{ color: 'var(--text)', fontSize: '14px' }}>
                  Thanks for sharing your experience! Your review helps others make better decisions and will improve our community insights.
                </div>
              </div>
            )}

            {/* Community Features Coming Soon */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚀</div>
              <h3 style={{
                color: '#3b82f6',
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Community Features Coming Soon
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                We're building advanced community features including follow-up effectiveness tracking, 
                ingredient-based reviews, and symptom outcome analysis. Stay tuned!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'price' && <PriceWidget />}
      </div>
    </div>
  );
}