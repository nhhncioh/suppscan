// src/components/QuickStartWizard.tsx - Quick Start Wizard for new users
"use client";
import React, { useState } from 'react';

interface QuickStartWizardProps {
  onComplete: (selectedSymptoms: string[]) => void;
  onSkip: () => void;
}

const WIZARD_QUESTIONS = [
  {
    id: 'main-goal',
    question: "What's your main health goal?",
    subtitle: "We'll suggest relevant symptoms to track",
    options: [
      { 
        id: 'energy', 
        text: 'More Energy', 
        icon: '⚡',
        symptoms: ['tired', 'afternoon-crash', 'exercise-fatigue'],
        description: 'Boost energy levels throughout the day'
      },
      { 
        id: 'sleep', 
        text: 'Better Sleep', 
        icon: '😴',
        symptoms: ['poor-sleep', 'wake-up-tired', 'racing-thoughts'],
        description: 'Improve sleep quality and duration'
      },
      { 
        id: 'mood', 
        text: 'Mood & Focus', 
        icon: '🧠',
        symptoms: ['stressed', 'brain-fog', 'low-mood'],
        description: 'Support mental clarity and emotional well-being'
      },
      { 
        id: 'fitness', 
        text: 'Fitness & Recovery', 
        icon: '💪',
        symptoms: ['workout-recovery', 'muscle-cramps', 'endurance'],
        description: 'Optimize athletic performance and recovery'
      },
      { 
        id: 'digestive', 
        text: 'Digestive Health', 
        icon: '🤢',
        symptoms: ['poor-digestion', 'bloating', 'constipation'],
        description: 'Improve gut health and digestion'
      },
      { 
        id: 'beauty', 
        text: 'Beauty & Anti-Aging', 
        icon: '✨',
        symptoms: ['dry-skin', 'hair-loss', 'premature-aging'],
        description: 'Support healthy skin, hair, and nails'
      }
    ]
  },
  {
    id: 'energy-level',
    question: "How would you describe your current energy levels?",
    subtitle: "This helps us understand your specific needs",
    options: [
      { 
        id: 'very-low', 
        text: 'Always exhausted', 
        icon: '😴',
        symptoms: ['tired', 'wake-up-tired', 'brain-fog'],
        description: 'Struggling to get through basic daily activities'
      },
      { 
        id: 'low', 
        text: 'Often tired', 
        icon: '😑',
        symptoms: ['tired', 'afternoon-crash'],
        description: 'Energy dips throughout the day, especially afternoon'
      },
      { 
        id: 'okay', 
        text: 'Okay but inconsistent', 
        icon: '😐',
        symptoms: ['afternoon-crash', 'exercise-fatigue'],
        description: 'Some good days, some bad days'
      },
      { 
        id: 'good', 
        text: 'Pretty good overall', 
        icon: '😊',
        symptoms: [],
        description: 'Generally satisfied but room for improvement'
      }
    ]
  },
  {
    id: 'stress-level',
    question: "How do you handle daily stress?",
    subtitle: "Stress affects many aspects of health",
    options: [
      { 
        id: 'high-stress', 
        text: 'Often overwhelmed', 
        icon: '😰',
        symptoms: ['stressed', 'anxiety', 'irritability', 'headaches'],
        description: 'Feeling anxious or overwhelmed most days'
      },
      { 
        id: 'medium-stress', 
        text: 'Manageable stress', 
        icon: '😅',
        symptoms: ['stressed', 'poor-sleep'],
        description: 'Stressful periods but generally cope well'
      },
      { 
        id: 'low-stress', 
        text: 'Pretty relaxed', 
        icon: '😌',
        symptoms: [],
        description: 'Good at managing stress and staying calm'
      }
    ]
  },
  {
    id: 'sleep-quality',
    question: "How's your sleep quality?",
    subtitle: "Sleep impacts everything from energy to mood",
    options: [
      { 
        id: 'poor-sleep', 
        text: 'Trouble falling/staying asleep', 
        icon: '😴',
        symptoms: ['poor-sleep', 'racing-thoughts', 'frequent-waking'],
        description: 'Takes long to fall asleep or wake up often'
      },
      { 
        id: 'light-sleeper', 
        text: 'Light sleeper, wake up tired', 
        icon: '⏰',
        symptoms: ['wake-up-tired', 'frequent-waking'],
        description: 'Sleep feels light and unrefreshing'
      },
      { 
        id: 'okay-sleep', 
        text: 'Sleep is okay', 
        icon: '😐',
        symptoms: ['wake-up-tired'],
        description: 'Get decent sleep but could be better'
      },
      { 
        id: 'good-sleep', 
        text: 'Sleep well most nights', 
        icon: '😊',
        symptoms: [],
        description: 'Generally satisfied with sleep quality'
      }
    ]
  }
];

export default function QuickStartWizard({ onComplete, onSkip }: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const currentQuestion = WIZARD_QUESTIONS[currentStep];
  const isLastStep = currentStep === WIZARD_QUESTIONS.length - 1;

  const handleAnswer = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
    
    setIsAnimating(true);
    setTimeout(() => {
      if (isLastStep) {
        // Complete wizard and compile symptoms
        const allSymptoms = new Set<string>();
        
        WIZARD_QUESTIONS.forEach(question => {
          const selectedOptionId = answers[question.id] || (question.id === currentQuestion.id ? optionId : null);
          if (selectedOptionId) {
            const option = question.options.find(opt => opt.id === selectedOptionId);
            if (option && option.symptoms) {
              option.symptoms.forEach(symptom => allSymptoms.add(symptom));
            }
          }
        });
        
        onComplete(Array.from(allSymptoms));
      } else {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }
    }, 300);
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getEstimatedSymptoms = () => {
    const symptoms = new Set<string>();
    Object.entries(answers).forEach(([questionId, answerId]) => {
      const question = WIZARD_QUESTIONS.find(q => q.id === questionId);
      const option = question?.options.find(opt => opt.id === answerId);
      if (option?.symptoms) {
        option.symptoms.forEach(symptom => symptoms.add(symptom));
      }
    });
    return symptoms.size;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        border: '1px solid var(--border)',
        transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.3s ease',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <button 
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Skip setup
            </button>
            
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {currentStep + 1} of {WIZARD_QUESTIONS.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--border)',
            borderRadius: '2px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: `${((currentStep + 1) / WIZARD_QUESTIONS.length) * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0 0 8px',
            color: 'var(--text)'
          }}>
            {currentQuestion.question}
          </h2>
          <p style={{
            color: 'var(--muted)',
            margin: 0,
            fontSize: '14px'
          }}>
            {currentQuestion.subtitle}
          </p>
        </div>

        {/* Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {currentQuestion.options.map(option => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              style={{
                background: answers[currentQuestion.id] === option.id 
                  ? 'var(--accent)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${answers[currentQuestion.id] === option.id 
                  ? 'var(--accent)' 
                  : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                color: answers[currentQuestion.id] === option.id 
                  ? 'white' 
                  : 'var(--text)'
              }}
              onMouseEnter={(e) => {
                if (answers[currentQuestion.id] !== option.id) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (answers[currentQuestion.id] !== option.id) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>
                  {option.icon}
                </span>
                <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                  {option.text}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '13px',
                opacity: 0.8,
                lineHeight: '1.4'
              }}>
                {option.description}
              </p>
              {option.symptoms && option.symptoms.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ 
                    fontSize: '10px', 
                    opacity: 0.6, 
                    marginBottom: '4px' 
                  }}>
                    Will track: {option.symptoms.length} symptoms
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: currentStep === 0 ? 'var(--muted)' : 'var(--text)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 0 ? 0.5 : 1
            }}
          >
            ← Back
          </button>

          <div style={{ textAlign: 'center' }}>
            {answers[currentQuestion.id] && (
              <div style={{
                fontSize: '12px',
                color: 'var(--accent)',
                background: 'rgba(74, 222, 128, 0.1)',
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'inline-block'
              }}>
                {isLastStep ? 
                  `Ready! We'll track ${getEstimatedSymptoms()} symptoms for you` :
                  'Selection saved ✓'
                }
              </div>
            )}
          </div>

          <div style={{ width: '80px' }}> {/* Spacer for layout balance */}
          </div>
        </div>

        {/* Bottom hint */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '4px' }}>
            💡 Pro tip
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {currentStep === 0 && "Choose your primary goal - we'll suggest related symptoms to track"}
            {currentStep === 1 && "Your energy levels help us recommend the right supplements"}
            {currentStep === 2 && "Stress affects sleep, digestion, and energy - it's all connected!"}
            {currentStep === 3 && "Poor sleep is linked to many health issues - it's a key metric"}
          </div>
        </div>
      </div>
    </div>
  );
}