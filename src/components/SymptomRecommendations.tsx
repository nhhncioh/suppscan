import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, Info, AlertCircle, Check, X, Scan, Heart, Brain, Shield, Battery, Moon, Eye, Bone } from 'lucide-react';

// Symptom categories with their associated supplements
const SYMPTOM_DATA = {
  'energy': {
    icon: Battery,
    label: 'Low Energy & Fatigue',
    color: '#fbbf24',
    symptoms: ['Constant tiredness', 'Afternoon crashes', 'Morning fatigue', 'Exercise exhaustion'],
    recommendations: [
      {
        name: 'Vitamin B12',
        dosage: '1000-2500 mcg',
        timing: 'Morning with breakfast',
        evidence: 'strong',
        notes: 'Essential for energy metabolism',
        contraindications: ['None significant'],
        form: 'Methylcobalamin preferred',
        priorityLevel: 'Essential' // Changed from numerical score
      },
      {
        name: 'Iron',
        dosage: '18-27 mg',
        timing: 'Empty stomach or with vitamin C',
        evidence: 'strong',
        notes: 'Only if deficient - test first',
        contraindications: ['Hemochromatosis', 'Iron overload'],
        form: 'Ferrous bisglycinate for better absorption',
        priorityLevel: 'Highly Recommended' // Changed from numerical score
      },
      {
        name: 'Magnesium',
        dosage: '200-400 mg',
        timing: 'Evening with food',
        evidence: 'moderate',
        notes: 'Supports cellular energy production',
        contraindications: ['Kidney disease'],
        form: 'Glycinate or citrate',
        priorityLevel: 'Beneficial' // Changed from numerical score
      },
      {
        name: 'CoQ10',
        dosage: '100-200 mg',
        timing: 'With fatty meal',
        evidence: 'moderate',
        notes: 'Especially if on statins',
        contraindications: ['Blood thinners - monitor'],
        form: 'Ubiquinol for better absorption',
        priorityLevel: 'Worth Considering' // Changed from numerical score
      }
    ]
  },
  'immune': {
    icon: Shield,
    label: 'Immune Support',
    color: '#10b981',
    symptoms: ['Frequent colds', 'Slow healing', 'Recurring infections'],
    recommendations: [
      {
        name: 'Vitamin D3',
        dosage: '1000-4000 IU',
        timing: 'Morning with fat',
        evidence: 'strong',
        notes: 'Test levels first if possible',
        contraindications: ['Hypercalcemia'],
        form: 'D3 (cholecalciferol)',
        priorityLevel: 'Essential'
      },
      {
        name: 'Vitamin C',
        dosage: '500-1000 mg',
        timing: 'Divided doses with meals',
        evidence: 'moderate',
        notes: 'May reduce cold duration',
        contraindications: ['Kidney stones history'],
        form: 'Buffered or liposomal',
        priorityLevel: 'Highly Recommended'
      },
      {
        name: 'Zinc',
        dosage: '8-11 mg',
        timing: 'With food to prevent nausea',
        evidence: 'strong',
        notes: 'Don\'t exceed 40mg/day',
        contraindications: ['Copper deficiency'],
        form: 'Picolinate or citrate',
        priorityLevel: 'Beneficial'
      },
      {
        name: 'Probiotics',
        dosage: '10-50 billion CFU',
        timing: 'Empty stomach or bedtime',
        evidence: 'moderate',
        notes: 'Refrigerated varieties often better',
        contraindications: ['Immunocompromised individuals'],
        form: 'Multi-strain with Lactobacillus & Bifidobacterium',
        priorityLevel: 'Worth Considering'
      }
    ]
  },
  'sleep': {
    icon: Moon,
    label: 'Sleep & Relaxation',
    color: '#8b5cf6',
    symptoms: ['Trouble falling asleep', 'Frequent waking', 'Unrefreshing sleep', 'Racing thoughts at night'],
    recommendations: [
      {
        name: 'Magnesium Glycinate',
        dosage: '200-400 mg',
        timing: '30-60 min before bed',
        evidence: 'strong',
        notes: 'Promotes muscle relaxation',
        contraindications: ['Kidney disease'],
        form: 'Glycinate for sleep',
        priorityLevel: 'Essential'
      },
      {
        name: 'Melatonin',
        dosage: '0.5-3 mg',
        timing: '30 min before bed',
        evidence: 'strong',
        notes: 'Start with lowest dose',
        contraindications: ['Autoimmune conditions', 'Depression'],
        form: 'Immediate or extended release',
        priorityLevel: 'Highly Recommended'
      },
      {
        name: 'L-Theanine',
        dosage: '100-200 mg',
        timing: '1 hour before bed',
        evidence: 'moderate',
        notes: 'Promotes calm without drowsiness',
        contraindications: ['Low blood pressure'],
        form: 'Pure L-theanine',
        priorityLevel: 'Beneficial'
      },
      {
        name: 'Ashwagandha',
        dosage: '300-600 mg',
        timing: 'Evening with food',
        evidence: 'moderate',
        notes: 'Adaptogen for stress',
        contraindications: ['Pregnancy', 'Thyroid conditions'],
        form: 'KSM-66 or Sensoril',
        priorityLevel: 'Worth Considering'
      }
    ]
  },
  'cognitive': {
    icon: Brain,
    label: 'Brain & Focus',
    color: '#3b82f6',
    symptoms: ['Brain fog', 'Poor concentration', 'Memory issues', 'Mental fatigue'],
    recommendations: [
      {
        name: 'Omega-3 (EPA/DHA)',
        dosage: '1000-2000 mg',
        timing: 'With meals',
        evidence: 'strong',
        notes: 'Critical for brain health',
        contraindications: ['Blood thinners', 'Surgery'],
        form: 'Triglyceride form, third-party tested',
        priorityLevel: 'Essential'
      },
      {
        name: 'B Complex',
        dosage: 'Standard B-complex',
        timing: 'Morning with breakfast',
        evidence: 'strong',
        notes: 'Supports neurotransmitters',
        contraindications: ['None significant'],
        form: 'Methylated forms preferred',
        priorityLevel: 'Highly Recommended'
      },
      {
        name: 'Lion\'s Mane',
        dosage: '500-1000 mg',
        timing: 'Morning or afternoon',
        evidence: 'emerging',
        notes: 'May support nerve growth',
        contraindications: ['Mushroom allergies'],
        form: 'Fruiting body extract',
        priorityLevel: 'Beneficial'
      },
      {
        name: 'Phosphatidylserine',
        dosage: '100-300 mg',
        timing: 'With meals',
        evidence: 'moderate',
        notes: 'Supports memory function',
        contraindications: ['None significant'],
        form: 'Soy-free if sensitive',
        priorityLevel: 'Worth Considering'
      }
    ]
  },
  'joint': {
    icon: Bone,
    label: 'Joint & Bone Health',
    color: '#f59e0b',
    symptoms: ['Joint stiffness', 'Morning aches', 'Exercise pain', 'Creaking joints'],
    recommendations: [
      {
        name: 'Glucosamine/Chondroitin',
        dosage: '1500mg/1200mg',
        timing: 'With meals',
        evidence: 'mixed',
        notes: 'May help mild-moderate arthritis',
        contraindications: ['Shellfish allergy', 'Blood thinners'],
        form: 'Sulfate forms',
        priorityLevel: 'Beneficial'
      },
      {
        name: 'Vitamin D3',
        dosage: '1000-2000 IU',
        timing: 'Morning with fat',
        evidence: 'strong',
        notes: 'Essential for bone health',
        contraindications: ['Hypercalcemia'],
        form: 'D3 with K2',
        priorityLevel: 'Essential'
      },
      {
        name: 'Calcium',
        dosage: '500-600 mg',
        timing: 'Split doses with meals',
        evidence: 'strong',
        notes: 'Preferably from food first',
        contraindications: ['Kidney stones', 'Heart disease'],
        form: 'Citrate for better absorption',
        priorityLevel: 'Highly Recommended'
      },
      {
        name: 'Turmeric/Curcumin',
        dosage: '500-1000 mg',
        timing: 'With black pepper and fat',
        evidence: 'moderate',
        notes: 'Anti-inflammatory properties',
        contraindications: ['Gallbladder disease', 'Blood thinners'],
        form: 'With piperine or liposomal',
        priorityLevel: 'Worth Considering'
      }
    ]
  },
  'mood': {
    icon: Heart,
    label: 'Mood & Stress',
    color: '#ef4444',
    symptoms: ['Low mood', 'Anxiety', 'Irritability', 'Stress overwhelm'],
    recommendations: [
      {
        name: 'Vitamin D3',
        dosage: '2000-4000 IU',
        timing: 'Morning with fat',
        evidence: 'strong',
        notes: 'Linked to mood regulation',
        contraindications: ['Hypercalcemia'],
        form: 'D3 (cholecalciferol)',
        priorityLevel: 'Essential'
      },
      {
        name: 'Omega-3',
        dosage: '1000-2000 mg EPA',
        timing: 'With meals',
        evidence: 'strong',
        notes: 'EPA particularly for mood',
        contraindications: ['Blood thinners'],
        form: 'High EPA ratio',
        priorityLevel: 'Highly Recommended'
      },
      {
        name: 'Magnesium',
        dosage: '200-400 mg',
        timing: 'Evening',
        evidence: 'moderate',
        notes: 'Calming mineral',
        contraindications: ['Kidney disease'],
        form: 'Glycinate or taurate',
        priorityLevel: 'Beneficial'
      },
      {
        name: 'SAM-e',
        dosage: '400-800 mg',
        timing: 'Empty stomach, morning',
        evidence: 'moderate',
        notes: 'May improve mood',
        contraindications: ['Bipolar disorder', 'SSRIs'],
        form: 'Enteric coated',
        priorityLevel: 'Worth Considering'
      }
    ]
  }
};

// Priority level styling
const getPriorityStyle = (level) => {
  switch (level) {
    case 'Essential':
      return {
        backgroundColor: '#dc2626',
        color: 'white',
        label: 'Essential',
        icon: '🔴'
      };
    case 'Highly Recommended':
      return {
        backgroundColor: '#ea580c',
        color: 'white', 
        label: 'Highly Recommended',
        icon: '🟠'
      };
    case 'Beneficial':
      return {
        backgroundColor: '#16a34a',
        color: 'white',
        label: 'Beneficial',
        icon: '🟢'
      };
    case 'Worth Considering':
      return {
        backgroundColor: '#0ea5e9',
        color: 'white',
        label: 'Worth Considering',
        icon: '🔵'
      };
    default:
      return {
        backgroundColor: '#6b7280',
        color: 'white',
        label: 'Unknown',
        icon: '⚪'
      };
  }
};

export default function SymptomBasedRecommendations() {
  const [activeTab, setActiveTab] = useState('scan');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSupplements, setSelectedSupplements] = useState(new Set());
  const [showDetails, setShowDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState({
    age: '19-70',
    conditions: [],
    medications: []
  });

  // Filter symptoms based on search
  const filteredCategories = Object.entries(SYMPTOM_DATA).filter(([key, data]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      data.label.toLowerCase().includes(query) ||
      data.symptoms.some(s => s.toLowerCase().includes(query))
    );
  });

  const handleSupplementToggle = (supplement) => {
    const newSelected = new Set(selectedSupplements);
    const key = `${selectedCategory}-${supplement.name}`;
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedSupplements(newSelected);
  };

  const getEvidenceColor = (level) => {
    switch(level) {
      case 'strong': return '#10b981';
      case 'moderate': return '#3b82f6';
      case 'mixed': return '#f59e0b';
      case 'emerging': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getSelectedSummary = () => {
    const summary = [];
    selectedSupplements.forEach(item => {
      const [category, name] = item.split('-');
      const categoryData = SYMPTOM_DATA[category];
      const supplement = categoryData?.recommendations.find(s => s.name === name);
      if (supplement) {
        summary.push({
          ...supplement,
          category: categoryData.label
        });
      }
    });
    return summary;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0c0f 0%, #1a1b1f 100%)',
      color: '#f4f5f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #23252c',
        background: '#121319'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          margin: '0 0 8px 0',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #4ade80 0%, #60a5fa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          SuppScan
        </h1>
        <p style={{
          margin: 0,
          textAlign: 'center',
          color: '#a2a6ad',
          fontSize: '14px'
        }}>
          Evidence-based supplement guidance
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: '#0e0f14',
        borderBottom: '1px solid #23252c',
        padding: '0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => setActiveTab('scan')}
          style={{
            flex: 1,
            padding: '16px',
            background: activeTab === 'scan' ? '#1a1b1f' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'scan' ? '2px solid #4ade80' : '2px solid transparent',
            color: activeTab === 'scan' ? '#4ade80' : '#a2a6ad',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Scan size={18} />
          Scan Supplement
        </button>
        <button
          onClick={() => setActiveTab('symptoms')}
          style={{
            flex: 1,
            padding: '16px',
            background: activeTab === 'symptoms' ? '#1a1b1f' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'symptoms' ? '2px solid #60a5fa' : '2px solid transparent',
            color: activeTab === 'symptoms' ? '#60a5fa' : '#a2a6ad',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Heart size={18} />
          By Symptoms
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'scan' ? (
          /* Scan Tab - Your existing scan interface would go here */
          <div style={{
            background: '#121319',
            border: '1px solid #23252c',
            borderRadius: '14px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <Scan size={48} style={{ margin: '0 auto 20px', color: '#4ade80' }} />
            <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Scan Supplement Label</h2>
            <p style={{ color: '#a2a6ad', marginBottom: '24px' }}>
              Take a photo or upload an image of your supplement label
            </p>
            <button style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer'
            }}>
              Upload Image
            </button>
          </div>
        ) : (
          /* Symptoms Tab */
          <div>
            {/* Search Bar */}
            <div style={{
              marginBottom: '24px',
              position: 'relative'
            }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Search symptoms or conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 48px',
                  background: '#0e0f14',
                  border: '1px solid #23252c',
                  borderRadius: '10px',
                  color: '#e2e8f0',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>

            {!selectedCategory ? (
              /* Category Grid */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {filteredCategories.map(([key, data]) => {
                  const IconComponent = data.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      style={{
                        background: '#121319',
                        border: '1px solid #23252c',
                        borderRadius: '14px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = data.color;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#23252c';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${data.color}20, ${data.color}10)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '16px'
                        }}>
                          <IconComponent size={24} style={{ color: data.color }} />
                        </div>
                        <div>
                          <h3 style={{
                            margin: '0 0 4px 0',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#f4f5f7'
                          }}>
                            {data.label}
                          </h3>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#a2a6ad'
                          }}>
                            {data.recommendations.length} recommendations
                          </p>
                        </div>
                        <ChevronRight size={20} style={{
                          color: '#6b7280',
                          marginLeft: 'auto'
                        }} />
                      </div>
                      
                      <div style={{
                        fontSize: '13px',
                        color: '#a2a6ad',
                        lineHeight: '1.4'
                      }}>
                        {data.symptoms.slice(0, 2).join(', ')}
                        {data.symptoms.length > 2 && `, +${data.symptoms.length - 2} more`}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Supplement Recommendations */
              <div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid #23252c',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ← Back to categories
                </button>

                <div style={{
                  background: '#121319',
                  border: '1px solid #23252c',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#f4f5f7'
                  }}>
                    {SYMPTOM_DATA[selectedCategory].label}
                  </h3>
                  
                  <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    background: '#0e0f14',
                    borderRadius: '10px',
                    border: '1px solid #23252c'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: '#a2a6ad',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      Common symptoms:
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {SYMPTOM_DATA[selectedCategory].symptoms.map((symptom, i) => (
                        <span key={i} style={{
                          padding: '4px 10px',
                          background: '#1a1b1f',
                          borderRadius: '16px',
                          fontSize: '13px',
                          color: '#cbd5e1'
                        }}>
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h4 style={{
                    margin: '24px 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#cbd5e1'
                  }}>
                    Recommended Supplements:
                  </h4>

                  {SYMPTOM_DATA[selectedCategory].recommendations.map((supp, index) => {
                    const priorityStyle = getPriorityStyle(supp.priorityLevel);
                    
                    return (
                      <div key={index} style={{
                        marginBottom: '16px',
                        padding: '16px',
                        background: '#0e0f14',
                        border: selectedSupplements.has(`${selectedCategory}-${supp.name}`) 
                          ? '2px solid #4ade80' 
                          : '1px solid #23252c',
                        borderRadius: '10px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '8px'
                            }}>
                              <h5 style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#f4f5f7'
                              }}>
                                {supp.name}
                              </h5>
                              
                              {/* Priority Badge */}
                              <div style={{
                                ...priorityStyle,
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>{priorityStyle.icon}</span>
                                {priorityStyle.label}
                              </div>

                              <div style={{
                                background: getEvidenceColor(supp.evidence),
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {supp.evidence} evidence
                              </div>
                            </div>
                            
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                              gap: '8px',
                              marginBottom: '8px',
                              fontSize: '13px'
                            }}>
                              <div>
                                <strong style={{ color: '#cbd5e1' }}>Dose:</strong>{' '}
                                <span style={{ color: '#a2a6ad' }}>{supp.dosage}</span>
                              </div>
                              <div>
                                <strong style={{ color: '#cbd5e1' }}>When:</strong>{' '}
                                <span style={{ color: '#a2a6ad' }}>{supp.timing}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSupplementToggle(supp)}
                            style={{
                              padding: '8px 12px',
                              background: selectedSupplements.has(`${selectedCategory}-${supp.name}`)
                                ? '#4ade80'
                                : 'transparent',
                              border: selectedSupplements.has(`${selectedCategory}-${supp.name}`)
                                ? 'none'
                                : '1px solid #23252c',
                              borderRadius: '8px',
                              color: selectedSupplements.has(`${selectedCategory}-${supp.name}`)
                                ? '#000'
                                : '#cbd5e1',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {selectedSupplements.has(`${selectedCategory}-${supp.name}`) ? (
                              <>
                                <Check size={14} />
                                Selected
                              </>
                            ) : (
                              <>Add to plan</>
                            )}
                          </button>
                        </div>

                        <div style={{
                          fontSize: '14px',
                          color: '#a2a6ad',
                          marginBottom: '8px'
                        }}>
                          {supp.notes}
                        </div>

                        <button
                          onClick={() => setShowDetails({
                            ...showDetails,
                            [`${selectedCategory}-${index}`]: !showDetails[`${selectedCategory}-${index}`]
                          })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#60a5fa',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Info size={14} />
                          {showDetails[`${selectedCategory}-${index}`] ? 'Hide' : 'Show'} details
                        </button>

                        {showDetails[`${selectedCategory}-${index}`] && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: '#121319',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong style={{ color: '#cbd5e1' }}>Best timing:</strong>{' '}
                              <span style={{ color: '#a2a6ad' }}>{supp.timing}</span>
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                              <strong style={{ color: '#cbd5e1' }}>Form:</strong>{' '}
                              <span style={{ color: '#a2a6ad' }}>{supp.form}</span>
                            </div>
                            {supp.contraindications.length > 0 && (
                              <div style={{
                                marginTop: '8px',
                                padding: '8px',
                                background: '#1a0c0c',
                                border: '1px solid #3a1515',
                                borderRadius: '6px'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: '4px'
                                }}>
                                  <AlertCircle size={14} style={{ color: '#ef4444' }} />
                                  <strong style={{ color: '#ef4444', fontSize: '12px' }}>
                                    Caution:
                                  </strong>
                                </div>
                                <ul style={{
                                  margin: 0,
                                  paddingLeft: '20px',
                                  color: '#f87171'
                                }}>
                                  {supp.contraindications.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Supplements Summary */}
                {selectedSupplements.size > 0 && (
                  <div style={{
                    position: 'sticky',
                    bottom: '20px',
                    marginTop: '24px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #1a1b1f 0%, #121319 100%)',
                    border: '1px solid #4ade80',
                    borderRadius: '12px',
                    boxShadow: '0 4px 24px rgba(74, 222, 128, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#4ade80'
                      }}>
                        Your Selected Supplements ({selectedSupplements.size})
                      </h4>
                      <button
                        onClick={() => setSelectedSupplements(new Set())}
                        style={{
                          background: 'transparent',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          color: '#ef4444',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      {getSelectedSummary().map((item, i) => {
                        const priorityStyle = getPriorityStyle(item.priorityLevel);
                        return (
                          <div key={i} style={{
                            background: '#0e0f14',
                            border: '1px solid #23252c',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '13px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '2px'
                            }}>
                              <span style={{ fontSize: '10px' }}>{priorityStyle.icon}</span>
                              <strong style={{ color: '#f4f5f7' }}>{item.name}</strong>
                            </div>
                            <div style={{ color: '#a2a6ad', fontSize: '11px' }}>
                              {item.category}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        alert('Your selections have been saved.');
                      }}
                    >
                      Generate Shopping List →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Educational Footer */}
            {activeTab === 'symptoms' && !selectedCategory && (
              <div style={{
                marginTop: '40px',
                padding: '20px',
                background: '#121319',
                border: '1px solid #23252c',
                borderRadius: '14px'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f4f5f7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Info size={18} />
                  Important Information
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '14px',
                  color: '#a2a6ad',
                  lineHeight: '1.6'
                }}>
                  <li>These recommendations are for educational purposes only</li>
                  <li>Always consult with a healthcare provider before starting new supplements</li>
                  <li>Individual needs vary based on diet, health conditions, and medications</li>
                  <li>Start with the lowest effective dose and monitor your response</li>
                  <li>Quality matters - choose third-party tested supplements when possible</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}