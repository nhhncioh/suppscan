// src/app/profile/page.tsx - User Profile with Symptoms Display
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfileStore } from '@/lib/userProfile';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Same symptom categories as symptoms page for consistency
const SYMPTOM_CATEGORIES = {
  'Energy & Fatigue': {
    icon: '⚡',
    color: '#3b82f6',
    symptoms: [
      { id: 'tired', name: 'Always Tired', icon: '😴', description: 'Feeling fatigued and low energy throughout the day' },
      { id: 'afternoon-crash', name: 'Afternoon Energy Crash', icon: '📉', description: 'Energy drops significantly in the afternoon' },
      { id: 'tired-despite-sleep', name: 'Tired Despite Sleep', icon: '🛌', description: 'Still feeling tired even after 7-8 hours of sleep' },
      { id: 'exercise-fatigue', name: 'Exercise Fatigue', icon: '💪', description: 'Getting unusually tired during or after workouts' }
    ]
  },
  'Sleep Issues': {
    icon: '🌙',
    color: '#8b5cf6',
    symptoms: [
      { id: 'poor-sleep', name: 'Can\'t Fall Asleep', icon: '😴', description: 'Difficulty falling asleep at bedtime' },
      { id: 'wake-up-tired', name: 'Wake Up Tired', icon: '⏰', description: 'Waking up feeling unrefreshed despite sleeping' },
      { id: 'racing-thoughts', name: 'Racing Thoughts at Bedtime', icon: '💭', description: 'Mind won\'t quiet down when trying to sleep' },
      { id: 'frequent-waking', name: 'Wake Up Often', icon: '🔄', description: 'Waking up multiple times during the night' }
    ]
  },
  'Mood & Mental Health': {
    icon: '🧠',
    color: '#ef4444',
    symptoms: [
      { id: 'stressed', name: 'Stressed Out', icon: '😰', description: 'Feeling overwhelmed and anxious frequently' },
      { id: 'anxiety', name: 'Social Anxiety', icon: '😬', description: 'Nervousness in social situations or public speaking' },
      { id: 'low-mood', name: 'Low Mood', icon: '😔', description: 'Feeling down or lacking motivation' },
      { id: 'mood-swings', name: 'Mood Swings', icon: '🎭', description: 'Unpredictable changes in mood throughout the day' },
      { id: 'irritability', name: 'Easily Irritated', icon: '😤', description: 'Getting annoyed or frustrated more easily than usual' }
    ]
  },
  'Brain Function & Focus': {
    icon: '🎯',
    color: '#10b981',
    symptoms: [
      { id: 'brain-fog', name: 'Brain Fog', icon: '🧠', description: 'Difficulty concentrating and mental clarity issues' },
      { id: 'forgetfulness', name: 'Forgetfulness', icon: '🤔', description: 'Frequently forgetting names, appointments, or tasks' },
      { id: 'focus-issues', name: 'Can\'t Focus', icon: '🎯', description: 'Difficulty maintaining attention on tasks' },
      { id: 'mental-fatigue', name: 'Mental Fatigue', icon: '🧩', description: 'Brain feels tired after mental work' }
    ]
  },
  'Digestion': {
    icon: '🤢',
    color: '#f59e0b',
    symptoms: [
      { id: 'poor-digestion', name: 'General Digestive Issues', icon: '🤢', description: 'Bloating, gas, or digestive discomfort' },
      { id: 'bloating', name: 'Bloating After Meals', icon: '🎈', description: 'Feeling bloated and uncomfortable after eating' },
      { id: 'acid-reflux', name: 'Acid Reflux/Heartburn', icon: '🔥', description: 'Heartburn or acid reflux symptoms' },
      { id: 'constipation', name: 'Constipation', icon: '🚽', description: 'Difficulty with regular bowel movements' },
      { id: 'food-sensitivities', name: 'Food Sensitivities', icon: '🥛', description: 'Reactions to certain foods (dairy, gluten, etc.)' }
    ]
  },
  'Aches & Pain': {
    icon: '💪',
    color: '#eab308',
    symptoms: [
      { id: 'joint-pain', name: 'Joint Pain', icon: '🦴', description: 'Aches and stiffness in joints' },
      { id: 'back-pain', name: 'Back Pain', icon: '🔙', description: 'Chronic or recurring lower back pain' },
      { id: 'headaches', name: 'Frequent Headaches', icon: '🤕', description: 'Regular tension headaches or migraines' },
      { id: 'muscle-cramps', name: 'Muscle Cramps', icon: '💪', description: 'Frequent muscle cramps or spasms' },
      { id: 'neck-shoulder-tension', name: 'Neck/Shoulder Tension', icon: '🤷', description: 'Chronic tension in neck and shoulder muscles' }
    ]
  }
  // Add more categories as needed...
};

interface UserSymptom {
  id: string;
  name: string;
  icon: string;
  description: string;
  severity: number;
  dateAdded: string;
  category: string;
  categoryColor: string;
}

export default function UserProfilePage() {
  const { profile, user, loading } = useProfileStore();
  const [userSymptoms, setUserSymptoms] = useState<UserSymptom[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'symptoms'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Load and process user symptoms
  useEffect(() => {
    if (!profile?.activeSymptoms) {
      setUserSymptoms([]);
      return;
    }

    const symptoms: UserSymptom[] = [];
    
    // Map symptom IDs to full symptom objects
    profile.activeSymptoms.forEach(symptomId => {
      // Find symptom in categories
      Object.entries(SYMPTOM_CATEGORIES).forEach(([categoryName, category]) => {
        const symptomData = category.symptoms.find(s => s.id === symptomId);
        if (symptomData) {
          symptoms.push({
            ...symptomData,
            severity: profile.symptomSeverity?.[symptomId] || 3,
            dateAdded: profile.symptomDateAdded?.[symptomId] || new Date().toISOString(),
            category: categoryName,
            categoryColor: category.color
          });
        }
      });
    });

    // Sort by severity (highest first) then by date added (newest first)
    symptoms.sort((a, b) => {
      if (a.severity !== b.severity) {
        return b.severity - a.severity;
      }
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

    setUserSymptoms(symptoms);
  }, [profile]);

  const removeSymptom = async (symptomId: string) => {
    if (!user || !profile) return;

    const updatedSymptoms = profile.activeSymptoms?.filter(id => id !== symptomId) || [];
    const updatedSeverity = { ...profile.symptomSeverity };
    const updatedDateAdded = { ...profile.symptomDateAdded };
    
    delete updatedSeverity[symptomId];
    delete updatedDateAdded[symptomId];

    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        activeSymptoms: updatedSymptoms,
        symptomSeverity: updatedSeverity,
        symptomDateAdded: updatedDateAdded,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error removing symptom:', error);
    }
  };

  const updateSymptomSeverity = async (symptomId: string, newSeverity: number) => {
    if (!user || !profile) return;

    const updatedSeverity = {
      ...profile.symptomSeverity,
      [symptomId]: newSeverity
    };

    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        symptomSeverity: updatedSeverity,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating severity:', error);
    }
  };

  const getSymptomsByCategory = () => {
    const grouped: Record<string, UserSymptom[]> = {};
    userSymptoms.forEach(symptom => {
      if (!grouped[symptom.category]) {
        grouped[symptom.category] = [];
      }
      grouped[symptom.category].push(symptom);
    });
    return grouped;
  };

  const getHealthScore = () => {
    if (userSymptoms.length === 0) return 100;
    
    const totalSeverity = userSymptoms.reduce((sum, s) => sum + s.severity, 0);
    const maxPossibleSeverity = userSymptoms.length * 5;
    const severityPercentage = (totalSeverity / maxPossibleSeverity) * 100;
    
    // Invert so lower severity = higher health score
    return Math.round(100 - severityPercentage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTopSupplementRecommendations = () => {
    if (userSymptoms.length === 0) return [];
    
    const supplementScores: Record<string, number> = {};
    const supplementSymptoms: Record<string, string[]> = {};
    
    // Get all common supplements from symptom data
    const allSupplementData: Record<string, string[]> = {
      'tired': ['Iron', 'B12', 'CoQ10', 'Magnesium', 'Vitamin D'],
      'afternoon-crash': ['B-Complex', 'Chromium', 'Iron', 'Adaptogenic herbs'],
      'tired-despite-sleep': ['Magnesium', 'Iron', 'Vitamin D', 'B12'],
      'exercise-fatigue': ['Creatine', 'CoQ10', 'Iron', 'Electrolytes'],
      'poor-sleep': ['Melatonin', 'Magnesium', 'L-Theanine', 'GABA'],
      'wake-up-tired': ['Magnesium', 'CoQ10', 'Iron', 'B12'],
      'racing-thoughts': ['L-Theanine', 'Magnesium', 'Passionflower', 'Melatonin'],
      'frequent-waking': ['Magnesium', 'GABA', 'Melatonin', 'L-Glycine'],
      'stressed': ['Magnesium', 'Ashwagandha', 'L-Theanine', 'B-Complex'],
      'anxiety': ['L-Theanine', 'GABA', 'Passionflower', 'Magnesium'],
      'low-mood': ['Vitamin D', 'Omega-3', 'SAMe', '5-HTP'],
      'mood-swings': ['B-Complex', 'Magnesium', 'Omega-3', 'Rhodiola'],
      'irritability': ['Magnesium', 'B6', 'L-Theanine', 'Rhodiola'],
      'brain-fog': ['Omega-3', 'B12', "Lion's Mane", 'Ginkgo Biloba'],
      'forgetfulness': ['Ginkgo Biloba', 'Phosphatidylserine', 'B12', 'Omega-3'],
      'focus-issues': ['L-Tyrosine', 'Rhodiola', 'B-Complex', "Lion's Mane"],
      'mental-fatigue': ['Phosphatidylserine', 'CoQ10', 'B-Complex', 'Ginseng']
    };

    // Weight supplements by severity
    userSymptoms.forEach(symptom => {
      const weight = symptom.severity / 5; // Convert severity to weight (0.2 to 1.0)
      const supplements = allSupplementData[symptom.id] || [];
      
      supplements.forEach(supp => {
        supplementScores[supp] = (supplementScores[supp] || 0) + weight;
        if (!supplementSymptoms[supp]) {
          supplementSymptoms[supp] = [];
        }
        if (!supplementSymptoms[supp].includes(symptom.name)) {
          supplementSymptoms[supp].push(symptom.name);
        }
      });
    });

    return Object.entries(supplementScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([name, score]) => ({
        name,
        score: Math.round(score * 10) / 10,
        forSymptoms: supplementSymptoms[name] || [],
        priority: score > 2 ? 'high' : score > 1 ? 'medium' : 'low'
      }));
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg)', 
        color: 'var(--text)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <div>Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg)', 
        color: 'var(--text)', 
        padding: '40px 16px' 
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>🔐 Sign In Required</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
            You need to sign in to view your profile and saved symptoms.
          </p>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              background: 'var(--accent)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Go to Scanner
          </Link>
        </div>
      </div>
    );
  }

  const healthScore = getHealthScore();
  const groupedSymptoms = getSymptomsByCategory();
  const topSupplements = getTopSupplementRecommendations();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      color: 'var(--text)', 
      padding: '16px' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px' 
          }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--accent2)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Scanner
            </Link>

            <Link
              href="/symptoms"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--accent)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🩺 Manage Symptoms
            </Link>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '16px'
            }}>
              👤
            </div>
            
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '800', 
              margin: '0 0 8px',
              background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Your Health Profile
            </h1>
            
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Health Score Dashboard */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '800',
            background: healthScore >= 70 ? 'linear-gradient(135deg, #10b981, #059669)' :
                       healthScore >= 40 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                       'linear-gradient(135deg, #ef4444, #dc2626)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            {healthScore}%
          </div>
          
          <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
            Health Score
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px',
            marginTop: '24px'
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                {userSymptoms.length}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Active Symptoms</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent2)' }}>
                {Object.keys(groupedSymptoms).length}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Health Areas</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {userSymptoms.filter(s => s.severity >= 4).length}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>High Priority</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '32px',
          background: 'var(--surface)',
          padding: '4px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          {(['overview', 'symptoms'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === tab ? 'var(--accent)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {userSymptoms.length === 0 ? (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>
                  No Symptoms Tracked Yet
                </h3>
                <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
                  Start tracking your symptoms to get personalized supplement recommendations
                </p>
                <Link
                  href="/symptoms"
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Add Your First Symptom
                </Link>
              </div>
            ) : (
              <>
                {/* Top Supplement Recommendations */}
                {topSupplements.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      marginBottom: '16px',
                      color: 'var(--accent)'
                    }}>
                      💊 Top Recommended Supplements
                    </h2>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '16px'
                    }}>
                      {topSupplements.map((supplement, index) => (
                        <div
                          key={supplement.name}
                          style={{
                            background: index === 0 
                              ? 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)'
                              : 'linear-gradient(135deg, var(--accent2) 0%, #2563eb 100%)',
                            border: '1px solid transparent',
                            borderRadius: 'var(--radius)',
                            padding: '20px',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Priority badge */}
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            #{index + 1} Priority
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <h3 style={{
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              margin: '0 0 8px',
                              color: 'white'
                            }}>
                              {supplement.name}
                            </h3>
                            <div style={{
                              fontSize: '12px',
                              opacity: 0.9,
                              background: 'rgba(255, 255, 255, 0.15)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}>
                              Match Score: {supplement.score}/5
                            </div>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <div style={{
                              fontSize: '13px',
                              opacity: 0.9,
                              marginBottom: '8px'
                            }}>
                              May help with:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {supplement.forSymptoms.slice(0, 3).map(symptom => (
                                <span
                                  key={symptom}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}
                                >
                                  {symptom}
                                </span>
                              ))}
                              {supplement.forSymptoms.length > 3 && (
                                <span style={{
                                  fontSize: '11px',
                                  opacity: 0.8,
                                  alignSelf: 'center'
                                }}>
                                  +{supplement.forSymptoms.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '12px',
                            lineHeight: '1.4'
                          }}>
                            <strong>Next step:</strong> Research quality brands and consult with a healthcare provider for personalized dosing guidance.
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Research disclaimer */}
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '16px',
                      fontSize: '13px',
                      color: '#fbbf24'
                    }}>
                      ⚠️ These recommendations are based on your reported symptoms and common supplement uses. Always consult a healthcare provider before starting new supplements, especially if you have health conditions or take medications.
                    </div>
                  </div>
                )}

                {/* Priority Symptoms */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    color: 'var(--accent2)'
                  }}>
                    🚨 High Priority Symptoms
                  </h2>
                  
                  {userSymptoms.filter(s => s.severity >= 4).length === 0 ? (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      color: '#10b981',
                      textAlign: 'center'
                    }}>
                      ✅ Great! No high-severity symptoms currently tracked.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {userSymptoms.filter(s => s.severity >= 4).map(symptom => (
                        <div
                          key={symptom.id}
                          style={{
                            background: 'var(--surface)',
                            border: `2px solid ${symptom.categoryColor}`,
                            borderRadius: 'var(--radius)',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{symptom.icon}</span>
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontWeight: '600' }}>
                                {symptom.name}
                              </h4>
                              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
                                Severity: {symptom.severity}/5 • {symptom.category}
                              </p>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: `${symptom.categoryColor}20`,
                              color: symptom.categoryColor,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              High Priority
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '16px',
                    color: 'var(--accent2)'
                  }}>
                    📅 Recent Activity
                  </h2>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {userSymptoms.slice(0, 5).map(symptom => (
                      <div
                        key={symptom.id}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.25rem' }}>{symptom.icon}</span>
                          <span style={{ fontWeight: '500' }}>{symptom.name}</span>
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                          {formatDate(symptom.dateAdded)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {userSymptoms.length > 5 && (
                    <button
                      onClick={() => setActiveTab('symptoms')}
                      style={{
                        display: 'block',
                        width: '100%',
                        margin: '16px 0 0',
                        padding: '12px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--accent2)',
                        cursor: 'pointer'
                      }}
                    >
                      View All {userSymptoms.length} Symptoms →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'symptoms' && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: 0,
                color: 'var(--accent2)'
              }}>
                🩺 Your Symptoms ({userSymptoms.length})
              </h2>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    padding: '8px 16px',
                    background: isEditing ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    color: isEditing ? 'white' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </button>
                
                <Link
                  href="/symptoms"
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent2)',
                    border: '1px solid var(--accent2)',
                    borderRadius: '8px',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  + Add Symptoms
                </Link>
              </div>
            </div>

            {userSymptoms.length === 0 ? (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🩺</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
                  No Symptoms Added
                </h3>
                <Link
                  href="/symptoms"
                  style={{
                    display: 'inline-block',
                    background: 'var(--accent)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Browse Symptom Categories
                </Link>
              </div>
            ) : (
              // Group symptoms by category
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {Object.entries(groupedSymptoms).map(([categoryName, symptoms]) => (
                  <div key={categoryName}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: '16px',
                      color: symptoms[0].categoryColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {SYMPTOM_CATEGORIES[categoryName as keyof typeof SYMPTOM_CATEGORIES]?.icon}
                      {categoryName} ({symptoms.length})
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '16px'
                    }}>
                      {symptoms.map(symptom => (
                        <div
                          key={symptom.id}
                          style={{
                            background: 'var(--surface)',
                            border: `2px solid ${symptom.categoryColor}`,
                            borderRadius: 'var(--radius)',
                            padding: '20px',
                            position: 'relative'
                          }}
                        >
                          {/* Remove button when editing */}
                          {isEditing && (
                            <button
                              onClick={() => removeSymptom(symptom.id)}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ×
                            </button>
                          )}
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            <span style={{ fontSize: '1.5rem' }}>{symptom.icon}</span>
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '1.1rem' }}>
                                {symptom.name}
                              </h4>
                              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                                Added {formatDate(symptom.dateAdded)}
                              </p>
                            </div>
                          </div>
                          
                          <p style={{
                            color: 'var(--muted)',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            marginBottom: '16px'
                          }}>
                            {symptom.description}
                          </p>
                          
                          {/* Severity display/editor */}
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '8px'
                            }}>
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Severity: {symptom.severity}/5
                              </span>
                              <span style={{
                                background: `${symptom.categoryColor}20`,
                                color: symptom.categoryColor,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '500'
                              }}>
                                {symptom.severity >= 4 ? 'High' : 
                                 symptom.severity >= 3 ? 'Moderate' : 'Low'}
                              </span>
                            </div>
                            
                            {/* Severity slider when editing */}
                            {isEditing ? (
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={symptom.severity}
                                onChange={(e) => updateSymptomSeverity(symptom.id, parseInt(e.target.value))}
                                style={{
                                  width: '100%',
                                  accentColor: symptom.categoryColor
                                }}
                              />
                            ) : (
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      background: i < symptom.severity ? symptom.categoryColor : 'rgba(255,255,255,0.2)'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 1000
        }}>
          <Link
            href="/symptoms"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: '50%',
              textDecoration: 'none',
              fontSize: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
            title="Add symptoms"
          >
            +
          </Link>
        </div>

      </div>
    </div>
  );
}