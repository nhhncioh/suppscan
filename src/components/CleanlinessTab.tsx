// src/components/CleanlinessTab.tsx - Properly Sized Version
import React, { useState } from 'react';
import { CleanlinessScore, IngredientAnalysis } from '@/lib/ingredientCleanliness';
import { AlertTriangle, CheckCircle, Info, Star, ChevronDown, ChevronUp, Heart, Shield, Eye } from 'lucide-react';

interface CleanlinessTabProps {
  cleanlinessScore?: CleanlinessScore;
  ingredientAnalysis?: IngredientAnalysis[];
  loading?: boolean;
}

const CleanlinessTab: React.FC<CleanlinessTabProps> = ({ 
  cleanlinessScore, 
  ingredientAnalysis, 
  loading 
}) => {
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'ingredients' | 'recommendations'>('overview');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid #374151',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }}></div>
        <p>Analyzing ingredient quality...</p>
      </div>
    );
  }

  if (!cleanlinessScore || !ingredientAnalysis) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <div style={{
          background: 'rgba(75, 85, 99, 0.1)',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '20px',
          color: '#9ca3af'
        }}>
          <p style={{ marginBottom: '8px', fontSize: '15px' }}>No ingredient analysis available</p>
          <p style={{ fontSize: '13px', opacity: 0.7 }}>
            Try scanning the ingredient panel more clearly for detailed analysis.
          </p>
        </div>
      </div>
    );
  }

  // Helper functions
  const getScoreEmoji = (score: number) => {
    if (score >= 8) return '🌟';
    if (score >= 7) return '✅';
    if (score >= 5) return '⚠️';
    return '❌';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10b981'; // green
    if (score >= 7) return '#3b82f6'; // blue
    if (score >= 5) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getScoreDescription = (score: number) => {
    if (score >= 8) return "Excellent quality with premium ingredients";
    if (score >= 7) return "Good quality with mostly clean ingredients";
    if (score >= 5) return "Fair quality with some areas for improvement";
    return "Below average quality with concerning ingredients";
  };

  const getCategoryDisplayName = (category: string) => {
    const nameMap: Record<string, string> = {
      'active_ingredient': 'Active Ingredient',
      'beneficial_excipient': 'Beneficial Excipient',
      'neutral_excipient': 'Neutral Excipient',
      'questionable_filler': 'Questionable Filler',
      'artificial_additive': 'Artificial Additive',
      'allergen': 'Potential Allergen',
      'preservative': 'Preservative'
    };
    return nameMap[category] || category;
  };

  // Calculate stats
  const beneficialIngredients = ingredientAnalysis.filter(ing => ing.cleanlinessImpact > 0);
  const neutralIngredients = ingredientAnalysis.filter(ing => ing.cleanlinessImpact === 0);
  const concerningIngredients = ingredientAnalysis.filter(ing => ing.cleanlinessImpact < 0);

  return (
    <div style={{ padding: '12px', color: '#ffffff' }}>
      {/* Much Smaller Score Header */}
      <div style={{
        background: 'rgba(55, 65, 81, 0.3)',
        border: `2px solid ${getScoreColor(cleanlinessScore.overall)}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{getScoreEmoji(cleanlinessScore.overall)}</span>
            <div>
              <h1 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                margin: '0 0 3px 0',
                color: getScoreColor(cleanlinessScore.overall)
              }}>
                Quality Score
              </h1>
              <p style={{ 
                fontSize: '12px', 
                margin: '0 0 2px 0', 
                color: '#d1d5db'
              }}>
                {getScoreDescription(cleanlinessScore.overall)}
              </p>
              <p style={{ 
                fontSize: '10px', 
                margin: '0', 
                color: '#9ca3af' 
              }}>
                Analysis of {ingredientAnalysis.length} ingredient{ingredientAnalysis.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: getScoreColor(cleanlinessScore.overall)
            }}>
              {cleanlinessScore.overall}
            </div>
            <div style={{ fontSize: '9px', color: '#9ca3af' }}>out of 10</div>
          </div>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div style={{
        background: 'rgba(55, 65, 81, 0.2)',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Beneficial */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            flex: 1
          }}>
            <Heart style={{ color: '#10b981', width: '14px', height: '14px', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '12px' }}>Beneficial</span>
                <span style={{ 
                  color: '#ffffff', 
                  fontWeight: 'bold', 
                  fontSize: '16px'
                }}>
                  {beneficialIngredients.length}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2' }}>
                Positive ingredients
              </div>
            </div>
          </div>

          {/* Clean */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            flex: 1
          }}>
            <Shield style={{ color: '#6b7280', width: '14px', height: '14px', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#6b7280', fontWeight: '600', fontSize: '12px' }}>Clean</span>
                <span style={{ 
                  color: '#ffffff', 
                  fontWeight: 'bold', 
                  fontSize: '16px'
                }}>
                  {neutralIngredients.length}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2' }}>
                Safe ingredients
              </div>
            </div>
          </div>

          {/* Watch */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            flex: 1
          }}>
            <Eye style={{ color: '#f59e0b', width: '14px', height: '14px', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '12px' }}>Watch</span>
                <span style={{ 
                  color: '#ffffff', 
                  fontWeight: 'bold', 
                  fontSize: '16px'
                }}>
                  {concerningIngredients.length}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2' }}>
                Need attention
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Properly sized */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        borderBottom: '1px solid #374151',
        paddingBottom: '8px'
      }}>
        {['overview', 'ingredients', 'recommendations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveView(tab as any)}
            style={{
              padding: '9px 15px',
              background: activeView === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeView === tab ? '#3b82f6' : '#9ca3af',
              border: activeView === tab ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab === 'ingredients' ? 'Details' : tab === 'recommendations' ? 'Tips' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeView === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* What This Means */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              margin: '0 0 8px 0', 
              color: '#93c5fd' 
            }}>
              What This Means
            </h3>
            <p style={{ 
              margin: '0', 
              lineHeight: '1.5', 
              color: '#d1d5db',
              fontSize: '13px'
            }}>
              {cleanlinessScore.overall >= 7.5 
                ? "This product contains high-quality ingredients with beneficial components. The formulation demonstrates good attention to ingredient selection and quality."
                : cleanlinessScore.overall >= 6
                ? "This product contains mostly acceptable ingredients with some beneficial components. There may be a few ingredients to be aware of, but overall it's a reasonable formulation."
                : "This product has some ingredient quality concerns that may affect its effectiveness or safety. Consider the specific issues noted below."
              }
            </p>
          </div>

          {/* Beneficial Ingredients */}
          {beneficialIngredients.length > 0 && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <h4 style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                margin: '0 0 10px 0', 
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}>
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Beneficial Ingredients Found
              </h4>
              
              {beneficialIngredients.map((ingredient, index) => (
                <div key={index} style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: index < beneficialIngredients.length - 1 ? '8px' : '0'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#6ee7b7',
                    marginBottom: '4px'
                  }}>
                    {ingredient.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#d1d5db',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {ingredient.reasoning}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#9ca3af'
                  }}>
                    Impact: +{ingredient.cleanlinessImpact} • {getCategoryDisplayName(ingredient.category)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Concerning Ingredients */}
          {concerningIngredients.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '14px'
            }}>
              <h4 style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                margin: '0 0 10px 0', 
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '7px'
              }}>
                <AlertTriangle style={{ width: '16px', height: '16px' }} />
                Ingredients to Watch
              </h4>
              
              {concerningIngredients.map((ingredient, index) => (
                <div key={index} style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: index < concerningIngredients.length - 1 ? '8px' : '0'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#fbbf24',
                    marginBottom: '4px'
                  }}>
                    {ingredient.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#d1d5db',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {ingredient.reasoning}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#9ca3af'
                  }}>
                    Impact: {ingredient.cleanlinessImpact} • {getCategoryDisplayName(ingredient.category)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'ingredients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ingredientAnalysis
            .sort((a, b) => b.cleanlinessImpact - a.cleanlinessImpact)
            .map((ingredient, index) => {
              const isExpanded = expandedIngredient === ingredient.name;
              const impactColor = ingredient.cleanlinessImpact > 0 ? '#10b981' : 
                                ingredient.cleanlinessImpact < 0 ? '#f59e0b' : '#6b7280';
              
              return (
                <div
                  key={index}
                  style={{
                    background: 'rgba(55, 65, 81, 0.2)',
                    border: '1px solid #374151',
                    borderRadius: '7px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                        <h4 style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          margin: '0', 
                          color: '#f9fafb' 
                        }}>
                          {ingredient.name}
                        </h4>
                        <span style={{ 
                          fontSize: '11px', 
                          color: impactColor,
                          fontWeight: '600'
                        }}>
                          {ingredient.cleanlinessImpact > 0 ? '+' : ''}{ingredient.cleanlinessImpact}
                        </span>
                      </div>
                      <p style={{ 
                        fontSize: '12px', 
                        margin: '0 0 6px 0', 
                        color: '#d1d5db',
                        lineHeight: '1.4'
                      }}>
                        {ingredient.reasoning}
                      </p>
                      <button
                        onClick={() => setExpandedIngredient(isExpanded ? null : ingredient.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '0'
                        }}
                      >
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        {isExpanded ? 'Less details' : 'More details'}
                      </button>
                      {isExpanded && (
                        <div style={{ 
                          marginTop: '6px', 
                          fontSize: '11px', 
                          color: '#9ca3af',
                          paddingTop: '6px',
                          borderTop: '1px solid #374151'
                        }}>
                          <div>Category: {getCategoryDisplayName(ingredient.category)}</div>
                          <div style={{ marginTop: '2px' }}>
                            Impact: {ingredient.cleanlinessImpact > 0 ? 'Positive' : ingredient.cleanlinessImpact < 0 ? 'Negative' : 'Neutral'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeView === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Usage Tips */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              margin: '0 0 10px 0', 
              color: '#6ee7b7' 
            }}>
              💡 Usage Tips
            </h3>
            <ul style={{ 
              margin: '0', 
              paddingLeft: '16px', 
              color: '#d1d5db',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              {concerningIngredients.length > 0 && (
                <li style={{ marginBottom: '4px' }}>
                  Take on an empty stomach for better absorption due to potential absorption-limiting ingredients
                </li>
              )}
              <li style={{ marginBottom: '4px' }}>Follow the recommended dosage on the label</li>
              {beneficialIngredients.length > 0 && (
                <li style={{ marginBottom: '4px' }}>
                  Take consistently for best results due to beneficial ingredients present
                </li>
              )}
            </ul>
          </div>

          {/* Bottom Line */}
          <div style={{
            background: 'rgba(55, 65, 81, 0.2)',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '14px'
          }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: '600', 
              margin: '0 0 8px 0', 
              color: '#f9fafb' 
            }}>
              Bottom Line
            </h3>
            <p style={{ 
              margin: '0', 
              lineHeight: '1.5', 
              color: '#d1d5db',
              fontSize: '13px'
            }}>
              {cleanlinessScore.overall >= 7.5 
                ? "This is a high-quality product with excellent ingredient selection. You can feel confident about its formulation and safety profile."
                : cleanlinessScore.overall >= 6
                ? "This is a solid choice with good ingredient quality. While it may not be perfect, it should provide the intended benefits when used properly."
                : "This product has some quality concerns that you should consider. You may want to look for alternatives with better ingredient profiles."
              }
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CleanlinessTab;