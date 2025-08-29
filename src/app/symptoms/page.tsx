// src/app/symptoms/page.tsx - Enhanced with Smart Suggestions, Quick Start, Severity, Gamification
"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import ProgramSuggestions from '../../components/ProgramSuggestions';
import Watchouts from '../../components/Watchouts';

// Enhanced symptom structure with severity
interface SymptomData {
  id: string;
  name: string;
  icon: string;
  description: string;
  commonSupplements: string[];
  severity?: number; // 1-5 scale
  dateAdded?: string;
}

interface SelectedSymptom extends SymptomData {
  severity: number;
  dateAdded: string;
}

// Smart suggestion relationships
const SYMPTOM_RELATIONSHIPS = {
  'tired': ['brain-fog', 'low-mood', 'wake-up-tired'],
  'stressed': ['poor-sleep', 'headaches', 'irritability'],
  'poor-sleep': ['tired', 'brain-fog', 'irritability'],
  'brain-fog': ['tired', 'forgetfulness', 'focus-issues'],
  'headaches': ['stressed', 'neck-shoulder-tension', 'poor-sleep'],
  'joint-pain': ['back-pain', 'muscle-cramps', 'neck-shoulder-tension'],
  'poor-digestion': ['bloating', 'food-sensitivities', 'stressed']
};

// Organized symptoms by clear categories
const SYMPTOM_CATEGORIES = {
  'Energy & Fatigue': {
    icon: '⚡',
    color: '#3b82f6',
    symptoms: [
      {
        id: 'tired',
        name: 'Always Tired',
        icon: '😴',
        description: 'Feeling fatigued and low energy throughout the day',
        commonSupplements: ['Iron', 'B12', 'CoQ10', 'Magnesium', 'Vitamin D']
      },
      {
        id: 'afternoon-crash',
        name: 'Afternoon Energy Crash',
        icon: '📉',
        description: 'Energy drops significantly in the afternoon',
        commonSupplements: ['B-Complex', 'Chromium', 'Iron', 'Adaptogenic herbs']
      },
      {
        id: 'tired-despite-sleep',
        name: 'Tired Despite Sleep',
        icon: '🛌',
        description: 'Still feeling tired even after 7-8 hours of sleep',
        commonSupplements: ['Magnesium', 'Iron', 'Vitamin D', 'B12']
      },
      {
        id: 'exercise-fatigue',
        name: 'Exercise Fatigue',
        icon: '💪',
        description: 'Getting unusually tired during or after workouts',
        commonSupplements: ['Creatine', 'CoQ10', 'Iron', 'Electrolytes']
      }
    ]
  },

  'Sleep Issues': {
    icon: '🌙',
    color: '#8b5cf6',
    symptoms: [
      {
        id: 'poor-sleep',
        name: 'Can\'t Fall Asleep',
        icon: '😴',
        description: 'Difficulty falling asleep at bedtime',
        commonSupplements: ['Melatonin', 'Magnesium', 'L-Theanine', 'GABA']
      },
      {
        id: 'wake-up-tired',
        name: 'Wake Up Tired',
        icon: '⏰',
        description: 'Waking up feeling unrefreshed despite sleeping',
        commonSupplements: ['Magnesium', 'CoQ10', 'Iron', 'B12']
      },
      {
        id: 'racing-thoughts',
        name: 'Racing Thoughts at Bedtime',
        icon: '💭',
        description: 'Mind won\'t quiet down when trying to sleep',
        commonSupplements: ['L-Theanine', 'Magnesium', 'Passionflower', 'Melatonin']
      },
      {
        id: 'frequent-waking',
        name: 'Wake Up Often',
        icon: '🔄',
        description: 'Waking up multiple times during the night',
        commonSupplements: ['Magnesium', 'GABA', 'Melatonin', 'L-Glycine']
      }
    ]
  },

  'Mood & Mental Health': {
    icon: '🧠',
    color: '#ef4444',
    symptoms: [
      {
        id: 'stressed',
        name: 'Stressed Out',
        icon: '😰',
        description: 'Feeling overwhelmed and anxious frequently',
        commonSupplements: ['Magnesium', 'Ashwagandha', 'L-Theanine', 'B-Complex']
      },
      {
        id: 'anxiety',
        name: 'Social Anxiety',
        icon: '😬',
        description: 'Nervousness in social situations or public speaking',
        commonSupplements: ['L-Theanine', 'GABA', 'Passionflower', 'Magnesium']
      },
      {
        id: 'low-mood',
        name: 'Low Mood',
        icon: '😔',
        description: 'Feeling down or lacking motivation',
        commonSupplements: ['Vitamin D', 'Omega-3', 'SAMe', '5-HTP']
      },
      {
        id: 'mood-swings',
        name: 'Mood Swings',
        icon: '🎭',
        description: 'Unpredictable changes in mood throughout the day',
        commonSupplements: ['B-Complex', 'Magnesium', 'Omega-3', 'Rhodiola']
      },
      {
        id: 'irritability',
        name: 'Easily Irritated',
        icon: '😤',
        description: 'Getting annoyed or frustrated more easily than usual',
        commonSupplements: ['Magnesium', 'B6', 'L-Theanine', 'Rhodiola']
      }
    ]
  },

  'Brain Function & Focus': {
    icon: '🎯',
    color: '#10b981',
    symptoms: [
      {
        id: 'brain-fog',
        name: 'Brain Fog',
        icon: '🧠',
        description: 'Difficulty concentrating and mental clarity issues',
        commonSupplements: ['Omega-3', 'B12', 'Lion\'s Mane', 'Ginkgo Biloba']
      },
      {
        id: 'forgetfulness',
        name: 'Forgetfulness',
        icon: '🤔',
        description: 'Frequently forgetting names, appointments, or tasks',
        commonSupplements: ['Ginkgo Biloba', 'Phosphatidylserine', 'B12', 'Omega-3']
      },
      {
        id: 'focus-issues',
        name: 'Can\'t Focus',
        icon: '🎯',
        description: 'Difficulty maintaining attention on tasks',
        commonSupplements: ['L-Tyrosine', 'Rhodiola', 'B-Complex', 'Lion\'s Mane']
      },
      {
        id: 'mental-fatigue',
        name: 'Mental Fatigue',
        icon: '🧩',
        description: 'Brain feels tired after mental work',
        commonSupplements: ['Phosphatidylserine', 'CoQ10', 'B-Complex', 'Ginseng']
      }
    ]
  },

  'Digestion': {
    icon: '🤢',
    color: '#f59e0b',
    symptoms: [
      {
        id: 'poor-digestion',
        name: 'General Digestive Issues',
        icon: '🤢',
        description: 'Bloating, gas, or digestive discomfort',
        commonSupplements: ['Probiotics', 'Digestive Enzymes', 'Fiber', 'L-Glutamine']
      },
      {
        id: 'bloating',
        name: 'Bloating After Meals',
        icon: '🎈',
        description: 'Feeling bloated and uncomfortable after eating',
        commonSupplements: ['Digestive Enzymes', 'Probiotics', 'Ginger', 'Peppermint']
      },
      {
        id: 'acid-reflux',
        name: 'Acid Reflux/Heartburn',
        icon: '🔥',
        description: 'Heartburn or acid reflux symptoms',
        commonSupplements: ['DGL', 'Probiotics', 'Digestive Enzymes', 'Aloe Vera']
      },
      {
        id: 'constipation',
        name: 'Constipation',
        icon: '🚽',
        description: 'Difficulty with regular bowel movements',
        commonSupplements: ['Fiber', 'Probiotics', 'Magnesium', 'Psyllium Husk']
      },
      {
        id: 'food-sensitivities',
        name: 'Food Sensitivities',
        icon: '🥛',
        description: 'Reactions to certain foods (dairy, gluten, etc.)',
        commonSupplements: ['Digestive Enzymes', 'Probiotics', 'L-Glutamine', 'Quercetin']
      }
    ]
  },

  'Appetite & Weight': {
    icon: '🍽️',
    color: '#f97316',
    symptoms: [
      {
        id: 'hungry',
        name: 'Always Hungry',
        icon: '🍽️',
        description: 'Constant cravings and difficulty feeling satisfied',
        commonSupplements: ['Chromium', 'Fiber', 'Protein', 'Green Tea Extract']
      },
      {
        id: 'sugar-cravings',
        name: 'Sugar Cravings',
        icon: '🍰',
        description: 'Intense cravings for sweets and sugary foods',
        commonSupplements: ['Chromium', 'Gymnema Sylvestre', 'Alpha Lipoic Acid']
      },
      {
        id: 'slow-metabolism',
        name: 'Slow Metabolism',
        icon: '🐌',
        description: 'Difficulty losing weight despite diet and exercise',
        commonSupplements: ['Thyroid Support', 'Green Tea', 'L-Carnitine']
      },
      {
        id: 'late-night-eating',
        name: 'Late Night Eating',
        icon: '🌙',
        description: 'Uncontrollable urges to eat late at night',
        commonSupplements: ['5-HTP', 'Magnesium', 'Melatonin']
      }
    ]
  },

  'Aches & Pain': {
    icon: '💪',
    color: '#eab308',
    symptoms: [
      {
        id: 'joint-pain',
        name: 'Joint Pain',
        icon: '🦴',
        description: 'Aches and stiffness in joints',
        commonSupplements: ['Turmeric', 'Glucosamine', 'Omega-3', 'Collagen']
      },
      {
        id: 'back-pain',
        name: 'Back Pain',
        icon: '🔙',
        description: 'Chronic or recurring lower back pain',
        commonSupplements: ['Turmeric', 'Magnesium', 'Omega-3', 'Devil\'s Claw']
      },
      {
        id: 'headaches',
        name: 'Frequent Headaches',
        icon: '🤕',
        description: 'Regular tension headaches or migraines',
        commonSupplements: ['Magnesium', 'Riboflavin', 'CoQ10', 'Feverfew']
      },
      {
        id: 'muscle-cramps',
        name: 'Muscle Cramps',
        icon: '💪',
        description: 'Frequent muscle cramps or spasms',
        commonSupplements: ['Magnesium', 'Potassium', 'Calcium', 'Electrolytes']
      },
      {
        id: 'neck-shoulder-tension',
        name: 'Neck/Shoulder Tension',
        icon: '🤷',
        description: 'Chronic tension in neck and shoulder muscles',
        commonSupplements: ['Magnesium', 'Turmeric', 'B-Complex', 'MSM']
      }
    ]
  },

  'Immune System': {
    icon: '🛡️',
    color: '#06b6d4',
    symptoms: [
      {
        id: 'weak-immunity',
        name: 'Get Sick Often',
        icon: '🤧',
        description: 'Getting sick frequently or slow recovery',
        commonSupplements: ['Vitamin C', 'Zinc', 'Vitamin D', 'Elderberry']
      },
      {
        id: 'slow-healing',
        name: 'Slow Wound Healing',
        icon: '🩹',
        description: 'Cuts and bruises take longer than usual to heal',
        commonSupplements: ['Zinc', 'Vitamin C', 'Collagen', 'Vitamin E']
      },
      {
        id: 'seasonal-allergies',
        name: 'Seasonal Allergies',
        icon: '🌸',
        description: 'Sneezing, runny nose during allergy seasons',
        commonSupplements: ['Quercetin', 'Vitamin C', 'Stinging Nettle', 'NAC']
      },
      {
        id: 'cold-hands-feet',
        name: 'Cold Hands/Feet',
        icon: '🧊',
        description: 'Extremities are often cold even in warm weather',
        commonSupplements: ['Iron', 'B12', 'Ginkgo Biloba', 'Cayenne']
      }
    ]
  },

  'Skin & Beauty': {
    icon: '✨',
    color: '#ec4899',
    symptoms: [
      {
        id: 'dry-skin',
        name: 'Dry Skin',
        icon: '🧴',
        description: 'Skin feels dry, flaky, or lacking moisture',
        commonSupplements: ['Omega-3', 'Vitamin E', 'Collagen', 'Hyaluronic Acid']
      },
      {
        id: 'acne',
        name: 'Adult Acne',
        icon: '🔴',
        description: 'Persistent breakouts or acne as an adult',
        commonSupplements: ['Zinc', 'Omega-3', 'Probiotics', 'Vitamin A']
      },
      {
        id: 'hair-loss',
        name: 'Hair Thinning',
        icon: '💇',
        description: 'Noticing hair loss or thinning',
        commonSupplements: ['Biotin', 'Iron', 'Zinc', 'Collagen']
      },
      {
        id: 'brittle-nails',
        name: 'Brittle Nails',
        icon: '💅',
        description: 'Nails break easily or have ridges',
        commonSupplements: ['Biotin', 'Collagen', 'Iron', 'Silica']
      },
      {
        id: 'premature-aging',
        name: 'Premature Aging',
        icon: '👴',
        description: 'Fine lines, wrinkles appearing earlier than expected',
        commonSupplements: ['Collagen', 'Vitamin C', 'Resveratrol', 'CoQ10']
      },
      {
        id: 'dark-circles',
        name: 'Dark Under-Eye Circles',
        icon: '👁️',
        description: 'Persistent dark circles under the eyes',
        commonSupplements: ['Iron', 'Vitamin K', 'Vitamin C', 'B12']
      }
    ]
  },

  'Women\'s Health': {
    icon: '🌸',
    color: '#a855f7',
    symptoms: [
      {
        id: 'pms',
        name: 'PMS Symptoms',
        icon: '🌙',
        description: 'Mood swings, cramps, or bloating before periods',
        commonSupplements: ['Magnesium', 'B6', 'Evening Primrose Oil', 'Chasteberry']
      },
      {
        id: 'irregular-periods',
        name: 'Irregular Periods',
        icon: '📅',
        description: 'Unpredictable or irregular menstrual cycles',
        commonSupplements: ['Inositol', 'Spearmint', 'Vitex', 'Omega-3']
      },
      {
        id: 'low-libido',
        name: 'Low Libido',
        icon: '💕',
        description: 'Decreased interest in romantic intimacy',
        commonSupplements: ['Maca', 'Ginseng', 'Zinc', 'DHEA']
      },
      {
        id: 'hot-flashes',
        name: 'Hot Flashes',
        icon: '🔥',
        description: 'Sudden feelings of heat, often during menopause',
        commonSupplements: ['Black Cohosh', 'Red Clover', 'Soy Isoflavones', 'Evening Primrose']
      }
    ]
  },

  'Men\'s Health': {
    icon: '💪',
    color: '#3b82f6',
    symptoms: [
      {
        id: 'low-testosterone',
        name: 'Low Energy/Drive',
        icon: '⚡',
        description: 'Decreased energy, motivation, and overall vitality',
        commonSupplements: ['D-Aspartic Acid', 'Zinc', 'Vitamin D', 'Ashwagandha']
      },
      {
        id: 'male-pattern-baldness',
        name: 'Male Pattern Baldness',
        icon: '👨‍🦲',
        description: 'Hair thinning or receding hairline',
        commonSupplements: ['Saw Palmetto', 'Finasteride', 'Biotin', 'Pumpkin Seed Oil']
      },
      {
        id: 'muscle-loss',
        name: 'Muscle Loss',
        icon: '💪',
        description: 'Difficulty building or maintaining muscle mass',
        commonSupplements: ['Protein', 'Creatine', 'HMB', 'Testosterone Boosters']
      },
      {
        id: 'prostate-health',
        name: 'Prostate Concerns',
        icon: '🔵',
        description: 'Frequent urination or prostate health concerns',
        commonSupplements: ['Saw Palmetto', 'Lycopene', 'Beta-Sitosterol', 'Zinc']
      },
      {
        id: 'erectile-function',
        name: 'Performance Issues',
        icon: '❤️',
        description: 'Concerns with romantic performance or confidence',
        commonSupplements: ['L-Arginine', 'Ginseng', 'Horny Goat Weed', 'Citrulline']
      }
    ]
  },

  'Performance & Fitness': {
    icon: '🏆',
    color: '#f59e0b',
    symptoms: [
      {
        id: 'workout-recovery',
        name: 'Slow Workout Recovery',
        icon: '🏋️',
        description: 'Muscles stay sore longer after exercise',
        commonSupplements: ['Protein', 'Creatine', 'BCAAs', 'Tart Cherry']
      },
      {
        id: 'endurance',
        name: 'Low Endurance',
        icon: '🏃',
        description: 'Getting winded quickly during cardio activities',
        commonSupplements: ['Iron', 'CoQ10', 'Beetroot', 'Rhodiola']
      },
      {
        id: 'motivation',
        name: 'Lack of Motivation',
        icon: '🎯',
        description: 'Difficulty getting motivated for work or activities',
        commonSupplements: ['Tyrosine', 'Rhodiola', 'B-Complex', 'Ginseng']
      }
    ]
  }
};

export default function SymptomsPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [healthStreak, setHealthStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{ date: string, mood: string }>>([]);

  // Load data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load selected symptoms
      const saved = localStorage.getItem('selectedSymptoms');
      if (saved) {
        try {
          setSelectedSymptoms(JSON.parse(saved));
        } catch {
          setSelectedSymptoms([]);
        }
      } else {
        setShowQuickStart(true); // Show quick start for new users
      }

      // Load achievements and progress
      const savedAchievements = localStorage.getItem('healthAchievements');
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }

      const savedStreak = localStorage.getItem('healthStreak');
      if (savedStreak) {
        setHealthStreak(parseInt(savedStreak));
      }

      const savedProgress = localStorage.getItem('weeklyProgress');
      if (savedProgress) {
        setWeeklyProgress(JSON.parse(savedProgress));
      }
    }
  }, []);

  // Update smart suggestions when symptoms change
  useEffect(() => {
    const suggestions = getSmartSuggestions();
    setSmartSuggestions(suggestions);
  }, [selectedSymptoms]);

  // Save data when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedSymptoms', JSON.stringify(selectedSymptoms));
      localStorage.setItem('healthAchievements', JSON.stringify(achievements));
      localStorage.setItem('healthStreak', healthStreak.toString());
      localStorage.setItem('weeklyProgress', JSON.stringify(weeklyProgress));
    }
  }, [selectedSymptoms, achievements, healthStreak, weeklyProgress]);

  const toggleSymptom = (symptomData: SymptomData, categoryColor: string) => {
    const existingIndex = selectedSymptoms.findIndex(s => s.id === symptomData.id);

    if (existingIndex >= 0) {
      // Remove symptom
      setSelectedSymptoms(prev => prev.filter(s => s.id !== symptomData.id));
    } else {
      // Add symptom with default severity
      const newSymptom: SelectedSymptom = {
        ...symptomData,
        severity: 3, // Default to moderate
        dateAdded: new Date().toISOString()
      };
      setSelectedSymptoms(prev => [...prev, newSymptom]);

      // Check for achievements
      checkAchievements([...selectedSymptoms, newSymptom]);
    }
  };

  const updateSeverity = (symptomId: string, severity: number) => {
    setSelectedSymptoms(prev =>
      prev.map(s => (s.id === symptomId ? { ...s, severity } : s))
    );
  };

  const getSmartSuggestions = (): string[] => {
    const selectedIds = selectedSymptoms.map(s => s.id);
    const suggestions = new Set<string>();

    selectedIds.forEach(symptomId => {
      const related = SYMPTOM_RELATIONSHIPS[symptomId] || [];
      related.forEach(relatedId => {
        if (!selectedIds.includes(relatedId)) {
          suggestions.add(relatedId);
        }
      });
    });

    return Array.from(suggestions).slice(0, 3); // Top 3 suggestions
  };

  const addSuggestedSymptom = (symptomId: string) => {
    // Find the symptom in categories
    let foundSymptom: SymptomData | null = null;
    Object.values(SYMPTOM_CATEGORIES).forEach(category => {
      const symptom = category.symptoms.find(s => s.id === symptomId);
      if (symptom) foundSymptom = symptom;
    });

    if (foundSymptom) {
      toggleSymptom(foundSymptom, '#10b981');
    }
  };

  const checkAchievements = (symptoms: SelectedSymptom[]) => {
    const newAchievements = [...achievements];

    if (symptoms.length >= 1 && !achievements.includes('first-symptom')) {
      newAchievements.push('first-symptom');
    }
    if (symptoms.length >= 5 && !achievements.includes('health-tracker')) {
      newAchievements.push('health-tracker');
    }
    if (symptoms.length >= 10 && !achievements.includes('symptom-expert')) {
      newAchievements.push('symptom-expert');
    }

    if (newAchievements.length > achievements.length) {
      setAchievements(newAchievements);
      setHealthStreak(prev => prev + 1);
    }
  };

  const getPersonalizedInsights = () => {
    const insights = [];
    const selectedIds = selectedSymptoms.map(s => s.id);

    if (selectedIds.includes('tired') && selectedIds.includes('poor-sleep')) {
      insights.push({
        type: 'connection',
        title: 'Sleep-Energy Connection',
        content: 'Your fatigue and sleep issues are likely connected. Magnesium can help with both sleep quality and energy levels.',
        icon: '🔗'
      });
    }

    if (selectedIds.includes('stressed') && selectedIds.includes('headaches')) {
      insights.push({
        type: 'pattern',
        title: 'Stress Pattern Detected',
        content: 'Stress often manifests as physical tension. Consider stress management alongside targeted supplements.',
        icon: '🎯'
      });
    }

    if (selectedIds.includes('brain-fog') && selectedIds.includes('tired')) {
      insights.push({
        type: 'tip',
        title: 'Cognitive Energy Support',
        content: 'Brain fog and fatigue often share root causes. B-Complex vitamins support both mental clarity and energy production.',
        icon: '🧠'
      });
    }

    return insights;
  };

  const getInteractionWarnings = () => {
    const supplements = [];
    selectedSymptoms.forEach(symptom => {
      supplements.push(...symptom.commonSupplements);
    });

    const warnings = [];
    if (supplements.includes('Iron') && supplements.includes('Zinc')) {
      warnings.push({
        warning: 'Iron and Zinc should be taken at different times for optimal absorption',
        type: 'timing'
      });
    }
    if (supplements.includes('Magnesium') && supplements.includes('Calcium')) {
      warnings.push({
        warning: 'Take Magnesium and Calcium separately or in a 1:2 ratio for best results',
        type: 'ratio'
      });
    }

    return warnings;
  };

  const getRecommendations = () => {
    const allSupplements: string[] = [];
    const supplementScores: Record<string, number> = {};

    // Weight supplements by severity
    selectedSymptoms.forEach(symptom => {
      const weight = symptom.severity / 5; // Convert severity to weight (0.2 to 1.0)
      symptom.commonSupplements.forEach(supp => {
        supplementScores[supp] = (supplementScores[supp] || 0) + weight;
      });
    });

    return Object.entries(supplementScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, score], idx) => {
        let priority: 'most' | 'high' | 'may' | 'low';
        if (idx < 2) priority = 'most';
        else if (idx < 4) priority = 'high';
        else if (idx < 6) priority = 'may';
        else priority = 'low';
        return { name, score: Math.round(score * 10) / 10, priority };
      });
  };

  const getFilteredCategories = () => {
    if (!searchTerm) return SYMPTOM_CATEGORIES;

    const filtered: any = {};
    Object.entries(SYMPTOM_CATEGORIES).forEach(([categoryName, category]) => {
      const matchingSymptoms = category.symptoms.filter(symptom =>
        symptom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symptom.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matchingSymptoms.length > 0) {
        filtered[categoryName] = {
          ...category,
          symptoms: matchingSymptoms
        };
      }
    });

    return filtered;
  };

  const filteredCategories = getFilteredCategories();
  const insights = getPersonalizedInsights();
  const warnings = getInteractionWarnings();
  const recommendations = getRecommendations();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: '16px',
        paddingBottom: '100px'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Back Button */}
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
              ← Back to Scanner
            </Link>
          </div>

          {/* Health Streak and Achievements */}
          {healthStreak > 0 && (
            <div
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔥 {healthStreak} Day Health Streak!
            </div>
          )}

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              margin: '0 0 16px',
              background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            🩺 Symptom Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', margin: 0 }}>
            Select the symptoms you're experiencing to get personalized supplement recommendations
          </p>
        </div>

        {/* Achievement Badges */}
        {achievements.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '32px',
              flexWrap: 'wrap'
            }}
          >
            {achievements.includes('first-symptom') && (
              <div style={{ textAlign: 'center', opacity: 0.9 }}>
                <div style={{ fontSize: '24px' }}>🎯</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>First Step</div>
              </div>
            )}
            {achievements.includes('health-tracker') && (
              <div style={{ textAlign: 'center', opacity: 0.9 }}>
                <div style={{ fontSize: '24px' }}>📊</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Health Tracker</div>
              </div>
            )}
            {achievements.includes('symptom-expert') && (
              <div style={{ textAlign: 'center', opacity: 0.9 }}>
                <div style={{ fontSize: '24px' }}>🏆</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Symptom Expert</div>
              </div>
            )}
          </div>
        )}

        {/* Selected Symptoms Summary */}
        {selectedSymptoms.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              marginBottom: '32px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--accent)',
                  margin: 0
                }}
              >
                Selected Symptoms ({selectedSymptoms.length})
              </h3>
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {showRecommendations ? 'Hide' : 'Show'} Recommendations
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              {selectedSymptoms.map(symptom => (
                <div
                  key={symptom.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    position: 'relative'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{symptom.icon}</span>
                  <span>{symptom.name}</span>
                  {/* Severity indicator */}
                  <div style={{ marginLeft: '8px', display: 'flex', gap: '2px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: i < symptom.severity ? 'var(--accent)' : 'rgba(255,255,255,0.3)'
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => toggleSymptom(symptom, '#ef4444')}
                    style={{
                      marginLeft: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showRecommendations && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <h4
                  style={{
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: 'var(--accent2)',
                    fontSize: '1rem'
                  }}
                >
                  🎯 Personalized Supplement Recommendations:
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {recommendations.map(({ name, score, priority }) => (
                    <div
                      key={name}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                        border:
                          priority === 'most' || priority === 'high'
                            ? '2px solid var(--accent)'
                            : '1px solid transparent'
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {priority === 'most'
                          ? 'Most helpful'
                          : priority === 'high'
                          ? 'High potential'
                          : priority === 'may'
                          ? 'May help'
                          : 'Lower priority'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tolerability tips based on your selections */}
                <Watchouts
                 selected={(selectedSymptoms ?? [])
                   .map(s => s?.id)
                   .filter((x): x is string => typeof x === 'string' && x.length > 0)}
                 recs={(recommendations ?? [])
                   .filter(r => r && typeof r.name === 'string')}
                />

                {/* 2-week guided programs with evidence badges */}
                <ProgramSuggestions
                 selected={(selectedSymptoms ?? [])
                   .map(s => s?.id)
                   .filter((x): x is string => typeof x === 'string' && x.length > 0)}
                 recs={(recommendations ?? [])
                   .filter(r => r && typeof r.name === 'string')}
                />
              </div>
            )}

            {/* Interaction Warnings */}
            {warnings.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                <h5 style={{ margin: '0 0 8px', color: '#fbbf24' }}>
                  ⚠️ Supplement Interaction Warnings:
                </h5>
                {warnings.map((warning, i) => (
                  <div
                    key={i}
                    style={{ fontSize: '13px', color: '#fbbf24', marginBottom: '4px' }}
                  >
                    • {warning.warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              marginBottom: '32px'
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#10b981',
                margin: '0 0 12px'
              }}
            >
              💡 You might also experience:
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {smartSuggestions.map(suggestionId => {
                // Find the symptom details
                let foundSymptom: SymptomData | null = null;
                Object.values(SYMPTOM_CATEGORIES).forEach(category => {
                  const symptom = category.symptoms.find(s => s.id === suggestionId);
                  if (symptom) foundSymptom = symptom;
                });

                if (!foundSymptom) return null;

                return (
                  <button
                    key={suggestionId}
                    onClick={() => addSuggestedSymptom(suggestionId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <span>{foundSymptom.icon}</span>
                    <span>{foundSymptom.name}</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>+</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Personalized Insights */}
        {insights.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: 'var(--accent2)'
              }}
            >
              🧠 Personalized Insights
            </h3>
            {insights.map(insight => (
              <div
                key={insight.title}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <h4
                  style={{
                    margin: '0 0 8px',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{insight.icon}</span>
                  {insight.title}
                </h4>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                  {insight.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '40px' }}
            />
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)'
              }}
            >
              🔍
            </div>
          </div>
        </div>

        {/* Organized Category Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(filteredCategories).map(([categoryName, category]) => (
            <div key={categoryName}>
              {/* Category Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: `2px solid ${category.color}20`
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: 0,
                    color: category.color
                  }}
                >
                  {categoryName}
                </h2>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--muted)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {category.symptoms.length} symptoms
                </span>
              </div>

              {/* Category Symptoms Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px'
                }}
              >
                {category.symptoms.map(symptom => {
                  const selectedSymptom = selectedSymptoms.find(s => s.id === symptom.id);
                  const isSelected = !!selectedSymptom;

                  return (
                    <div
                      key={symptom.id}
                      style={{
                        background: 'var(--surface)',
                        border: `2px solid ${isSelected ? category.color : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: isSelected ? `0 4px 20px ${category.color}40` : 'none'
                      }}
                    >
                      <div
                        onClick={() => toggleSymptom(symptom, category.color)}
                        style={{ marginBottom: isSelected ? '12px' : '0' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                              {symptom.icon}
                            </span>
                            <h3 style={{ fontWeight: '600', fontSize: '1rem', margin: 0 }}>
                              {symptom.name}
                            </h3>
                          </div>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? category.color : 'var(--border)'}`,
                              background: isSelected ? category.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? 'white' : 'transparent',
                              fontSize: '12px'
                            }}
                          >
                            ✓
                          </div>
                        </div>

                        <p
                          style={{
                            color: 'var(--muted)',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            marginBottom: '12px'
                          }}
                        >
                          {symptom.description}
                        </p>

                        <div>
                          <p
                            style={{
                              fontSize: '11px',
                              color: 'var(--muted)',
                              marginBottom: '6px'
                            }}
                          >
                            Common supplements:
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {symptom.commonSupplements.slice(0, 3).map(supp => (
                              <span
                                key={supp}
                                style={{
                                  fontSize: '10px',
                                  background: `${category.color}20`,
                                  color: category.color,
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  fontWeight: '500'
                                }}
                              >
                                {supp}
                              </span>
                            ))}
                            {symptom.commonSupplements.length > 3 && (
                              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                +{symptom.commonSupplements.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Severity Slider */}
                      {isSelected && selectedSymptom && (
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px'
                          }}
                        >
                          <label
                            style={{
                              fontSize: '12px',
                              color: 'var(--muted)',
                              marginBottom: '8px',
                              display: 'block'
                            }}
                          >
                            How much does this affect you?
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={selectedSymptom.severity}
                            onChange={(e) => updateSeverity(symptom.id, parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              marginBottom: '6px',
                              accentColor: category.color
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '10px',
                              color: 'var(--muted)'
                            }}
                          >
                            <span>Mild</span>
                            <span>Moderate</span>
                            <span>Severe</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Instructions */}
        <div
          style={{
            marginTop: '48px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px'
          }}
        >
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '16px',
              color: 'var(--accent2)'
            }}
          >
            📱 How It Works
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>1️⃣</div>
              <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Browse Categories</h4>
              <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                Look through organized symptom categories to find what applies to you
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>2️⃣</div>
              <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Rate Severity</h4>
              <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                Use sliders to indicate how much each symptom affects you
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>3️⃣</div>
              <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Get Smart Recommendations</h4>
              <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
                Receive personalized supplement suggestions and insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {selectedSymptoms.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--surface)',
            padding: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '12px',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => setShowRecommendations(true)}
            style={{
              flex: 1,
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            View Recommendations ({recommendations.length})
          </button>
          <Link
            href="/"
            style={{
              flex: 1,
              background: 'var(--accent2)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '500',
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Start Scanning
          </Link>
        </div>
      )}
    </div>
  );
}
