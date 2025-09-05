// src/components/ResultCard.tsx - COMPLETE Enhanced Version with Cleanliness Tab
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
import CleanlinessTab from './CleanlinessTab'; // NEW: Import cleanliness tab

const ReviewsTab = dynamic(() => import('./ReviewsTab'), {
  loading: () => <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading reviews...</div>
});

const PriceWidget = dynamic(() => import('./PriceWidget'), {
  loading: () => <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>Loading calculator...</div>
});

type ConfidenceT = { level: string; score: number; reasons?: string[] } | null;
type Props = { 
  explanation: any; 
  extracted?: any; 
  barcode?: string | null; 
  confidence?: ConfidenceT; 
  enhancedMode?: boolean;
  userProfile?: any;
};

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
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Create Profile
        </a>
      </div>
    );
  }

  const { 
    matchScore, 
    recommendations, 
    warnings, 
    lifestyleCompatibility 
  } = personalizedAnalysis;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
      border: '1px solid rgba(34, 197, 94, 0.3)',
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
        <Target size={20} color="#22c55e" />
        <div>
          <h4 style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Personalized for You
          </h4>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>
            Based on your health profile and goals
          </p>
        </div>
        <div style={{
          marginLeft: 'auto',
          background: matchScore >= 8 ? 'rgba(34, 197, 94, 0.2)' : 
                     matchScore >= 6 ? 'rgba(59, 130, 246, 0.2)' : 
                     'rgba(245, 158, 11, 0.2)',
          color: matchScore >= 8 ? '#22c55e' : 
                 matchScore >= 6 ? '#3b82f6' : 
                 '#f59e0b',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {matchScore}/10 Match
        </div>
      </div>

      {recommendations.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            color: '#22c55e', 
            fontSize: '14px', 
            fontWeight: '600', 
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle size={16} />
            Recommendations for You
          </div>
          {recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: i < recommendations.length - 1 ? '4px' : '0',
              lineHeight: '1.4'
            }}>
              • {rec}
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            color: '#f59e0b', 
            fontSize: '14px', 
            fontWeight: '600', 
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={16} />
            Consider These Points
          </div>
          {warnings.slice(0, 2).map((warning, i) => (
            <div key={i} style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: i < warnings.length - 1 ? '4px' : '0',
              lineHeight: '1.4'
            }}>
              • {warning}
            </div>
          ))}
        </div>
      )}

      {/* Lifestyle Compatibility Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginTop: '12px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '8px',
          background: lifestyleCompatibility.dietaryCompatibility ? 
            'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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

export default function ResultCard({ explanation, extracted, barcode, confidence, enhancedMode = false, userProfile }: Props) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'reviews' | 'price' | 'community' | 'cleanliness'>('analysis');
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

  // Analyze supplement for user symptoms
  useEffect(() => {
    if (!explanation && !extracted) return;
    
    try {
      const supplementProfile = {
        name: (explanation?.product ?? extracted?.productGuess ?? "") as string,
        ingredients: [
          ...(explanation?.ingredients || []).map((ing: any) => ing.name || ''),
          ...(extracted?.ingredients || []).map((ing: any) => ing.name || '')
        ],
        keyIngredient: explanation?.label?.key_ingredient ?? 
                      explanation?.ingredients?.[0]?.name ?? 
                      extracted?.ingredients?.[0]?.name ?? null
      };
      
      const analysis = SymptomMatcher.analyzeSupplementForUser(supplementProfile);
      setSymptomMatches(analysis.matches || []);
      setPersonalizedMessage(analysis.personalizedMessage || '');
      setInteractionWarnings(analysis.interactions || []);
      setOverallScore(analysis.overallScore || 0);
    } catch (error) {
      console.error('Error analyzing supplement for symptoms:', error);
      setSymptomMatches([]);
      setPersonalizedMessage('');
      setInteractionWarnings([]);
      setOverallScore(0);
    }
  }, [explanation, extracted]);

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
    ""
  ) as string;

  const gl = explanation?.label_vs_guidelines 
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
    tab: 'analysis' | 'reviews' | 'price' | 'community' | 'cleanliness'; 
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

  // Check if cleanliness data is available
  const hasCleanlinessData = extracted?.cleanlinessScore || extracted?.ingredientAnalysis;

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
                background: confidence.level === "High" ? '#0c1a10' : 
                           confidence.level === "Medium" ? '#1a0f0c' : '#1a1a0c',
                borderColor: confidence.level === "High" ? '#2e7d32' : 
                            confidence.level === "Medium" ? '#d32f2f' : '#f57c00',
                color: confidence.level === "High" ? '#4caf50' : 
                       confidence.level === "Medium" ? '#f44336' : '#ff9800'
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
                borderColor: overallScore >= 6 ? '#2e7d32' : overallScore >= 3 ? '#d32f2f' : '#f57c00',
                color: overallScore >= 6 ? '#4caf50' : overallScore >= 3 ? '#f44336' : '#ff9800'
              }}
            >
              {overallScore}/10 symptom match
            </span>
          )}

          {/* NEW: Cleanliness Score Chip */}
          {extracted?.cleanlinessScore && (
            <span 
              className="chip"
              title={`Ingredient cleanliness: ${extracted.cleanlinessScore.category}`}
              style={{
                background: extracted.cleanlinessScore.category === 'excellent' ? '#0c1a10' : 
                           extracted.cleanlinessScore.category === 'good' ? '#0f1419' : 
                           extracted.cleanlinessScore.category === 'fair' ? '#1a0f0c' : '#1a1a0c',
                borderColor: extracted.cleanlinessScore.category === 'excellent' ? '#2e7d32' : 
                            extracted.cleanlinessScore.category === 'good' ? '#1976d2' : 
                            extracted.cleanlinessScore.category === 'fair' ? '#f57c00' : '#d32f2f',
                color: extracted.cleanlinessScore.category === 'excellent' ? '#4caf50' : 
                       extracted.cleanlinessScore.category === 'good' ? '#2196f3' : 
                       extracted.cleanlinessScore.category === 'fair' ? '#ff9800' : '#f44336'
              }}
            >
              {extracted.cleanlinessScore.overall}/10 clean
            </span>
          )}
        </div>
      </div>

      {/* Personalized Message Display */}
      {personalizedMessage && (
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          margin: '16px 20px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#e5e7eb'
        }}>
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '4px',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Info size={16} />
            Personalized Insight
          </div>
          {personalizedMessage}
        </div>
      )}

      {/* Interaction Warnings */}
      {interactionWarnings.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          margin: '16px 20px',
          fontSize: '14px'
        }}>
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={16} />
            {interactionWarnings.length > 1 ? 'Important' : 'Supplement'} Interactions
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

      {/* Tab Navigation - ENHANCED WITH CLEANLINESS TAB */}
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
        {hasCleanlinessData && (
          <TabButton tab="cleanliness">🌿 Cleanliness</TabButton>
        )}
        <TabButton tab="community">👥 Community</TabButton>
        <TabButton tab="price">💰 Pricing</TabButton>
      </div>

      {/* Tab Content */}
      <div style={{padding: '20px'}}>
        {activeTab === 'analysis' && (
          <div>
            {/* PERSONALIZED ANALYSIS SECTION - TEMPORARILY DISABLED FOR DEBUGGING */}
            {/* <PersonalizedSection 
              supplementData={{
                name: productName,
                brand: brandStr,
                ingredients: (explanation?.ingredients || extracted?.ingredients || []).map((ing: any) => ing.name || ''),
                keyIngredient: retailFirstIngredient,
                form: extracted?.form,
                price: extracted?.price
              }}
            /> */}

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
                    <div key={match.supplement} style={{
                      padding: '12px',
                      background: 'rgba(74, 222, 128, 0.1)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#4ade80',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>
                        {match.displayName}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginBottom: '8px'
                      }}>
                        Match Score: {match.score}/10 • {match.effectivenessLevel} effectiveness
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: '1.4'
                      }}>
                        {match.mechanism}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overview Section */}
            {explanation?.overview && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📋 Overview
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  lineHeight: '1.6',
                  fontSize: '14px'
                }}>
                  {explanation.overview}
                </div>
              </div>
            )}

            {/* Label vs Guidelines */}
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

            {/* Uses Section */}
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
                        color: '#f4f5f7',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {use.claim}
                      </div>
                      {use.evidence_level && use.evidence_level !== "unknown" && (
                        <div style={{
                          color: '#a2a6ad',
                          fontSize: '12px',
                          textTransform: 'capitalize'
                        }}>
                          Evidence Level: {use.evidence_level}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Take */}
            {explanation?.how_to_take?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⏰ How to Take
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {explanation.how_to_take.map((h: any, i: number) => (
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
                        {h.ingredient}
                      </div>
                      <div style={{
                        color: '#a2a6ad',
                        fontSize: '14px'
                      }}>
                        {h.timing || ""} {h.with_food ? `(${h.with_food})` : ""} {h.notes ? `— ${h.notes}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Take If Section */}
            {explanation?.take_if?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🩺 Take If
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {explanation.take_if.map((t: any, i: number) => (
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
                        {t.scenario}
                      </div>
                      <div style={{
                        color: '#a2a6ad',
                        fontSize: '14px'
                      }}>
                        {t.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* May Improve Section */}
            {explanation?.may_improve?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ✨ May Help Improve
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {explanation.may_improve.map((m: any, i: number) => (
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
                        {m.area}
                      </div>
                      <div style={{
                        color: '#a2a6ad',
                        fontSize: '14px'
                      }}>
                        {m.evidence_level && m.evidence_level !== "unknown" && (
                          <span style={{ textTransform: 'capitalize' }}>
                            {m.evidence_level} evidence
                          </span>
                        )}
                        {m.typical_timeframe && (
                          <span>
                            {m.evidence_level && m.evidence_level !== "unknown" ? ' • ' : ''}
                            {m.typical_timeframe}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Badges */}
            {badges.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🏷️ Quality Badges
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px' 
                }}>
                  {badges.map((badge, i) => (
                    <span key={i} style={{
                      background: 'rgba(74, 222, 128, 0.1)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      color: '#4ade80',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trusted Certification Marks */}
            {marks.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🛡️ Trusted Certifications
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px' 
                }}>
                  {marks.map((mark, i) => {
                    const link = getTrustedMarkLink(mark);
                    const markElement = (
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: link ? 'pointer' : 'default'
                      }}>
                        {mark} {link && '↗'}
                      </span>
                    );
                    
                    return link ? (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                        {markElement}
                      </a>
                    ) : (
                      <span key={i}>
                        {markElement}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Notes */}
            {formNotes.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💊 Form Notes
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  {formNotes.map((note, i) => (
                    <div key={i} style={{
                      padding: '10px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '6px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px'
                    }}>
                      • {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings and Upper Limits */}
            {explanation?.upper_limits_and_warnings?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Warnings & Upper Limits
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {explanation.upper_limits_and_warnings.map((warning: any, i: number) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px'
                    }}>
                      • {typeof warning === 'string' ? warning : warning.note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactions and Contraindications */}
            {explanation?.interactions_and_contraindications?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🚫 Interactions & Contraindications
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {explanation.interactions_and_contraindications.map((interaction: any, i: number) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        color: '#f87171',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {interaction.item}
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '14px'
                      }}>
                        {interaction.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Considerations */}
            {explanation?.quality_considerations?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔍 Quality Considerations
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  {explanation.quality_considerations.map((consideration: any, i: number) => (
                    <div key={i} style={{
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid #23252c',
                      borderRadius: '6px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px'
                    }}>
                      • {typeof consideration === 'string' ? consideration : consideration.note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Links */}
            {(improvedProductUrl || manufacturerUrl) && (
              <div style={{marginBottom:20}}>
                <div style={{
                  fontWeight: '600', 
                  color: '#f4f5f7', 
                  marginBottom: '12px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🛒 Where to Buy
                </div>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {improvedProductUrl && (
                    <a 
                      href={improvedProductUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 16px',
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
                      View Product ↗
                    </a>
                  )}
                  {manufacturerUrl && manufacturerUrl !== improvedProductUrl && (
                    <a 
                      href={manufacturerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Manufacturer ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {explanation?.disclaimer && (
              <div style={{
                fontSize: '12px', 
                color: 'var(--muted)', 
                marginTop: '24px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid #23252c',
                borderRadius: '8px',
                lineHeight: '1.4'
              }}>
                <strong>Disclaimer:</strong> {explanation.disclaimer}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <ReviewsTab
            productName={productName}
            brandName={brandStr}
            scannedIngredients={extracted?.ingredients}
            productCategory={explanation?.category || 'supplement'}
            onReviewCountChange={setReviewCount}
          />
        )}

        {/* NEW: Cleanliness Tab */}
        {activeTab === 'cleanliness' && (
          <CleanlinessTab
            cleanlinessScore={extracted?.cleanlinessScore}
            ingredientAnalysis={extracted?.ingredientAnalysis}
            loading={false}
          />
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div>
            {/* Product Insights Display - Safe */}
            {ProductInsightsDisplay && (
              <ProductInsightsDisplay
                productName={productName}
                brandName={brandStr}
                barcode={barcode || undefined}
              />
            )}

            {/* Post-Scan Review Prompt - Safe */}
            {showReviewPrompt && !reviewSubmitted && PostScanReviewPrompt && (
              <div style={{ marginTop: '24px' }}>
                <PostScanReviewPrompt
                  productName={productName}
                  brandName={brandStr}
                  barcode={barcode || undefined}
                  onReviewSubmitted={() => {
                    setReviewSubmitted(true);
                    setShowReviewPrompt(false);
                  }}
                  onDismiss={() => setShowReviewPrompt(false)}
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

        {/* Price Tab */}
        {activeTab === 'price' && (
          <div>
            <PriceWidget 
              productName={productName}
              brandName={brandStr}
              firstIngredient={retailFirstIngredient}
              amount={retailAmount}
              unit={retailUnit}
              productUrl={improvedProductUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}