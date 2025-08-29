// src/components/UserProfileSetup.tsx - Matching Your App's Card Layout
"use client";
import React, { useState, useEffect } from 'react';
import { useProfileStore } from '@/lib/userProfile';
import { ChevronLeft, ChevronRight, Check, User, Heart, Activity, Target, AlertCircle, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const HEALTH_GOALS = [
  { id: 'weight-loss', label: 'Weight Loss', icon: '⚖️', desc: 'Manage weight effectively' },
  { id: 'muscle-gain', label: 'Muscle Gain', icon: '💪', desc: 'Build lean muscle mass' },
  { id: 'energy', label: 'More Energy', icon: '⚡', desc: 'Boost daily vitality' },
  { id: 'immunity', label: 'Stronger Immunity', icon: '🛡️', desc: 'Support immune system' },
  { id: 'sleep', label: 'Better Sleep', icon: '😴', desc: 'Improve sleep quality' },
  { id: 'stress', label: 'Stress Management', icon: '🧘', desc: 'Reduce daily stress' },
  { id: 'digestion', label: 'Digestive Health', icon: '🌱', desc: 'Support gut health' },
  { id: 'heart-health', label: 'Heart Health', icon: '❤️', desc: 'Cardiovascular support' },
  { id: 'brain-health', label: 'Brain Health', icon: '🧠', desc: 'Cognitive enhancement' },
  { id: 'skin-health', label: 'Skin Health', icon: '✨', desc: 'Healthy, glowing skin' },
  { id: 'joint-health', label: 'Joint Health', icon: '🦴', desc: 'Support mobility' },
  { id: 'general-wellness', label: 'General Wellness', icon: '🌿', desc: 'Overall health support' }
];

const MEDICAL_CONDITIONS = [
  'Diabetes', 'Hypertension', 'High Cholesterol', 'Heart Disease', 
  'Arthritis', 'Osteoporosis', 'Anxiety', 'Depression', 
  'Thyroid Issues', 'PCOS', 'IBS', 'Food Allergies', 'None'
];

const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
  'Keto', 'Paleo', 'Low-Sodium', 'Low-Sugar', 'None'
];

const SUPPLEMENT_FORMS = [
  { id: 'capsule', label: 'Capsules', icon: '💊' },
  { id: 'tablet', label: 'Tablets', icon: '⚪' },
  { id: 'powder', label: 'Powders', icon: '🥄' },
  { id: 'gummy', label: 'Gummies', icon: '🍬' },
  { id: 'liquid', label: 'Liquids', icon: '🧴' },
  { id: 'softgel', label: 'Softgels', icon: '🔵' }
];

interface UserProfileSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function UserProfileSetup({ onComplete, onSkip }: UserProfileSetupProps) {
  const { 
    profile, 
    currentStep, 
    setProfile, 
    updateProfile, 
    setCurrentStep, 
    completeProfile,
    getAge,
    getBMI 
  } = useProfileStore();

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    dateOfBirth: profile?.dateOfBirth || '',
    gender: profile?.gender || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    activityLevel: profile?.activityLevel || '',
    primaryGoals: profile?.primaryGoals || [],
    secondaryGoals: profile?.secondaryGoals || [],
    medicalConditions: profile?.medicalConditions || [],
    currentMedications: profile?.currentMedications || [],
    allergies: profile?.allergies || [],
    dietaryRestrictions: profile?.dietaryRestrictions || [],
    sleepHours: profile?.sleepHours || 8,
    stressLevel: profile?.stressLevel || 5,
    smokingStatus: profile?.smokingStatus || '',
    alcoholConsumption: profile?.alcoholConsumption || '',
    preferredForms: profile?.preferredForms || [],
    budgetRange: profile?.budgetRange || '',
    trackingEnabled: profile?.trackingEnabled ?? true,
    reminderTime: profile?.reminderSettings?.time || '09:00'
  });

  const totalSteps = 6;

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value) 
        ? prev[field as keyof typeof prev].filter((item: string) => item !== value)
        : [...prev[field as keyof typeof prev], value]
    }));
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const profileData = {
      ...formData,
      height: Number(formData.height),
      weight: Number(formData.weight),
      reminderSettings: {
        enabled: formData.trackingEnabled,
        frequency: 'daily' as const,
        time: formData.reminderTime
      }
    };

    if (profile) {
      updateProfile(profileData);
    } else {
      setProfile(profileData);
    }
    
    completeProfile();
    onComplete?.();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                👤
              </div>
              <h2 className="card-title">Personal Information</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Help us get to know you better</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '8px' 
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '8px' 
                }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                />
              </div>

              <div className="row">
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="input"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="input"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, var(--accent), #22c55e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                💪
              </div>
              <h2 className="card-title">Physical Health</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Your body measurements and activity level</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="row">
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField('height', e.target.value)}
                    className="input"
                    placeholder="170"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    className="input"
                    placeholder="70"
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '12px' 
                }}>
                  Activity Level *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'sedentary', label: 'Sedentary', desc: 'Little/no exercise' },
                    { value: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
                    { value: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
                    { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
                    { value: 'very-active', label: 'Very Active', desc: 'Very hard exercise, physical job' }
                  ].map(option => (
                    <label 
                      key={option.value} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: formData.activityLevel === option.value ? 'rgba(74, 222, 128, 0.1)' : 'var(--surface)',
                        border: `2px solid ${formData.activityLevel === option.value ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="activityLevel"
                        value={option.value}
                        checked={formData.activityLevel === option.value}
                        onChange={(e) => updateField('activityLevel', e.target.value)}
                        style={{ marginRight: '12px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text)' }}>{option.label}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="row">
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Sleep Hours per Night
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={formData.sleepHours}
                    onChange={(e) => updateField('sleepHours', Number(e.target.value))}
                    className="input"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Stress Level (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.stressLevel}
                    onChange={(e) => updateField('stressLevel', Number(e.target.value))}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '8px', 
                    padding: '4px 8px',
                    background: 'var(--surface)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {formData.stressLevel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                🎯
              </div>
              <h2 className="card-title">Health Goals</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>What are you hoping to achieve?</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text)', 
                marginBottom: '12px' 
              }}>
                Primary Goals (Choose up to 3) *
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px',
                marginBottom: '16px'
              }}>
                {HEALTH_GOALS.map(goal => (
                  <div
                    key={goal.id}
                    onClick={() => {
                      if (formData.primaryGoals.includes(goal.id)) {
                        toggleArrayField('primaryGoals', goal.id);
                      } else if (formData.primaryGoals.length < 3) {
                        toggleArrayField('primaryGoals', goal.id);
                      }
                    }}
                    style={{
                      padding: '16px',
                      background: formData.primaryGoals.includes(goal.id) ? 'rgba(139, 92, 246, 0.1)' : 'var(--surface)',
                      border: `2px solid ${formData.primaryGoals.includes(goal.id) ? '#8b5cf6' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{goal.icon}</div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{goal.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{goal.desc}</div>
                  </div>
                ))}
              </div>
              
              {formData.primaryGoals.length > 0 && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                  {formData.primaryGoals.length}/3 primary goals selected
                </div>
              )}
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: 'var(--text)', 
                marginBottom: '12px' 
              }}>
                Secondary Goals (Optional)
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '8px'
              }}>
                {HEALTH_GOALS.filter(goal => !formData.primaryGoals.includes(goal.id)).map(goal => (
                  <div
                    key={goal.id}
                    onClick={() => toggleArrayField('secondaryGoals', goal.id)}
                    className="chip"
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: formData.secondaryGoals.includes(goal.id) ? 'rgba(139, 92, 246, 0.2)' : undefined,
                      borderColor: formData.secondaryGoals.includes(goal.id) ? '#8b5cf6' : undefined
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>{goal.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: '500' }}>{goal.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                🏥
              </div>
              <h2 className="card-title">Health History</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Help us understand any health considerations</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '12px' 
                }}>
                  Medical Conditions
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '8px'
                }}>
                  {MEDICAL_CONDITIONS.map(condition => (
                    <label 
                      key={condition} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        background: formData.medicalConditions.includes(condition) ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)',
                        border: `1px solid ${formData.medicalConditions.includes(condition) ? '#ef4444' : 'var(--border)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.medicalConditions.includes(condition)}
                        onChange={() => toggleArrayField('medicalConditions', condition)}
                        style={{ marginRight: '8px' }}
                      />
                      {condition}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '8px' 
                }}>
                  Current Medications
                </label>
                <textarea
                  value={formData.currentMedications.join(', ')}
                  onChange={(e) => updateField('currentMedications', e.target.value.split(', ').filter(Boolean))}
                  className="input"
                  placeholder="List any medications you're currently taking (separated by commas)"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '8px' 
                }}>
                  Allergies
                </label>
                <textarea
                  value={formData.allergies.join(', ')}
                  onChange={(e) => updateField('allergies', e.target.value.split(', ').filter(Boolean))}
                  className="input"
                  placeholder="List any known allergies (separated by commas)"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '12px' 
                }}>
                  Dietary Restrictions
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '8px'
                }}>
                  {DIETARY_RESTRICTIONS.map(restriction => (
                    <label 
                      key={restriction} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        background: formData.dietaryRestrictions.includes(restriction) ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface)',
                        border: `1px solid ${formData.dietaryRestrictions.includes(restriction) ? 'var(--accent2)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.dietaryRestrictions.includes(restriction)}
                        onChange={() => toggleArrayField('dietaryRestrictions', restriction)}
                        style={{ marginRight: '8px' }}
                      />
                      {restriction}
                    </label>
                  ))}
                </div>
              </div>

              <div className="row">
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Smoking Status
                  </label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => updateField('smokingStatus', e.target.value)}
                    className="input"
                  >
                    <option value="">Select status</option>
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Alcohol Consumption
                  </label>
                  <select
                    value={formData.alcoholConsumption}
                    onChange={(e) => updateField('alcoholConsumption', e.target.value)}
                    className="input"
                  >
                    <option value="">Select frequency</option>
                    <option value="none">None</option>
                    <option value="light">Light (1-2 drinks/week)</option>
                    <option value="moderate">Moderate (3-7 drinks/week)</option>
                    <option value="heavy">Heavy (8+ drinks/week)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                💊
              </div>
              <h2 className="card-title">Supplement Preferences</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Your preferences for supplement recommendations</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '12px' 
                }}>
                  Preferred Supplement Forms
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '12px'
                }}>
                  {SUPPLEMENT_FORMS.map(form => (
                    <div
                      key={form.id}
                      onClick={() => toggleArrayField('preferredForms', form.id)}
                      style={{
                        padding: '16px',
                        background: formData.preferredForms.includes(form.id) ? 'rgba(236, 72, 153, 0.1)' : 'var(--surface)',
                        border: `2px solid ${formData.preferredForms.includes(form.id) ? '#ec4899' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{form.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{form.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  marginBottom: '12px' 
                }}>
                  Budget Range
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { value: 'budget', label: 'Budget', price: '$10-30/month', desc: 'Essential supplements only' },
                    { value: 'mid-range', label: 'Mid-range', price: '$30-70/month', desc: 'Good quality with some extras' },
                    { value: 'premium', label: 'Premium', price: '$70+/month', desc: 'High-quality, comprehensive support' }
                  ].map(option => (
                    <label 
                      key={option.value} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: formData.budgetRange === option.value ? 'rgba(236, 72, 153, 0.1)' : 'var(--surface)',
                        border: `2px solid ${formData.budgetRange === option.value ? '#ec4899' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="budgetRange"
                        value={option.value}
                        checked={formData.budgetRange === option.value}
                        onChange={(e) => updateField('budgetRange', e.target.value)}
                        style={{ marginRight: '12px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '500' }}>{option.label}</span>
                          <span style={{ color: '#ec4899', fontWeight: '500' }}>{option.price}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, var(--accent2), #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ⚙️
              </div>
              <h2 className="card-title">Tracking & Reminders</h2>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Configure how you'd like to track your progress</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>Enable Health Tracking</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Track symptoms, mood, and supplement effects</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.trackingEnabled}
                      onChange={(e) => updateField('trackingEnabled', e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '48px',
                      height: '24px',
                      backgroundColor: formData.trackingEnabled ? 'var(--accent2)' : '#374151',
                      borderRadius: '12px',
                      position: 'relative',
                      transition: 'background-color 0.2s'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: formData.trackingEnabled ? '26px' : '2px',
                        transition: 'left 0.2s'
                      }}></div>
                    </div>
                  </label>
                </div>
              </div>

              {formData.trackingEnabled && (
                <div className="card" style={{ margin: 0 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)', 
                    marginBottom: '8px' 
                  }}>
                    Daily Reminder Time
                  </label>
                  <input
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => updateField('reminderTime', e.target.value)}
                    className="input"
                  />
                  <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '8px', margin: 0 }}>
                    We'll send you a gentle reminder to check in with your health
                  </p>
                </div>
              )}

              {/* Profile Summary */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                border: '1px solid var(--accent2)',
                borderRadius: 'var(--radius)',
                padding: '18px'
              }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ✅ Profile Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Name</div>
                    <div style={{ fontWeight: '500' }}>{formData.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Primary Goals</div>
                    <div style={{ fontWeight: '500' }}>{formData.primaryGoals.length} selected</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Height/Weight</div>
                    <div style={{ fontWeight: '500' }}>
                      {formData.height ? `${formData.height}cm` : '--'} / {formData.weight ? `${formData.weight}kg` : '--'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Activity Level</div>
                    <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                      {formData.activityLevel.replace('-', ' ') || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.dateOfBirth;
      case 2:
        return formData.height && formData.weight && formData.activityLevel;
      case 3:
        return formData.primaryGoals.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '16px',
      paddingBottom: '100px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header matching your app style */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            {onSkip && (
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
                onClick={onSkip}
              >
                ← Skip setup
              </Link>
            )}
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome to Your Health Journey
          </h1>

          {/* Progress indicators matching your app */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <React.Fragment key={i}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: i + 1 < currentStep 
                    ? 'var(--accent)' 
                    : i + 1 === currentStep 
                      ? 'var(--accent2)' 
                      : 'var(--surface)',
                  color: i + 1 <= currentStep ? 'white' : 'var(--muted)',
                  border: `2px solid ${i + 1 <= currentStep ? 'transparent' : 'var(--border)'}`,
                  transition: 'all 0.2s ease'
                }}>
                  {i + 1 < currentStep ? '✓' : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div style={{
                    width: '24px',
                    height: '2px',
                    background: i + 1 < currentStep ? 'var(--accent)' : 'var(--border)',
                    transition: 'background 0.2s ease'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Step {currentStep} of {totalSteps}</p>
        </div>

        {/* Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: '32px' }}>
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="btn btn-ghost"
            style={{
              opacity: currentStep === 1 ? 0.5 : 1,
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="btn btn-primary"
              style={{
                background: canProceed() ? 'linear-gradient(135deg, var(--accent), #22c55e)' : undefined,
                opacity: canProceed() ? 1 : 0.5,
                cursor: canProceed() ? 'pointer' : 'not-allowed'
              }}
            >
              <Check size={16} />
              Complete Setup
            </button>
          ) : (
            <button
              onClick={goToNextStep}
              disabled={!canProceed()}
              className="btn btn-primary"
              style={{
                background: canProceed() ? 'linear-gradient(135deg, var(--accent2), var(--accent))' : undefined,
                opacity: canProceed() ? 1 : 0.5,
                cursor: canProceed() ? 'pointer' : 'not-allowed'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}