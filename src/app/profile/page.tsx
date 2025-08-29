// src/app/profile/page.tsx - Redesigned to match your app styling
"use client";
import React, { useState } from 'react';
import { useProfileStore } from '@/lib/userProfile';
import UserProfileSetup from '@/components/UserProfileSetup';
import { 
  User, 
  Edit3, 
  Heart, 
  Activity, 
  Target, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Home,
  Scan,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { 
    profile, 
    isComplete, 
    updateProfile, 
    clearProfile, 
    getAge, 
    getBMI, 
    getHealthScore, 
    getPersonalizedRecommendations 
  } = useProfileStore();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'goals' | 'recommendations'>('overview');

  if (!profile || !isComplete) {
    return (
      <UserProfileSetup 
        onComplete={() => setIsEditing(false)}
        onSkip={() => window.history.back()}
      />
    );
  }

  const age = getAge();
  const bmi = getBMI();
  const healthScore = getHealthScore();
  const recommendations = getPersonalizedRecommendations();

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'var(--accent2)' };
    if (bmi < 25) return { category: 'Normal', color: 'var(--accent)' };
    if (bmi < 30) return { category: 'Overweight', color: '#f59e0b' };
    return { category: 'Obese', color: '#ef4444' };
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent)';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (isEditing) {
    return (
      <UserProfileSetup 
        onComplete={() => setIsEditing(false)}
      />
    );
  }

  const TabButton = ({ tabId, children, icon: Icon }: { 
    tabId: 'overview' | 'health' | 'goals' | 'recommendations';
    children: React.ReactNode;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: activeTab === tabId ? 'var(--accent2)' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: activeTab === tabId ? 'white' : 'var(--muted)',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <Icon size={16} />
      {children}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '16px',
      paddingBottom: '100px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
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
              ← Back to SuppScan
            </Link>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            👤 My Health Profile
          </h1>

          {/* Quick Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {age && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{age}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>years old</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: getHealthScoreColor(healthScore) }}>
                {healthScore}/100
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Health Score</div>
            </div>
            {bmi && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: getBMICategory(bmi).color }}>
                  {bmi.toFixed(1)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>BMI ({getBMICategory(bmi).category})</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, var(--accent2), var(--accent))' }}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
          padding: '8px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <TabButton tabId="overview" icon={User}>Overview</TabButton>
          <TabButton tabId="health" icon={Heart}>Health Data</TabButton>
          <TabButton tabId="goals" icon={Target}>Goals</TabButton>
          <TabButton tabId="recommendations" icon={TrendingUp}>Recommendations</TabButton>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Personal Info Card */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <User size={20} />
                Personal Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Name</div>
                  <div style={{ fontWeight: '500' }}>{profile.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontWeight: '500' }}>{profile.email || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Gender</div>
                  <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{profile.gender || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Member Since</div>
                  <div style={{ fontWeight: '500' }}>{new Date(profile.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Physical Stats Card */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Activity size={20} />
                Physical Stats
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Height</span>
                  <span style={{ fontWeight: '500' }}>{profile.height}cm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Weight</span>
                  <span style={{ fontWeight: '500' }}>{profile.weight}kg</span>
                </div>
                {bmi && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>BMI</span>
                    <span style={{ fontWeight: '500', color: getBMICategory(bmi).color }}>
                      {bmi.toFixed(1)} ({getBMICategory(bmi).category})
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Activity Level</span>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {profile.activityLevel.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Score Card */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={20} />
                Health Score
              </h3>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: '700', 
                  color: getHealthScoreColor(healthScore),
                  marginBottom: '8px'
                }}>
                  {healthScore}
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--surface)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${healthScore}%`,
                    height: '100%',
                    background: getHealthScoreColor(healthScore),
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Based on your lifestyle and health data
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Lifestyle Factors */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Activity size={20} />
                Lifestyle Factors
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Sleep Hours</span>
                  <span style={{ fontWeight: '500' }}>{profile.sleepHours} hours/night</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Stress Level</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '60px',
                      height: '6px',
                      background: 'var(--surface)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${profile.stressLevel * 10}%`,
                        height: '100%',
                        background: profile.stressLevel <= 3 ? 'var(--accent)' :
                                   profile.stressLevel <= 7 ? '#f59e0b' : '#ef4444',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontWeight: '500' }}>{profile.stressLevel}/10</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Smoking Status</span>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {profile.smokingStatus.replace('-', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Alcohol</span>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {profile.alcoholConsumption}
                  </span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertCircle size={20} />
                Medical Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Medical Conditions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {profile.medicalConditions.length > 0 ? (
                      profile.medicalConditions.map(condition => (
                        <span key={condition} className="chip" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                          {condition}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: '14px' }}>None reported</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Current Medications</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {profile.currentMedications.length > 0 ? (
                      profile.currentMedications.map(medication => (
                        <span key={medication} className="chip" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                          {medication}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: '14px' }}>None reported</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Allergies</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {profile.allergies.length > 0 ? (
                      profile.allergies.map(allergy => (
                        <span key={allergy} className="chip" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: '14px' }}>None reported</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Dietary Restrictions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {profile.dietaryRestrictions.length > 0 ? (
                      profile.dietaryRestrictions.map(restriction => (
                        <span key={restriction} className="chip" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent2)' }}>
                          {restriction}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: '14px' }}>None reported</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Primary Goals */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Target size={20} />
                Primary Health Goals
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.primaryGoals.map(goal => (
                  <div key={goal} style={{
                    padding: '12px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontWeight: '500', color: '#8b5cf6', textTransform: 'capitalize' }}>
                      {goal.replace('-', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Goals */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Secondary Goals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.secondaryGoals.length > 0 ? (
                  profile.secondaryGoals.map(goal => (
                    <div key={goal} style={{
                      padding: '12px',
                      background: 'var(--surface)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                        {goal.replace('-', ' ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--muted)' }}>No secondary goals set</div>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Settings size={20} />
                Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Preferred Forms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {profile.preferredForms.map(form => (
                      <span key={form} className="chip" style={{ textTransform: 'capitalize' }}>
                        {form}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Budget Range</span>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                    {profile.budgetRange?.replace('-', ' ')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Health Tracking</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: profile.trackingEnabled ? 'var(--accent)' : '#ef4444'
                    }} />
                    <span style={{ fontSize: '14px' }}>
                      {profile.trackingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                
                {profile.trackingEnabled && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Daily reminders at {profile.reminderSettings.time}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target size={20} />
              Your Personalized Recommendations
            </h3>
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
                Based on your health profile, goals, and lifestyle factors:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {recommendations.map((recommendation, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                      <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <Link 
                href="/"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #22c55e)',
                  textDecoration: 'none',
                  justifyContent: 'center'
                }}
              >
                <Scan size={16} />
                Start Scanning
              </Link>
              
              <Link 
                href="/symptoms"
                className="btn"
                style={{ textDecoration: 'none', justifyContent: 'center' }}
              >
                <Heart size={16} />
                Track Symptoms
              </Link>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="card" style={{ marginTop: '40px', border: '1px solid #ef4444' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '16px' }}>Danger Zone</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Delete Profile</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Permanently delete all your profile data and preferences
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
                  clearProfile();
                }
              }}
              className="btn"
              style={{ background: '#ef4444', color: 'white' }}
            >
              Delete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}