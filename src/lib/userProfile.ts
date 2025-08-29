// src/lib/userProfile.ts
"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  // Basic Info
  id: string;
  name: string;
  email?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
  
  // Physical Health
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  
  // Health Goals
  primaryGoals: string[]; // e.g., ['weight-loss', 'muscle-gain', 'energy', 'immunity']
  secondaryGoals: string[];
  
  // Health History
  medicalConditions: string[];
  currentMedications: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  
  // Lifestyle
  sleepHours: number;
  stressLevel: number; // 1-10 scale
  smokingStatus: 'never' | 'former' | 'current';
  alcoholConsumption: 'none' | 'light' | 'moderate' | 'heavy';
  
  // Supplement Preferences
  preferredForms: string[]; // e.g., ['capsule', 'tablet', 'powder', 'gummy']
  budgetRange: 'budget' | 'mid-range' | 'premium';
  brandPreferences: string[];
  
  // Tracking Preferences
  trackingEnabled: boolean;
  reminderSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:MM format
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProfileState {
  profile: UserProfile | null;
  isComplete: boolean;
  currentStep: number;
  
  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  setCurrentStep: (step: number) => void;
  completeProfile: () => void;
  
  // Computed getters
  getAge: () => number | null;
  getBMI: () => number | null;
  getHealthScore: () => number;
  getPersonalizedRecommendations: () => string[];
}

const DEFAULT_PROFILE: Partial<UserProfile> = {
  primaryGoals: [],
  secondaryGoals: [],
  medicalConditions: [],
  currentMedications: [],
  allergies: [],
  dietaryRestrictions: [],
  preferredForms: [],
  brandPreferences: [],
  sleepHours: 8,
  stressLevel: 5,
  trackingEnabled: true,
  reminderSettings: {
    enabled: true,
    frequency: 'daily',
    time: '09:00'
  }
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isComplete: false,
      currentStep: 1,

      setProfile: (profileData) => {
        const now = new Date().toISOString();
        const profile: UserProfile = {
          ...DEFAULT_PROFILE,
          ...profileData,
          id: profileData.id || `user_${Date.now()}`,
          createdAt: profileData.createdAt || now,
          updatedAt: now,
        } as UserProfile;
        
        set({ profile, updatedAt: now });
      },

      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;
        
        const updatedProfile = {
          ...currentProfile,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        set({ profile: updatedProfile });
      },

      clearProfile: () => {
        set({ profile: null, isComplete: false, currentStep: 1 });
      },

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      completeProfile: () => {
        set({ isComplete: true });
      },

      getAge: () => {
        const profile = get().profile;
        if (!profile?.dateOfBirth) return null;
        
        const birthDate = new Date(profile.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      },

      getBMI: () => {
        const profile = get().profile;
        if (!profile?.height || !profile?.weight) return null;
        
        const heightInMeters = profile.height / 100;
        return profile.weight / (heightInMeters * heightInMeters);
      },

      getHealthScore: () => {
        const profile = get().profile;
        if (!profile) return 0;
        
        let score = 50; // Base score
        
        // Activity level scoring
        const activityScores = {
          'sedentary': -10,
          'light': 0,
          'moderate': 10,
          'active': 15,
          'very-active': 20
        };
        score += activityScores[profile.activityLevel] || 0;
        
        // Sleep scoring
        if (profile.sleepHours >= 7 && profile.sleepHours <= 9) {
          score += 15;
        } else {
          score -= 10;
        }
        
        // Stress level (inverted - lower stress is better)
        score += (10 - profile.stressLevel) * 2;
        
        // Lifestyle factors
        if (profile.smokingStatus === 'never') score += 10;
        else if (profile.smokingStatus === 'current') score -= 20;
        
        if (profile.alcoholConsumption === 'none' || profile.alcoholConsumption === 'light') {
          score += 5;
        } else if (profile.alcoholConsumption === 'heavy') {
          score -= 15;
        }
        
        // Medical conditions impact
        score -= profile.medicalConditions.length * 5;
        
        return Math.max(0, Math.min(100, score));
      },

      getPersonalizedRecommendations: () => {
        const profile = get().profile;
        if (!profile) return [];
        
        const recommendations: string[] = [];
        const age = get().getAge();
        const bmi = get().getBMI();
        
        // Age-based recommendations
        if (age && age > 50) {
          recommendations.push('Consider Vitamin D and B12 supplements');
          recommendations.push('Focus on bone health with Calcium and Magnesium');
        }
        
        if (age && age < 30) {
          recommendations.push('Focus on foundational nutrients like Multivitamin');
        }
        
        // BMI-based recommendations
        if (bmi && bmi > 25) {
          recommendations.push('Consider metabolism support supplements');
        }
        
        // Goal-based recommendations
        if (profile.primaryGoals.includes('weight-loss')) {
          recommendations.push('Green tea extract and L-Carnitine may support weight management');
        }
        
        if (profile.primaryGoals.includes('muscle-gain')) {
          recommendations.push('Protein powder and Creatine for muscle development');
        }
        
        if (profile.primaryGoals.includes('energy')) {
          recommendations.push('B-Complex vitamins and CoQ10 for energy support');
        }
        
        if (profile.primaryGoals.includes('immunity')) {
          recommendations.push('Vitamin C, Zinc, and Elderberry for immune support');
        }
        
        // Lifestyle-based recommendations
        if (profile.stressLevel > 7) {
          recommendations.push('Magnesium and Ashwagandha for stress management');
        }
        
        if (profile.sleepHours < 7) {
          recommendations.push('Melatonin and L-Theanine for better sleep');
        }
        
        if (profile.activityLevel === 'very-active') {
          recommendations.push('Electrolytes and recovery supplements post-workout');
        }
        
        return recommendations.slice(0, 8); // Limit to top 8 recommendations
      },
    }),
    {
      name: 'user-profile-storage',
      partialize: (state) => ({
        profile: state.profile,
        isComplete: state.isComplete,
        currentStep: state.currentStep,
      }),
    }
  )
);