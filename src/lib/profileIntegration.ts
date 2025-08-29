// src/lib/profileIntegration.ts
"use client";
import { UserProfile } from './userProfile';

export interface PersonalizedAnalysis {
  goalAlignment: {
    primaryMatches: string[];
    secondaryMatches: string[];
    relevanceScore: number;
  };
  dosageRecommendations: {
    adjustmentReason: string;
    recommendedDosage: string;
    timing: string;
    withFood: boolean;
  }[];
  riskAssessment: {
    medicationInteractions: string[];
    allergyWarnings: string[];
    conditionConsiderations: string[];
    safetyScore: number;
  };
  lifestyleCompatibility: {
    dietaryCompatibility: boolean;
    formPreference: boolean;
    budgetFit: boolean;
    activityLevelMatch: boolean;
  };
  personalizedMessage: string;
}

export class ProfileIntegration {
  static analyzeSupplementForUser(
    supplementData: {
      name?: string;
      ingredients?: string[];
      keyIngredient?: string;
      brand?: string;
      form?: string;
      price?: number;
    },
    userProfile: UserProfile
  ): PersonalizedAnalysis {
    const goalAlignment = this.analyzeGoalAlignment(supplementData, userProfile);
    const dosageRecommendations = this.generateDosageRecommendations(supplementData, userProfile);
    const riskAssessment = this.assessRisks(supplementData, userProfile);
    const lifestyleCompatibility = this.checkLifestyleCompatibility(supplementData, userProfile);
    const personalizedMessage = this.generatePersonalizedMessage(
      supplementData,
      userProfile,
      goalAlignment,
      riskAssessment
    );

    return {
      goalAlignment,
      dosageRecommendations,
      riskAssessment,
      lifestyleCompatibility,
      personalizedMessage
    };
  }

  private static analyzeGoalAlignment(
    supplementData: { name?: string; ingredients?: string[]; keyIngredient?: string },
    userProfile: UserProfile
  ) {
    const primaryMatches: string[] = [];
    const secondaryMatches: string[] = [];
    
    const supplementName = supplementData.name?.toLowerCase() || '';
    const ingredients = supplementData.ingredients?.map(i => i.toLowerCase()) || [];
    const keyIngredient = supplementData.keyIngredient?.toLowerCase() || '';
    
    // Goal-based matching logic
    userProfile.primaryGoals.forEach(goal => {
      switch (goal) {
        case 'weight-loss':
          if (this.matchesIngredients(['green tea', 'caffeine', 'l-carnitine', 'garcinia'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports weight management goals');
          }
          break;
        case 'muscle-gain':
          if (this.matchesIngredients(['protein', 'creatine', 'amino acid', 'bcaa'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports muscle development goals');
          }
          break;
        case 'energy':
          if (this.matchesIngredients(['b complex', 'coq10', 'iron', 'caffeine'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports energy and vitality goals');
          }
          break;
        case 'immunity':
          if (this.matchesIngredients(['vitamin c', 'zinc', 'elderberry', 'vitamin d'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports immune system goals');
          }
          break;
        case 'sleep':
          if (this.matchesIngredients(['melatonin', 'magnesium', 'l-theanine', 'valerian'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports better sleep goals');
          }
          break;
        case 'stress':
          if (this.matchesIngredients(['ashwagandha', 'magnesium', 'l-theanine', 'rhodiola'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports stress management goals');
          }
          break;
        case 'heart-health':
          if (this.matchesIngredients(['omega-3', 'coq10', 'magnesium', 'hawthorn'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports cardiovascular health goals');
          }
          break;
        case 'brain-health':
          if (this.matchesIngredients(['omega-3', 'ginkgo', 'phosphatidylserine', 'lion\'s mane'], supplementName, ingredients, keyIngredient)) {
            primaryMatches.push('Supports cognitive health goals');
          }
          break;
      }
    });

    // Secondary goal matching
    userProfile.secondaryGoals.forEach(goal => {
      switch (goal) {
        case 'digestion':
          if (this.matchesIngredients(['probiotic', 'digestive enzyme', 'fiber', 'ginger'], supplementName, ingredients, keyIngredient)) {
            secondaryMatches.push('May support digestive health');
          }
          break;
        case 'skin-health':
          if (this.matchesIngredients(['collagen', 'vitamin c', 'vitamin e', 'biotin'], supplementName, ingredients, keyIngredient)) {
            secondaryMatches.push('May support skin health');
          }
          break;
        case 'joint-health':
          if (this.matchesIngredients(['glucosamine', 'chondroitin', 'turmeric', 'omega-3'], supplementName, ingredients, keyIngredient)) {
            secondaryMatches.push('May support joint health');
          }
          break;
      }
    });

    const relevanceScore = Math.min(100, (primaryMatches.length * 30) + (secondaryMatches.length * 15));

    return {
      primaryMatches,
      secondaryMatches,
      relevanceScore
    };
  }

  private static matchesIngredients(
    targetIngredients: string[],
    supplementName: string,
    ingredients: string[],
    keyIngredient: string
  ): boolean {
    const allText = [supplementName, ...ingredients, keyIngredient].join(' ').toLowerCase();
    return targetIngredients.some(target => allText.includes(target));
  }

  private static generateDosageRecommendations(
    supplementData: { name?: string; keyIngredient?: string },
    userProfile: UserProfile
  ) {
    const recommendations: PersonalizedAnalysis['dosageRecommendations'] = [];
    const age = this.calculateAge(userProfile.dateOfBirth);
    
    // Age-based adjustments
    if (age && age > 65) {
      recommendations.push({
        adjustmentReason: 'Senior dosage consideration',
        recommendedDosage: 'Start with lower doses and monitor response',
        timing: 'Morning with breakfast',
        withFood: true
      });
    } else if (age && age < 25) {
      recommendations.push({
        adjustmentReason: 'Young adult considerations',
        recommendedDosage: 'Follow standard dosing guidelines',
        timing: 'With meals',
        withFood: true
      });
    }

    // Activity level adjustments
    if (userProfile.activityLevel === 'very-active') {
      recommendations.push({
        adjustmentReason: 'High activity level',
        recommendedDosage: 'May benefit from higher dosages for recovery',
        timing: 'Post-workout and with meals',
        withFood: true
      });
    }

    // Weight-based adjustments
    if (userProfile.weight > 90) {
      recommendations.push({
        adjustmentReason: 'Body weight consideration',
        recommendedDosage: 'May require higher end of dosage range',
        timing: 'Divided doses with meals',
        withFood: true
      });
    }

    return recommendations;
  }

  private static assessRisks(
    supplementData: { ingredients?: string[]; name?: string },
    userProfile: UserProfile
  ) {
    const medicationInteractions: string[] = [];
    const allergyWarnings: string[] = [];
    const conditionConsiderations: string[] = [];
    
    const allIngredients = [
      ...(supplementData.ingredients || []),
      supplementData.name || ''
    ].join(' ').toLowerCase();

    // Check medication interactions
    userProfile.currentMedications.forEach(medication => {
      const medLower = medication.toLowerCase();
      
      if (medLower.includes('warfarin') || medLower.includes('blood thinner')) {
        if (allIngredients.includes('vitamin k') || allIngredients.includes('omega-3')) {
          medicationInteractions.push(`May interact with ${medication} - consult healthcare provider`);
        }
      }
      
      if (medLower.includes('diabetes') || medLower.includes('metformin')) {
        if (allIngredients.includes('chromium') || allIngredients.includes('cinnamon')) {
          medicationInteractions.push(`May affect blood sugar - monitor closely with ${medication}`);
        }
      }
      
      if (medLower.includes('thyroid') || medLower.includes('levothyroxine')) {
        if (allIngredients.includes('iodine') || allIngredients.includes('kelp')) {
          medicationInteractions.push(`May interact with thyroid medication - take at different times`);
        }
      }
    });

    // Check allergies
    userProfile.allergies.forEach(allergy => {
      const allergyLower = allergy.toLowerCase();
      
      if (allergyLower.includes('shellfish') && allIngredients.includes('chitosan')) {
        allergyWarnings.push(`Contains shellfish-derived ingredients - avoid due to ${allergy} allergy`);
      }
      
      if (allergyLower.includes('soy') && allIngredients.includes('soy')) {
        allergyWarnings.push(`Contains soy - avoid due to ${allergy} allergy`);
      }
      
      if (allergyLower.includes('dairy') && (allIngredients.includes('whey') || allIngredients.includes('casein'))) {
        allergyWarnings.push(`Contains dairy proteins - avoid due to ${allergy} allergy`);
      }
    });

    // Check medical conditions
    userProfile.medicalConditions.forEach(condition => {
      const conditionLower = condition.toLowerCase();
      
      if (conditionLower.includes('high blood pressure')) {
        if (allIngredients.includes('licorice') || allIngredients.includes('ephedra')) {
          conditionConsiderations.push(`May raise blood pressure - caution with ${condition}`);
        }
      }
      
      if (conditionLower.includes('diabetes')) {
        if (allIngredients.includes('chromium') || allIngredients.includes('cinnamon')) {
          conditionConsiderations.push(`May affect blood sugar - monitor closely with ${condition}`);
        }
      }
      
      if (conditionLower.includes('kidney')) {
        if (allIngredients.includes('protein') || allIngredients.includes('creatine')) {
          conditionConsiderations.push(`High protein supplements may stress kidneys - consult doctor regarding ${condition}`);
        }
      }
    });

    // Calculate safety score
    let safetyScore = 100;
    safetyScore -= medicationInteractions.length * 25;
    safetyScore -= allergyWarnings.length * 30;
    safetyScore -= conditionConsiderations.length * 15;
    safetyScore = Math.max(0, safetyScore);

    return {
      medicationInteractions,
      allergyWarnings,
      conditionConsiderations,
      safetyScore
    };
  }

  private static checkLifestyleCompatibility(
    supplementData: { form?: string; price?: number },
    userProfile: UserProfile
  ) {
    const dietaryCompatibility = this.checkDietaryCompatibility(supplementData, userProfile);
    const formPreference = userProfile.preferredForms.length === 0 || 
      userProfile.preferredForms.includes(supplementData.form?.toLowerCase() || '');
    
    const budgetFit = this.checkBudgetFit(supplementData.price, userProfile.budgetRange);
    const activityLevelMatch = true; // Most supplements are compatible with all activity levels

    return {
      dietaryCompatibility,
      formPreference,
      budgetFit,
      activityLevelMatch
    };
  }

  private static checkDietaryCompatibility(supplementData: any, userProfile: UserProfile): boolean {
    // Check if supplement is compatible with dietary restrictions
    const restrictions = userProfile.dietaryRestrictions;
    
    if (restrictions.includes('Vegan')) {
      // Check for non-vegan ingredients (this would need more sophisticated ingredient analysis)
      return true; // Simplified for now
    }
    
    if (restrictions.includes('Gluten-Free')) {
      // Check for gluten-containing ingredients
      return true; // Simplified for now
    }
    
    return true;
  }

  private static checkBudgetFit(price?: number, budgetRange?: string): boolean {
    if (!price || !budgetRange) return true;
    
    const monthlyPrice = price; // Assuming price is monthly
    
    switch (budgetRange) {
      case 'budget':
        return monthlyPrice <= 30;
      case 'mid-range':
        return monthlyPrice <= 70;
      case 'premium':
        return true; // No upper limit for premium
      default:
        return true;
    }
  }

  private static generatePersonalizedMessage(
    supplementData: { name?: string },
    userProfile: UserProfile,
    goalAlignment: PersonalizedAnalysis['goalAlignment'],
    riskAssessment: PersonalizedAnalysis['riskAssessment']
  ): string {
    const messages: string[] = [];
    
    if (goalAlignment.primaryMatches.length > 0) {
      messages.push(`✅ Great match for your goals: ${goalAlignment.primaryMatches[0]}`);
    }
    
    if (riskAssessment.safetyScore >= 80) {
      messages.push(`🛡️ Appears safe based on your health profile`);
    } else if (riskAssessment.medicationInteractions.length > 0) {
      messages.push(`⚠️ Potential medication interactions detected - consult your doctor`);
    }
    
    if (goalAlignment.relevanceScore >= 60) {
      messages.push(`🎯 ${goalAlignment.relevanceScore}% relevance to your health goals`);
    }
    
    const age = this.calculateAge(userProfile.dateOfBirth);
    if (age && age > 50) {
      messages.push(`👨‍⚕️ Consider discussing with your healthcare provider given your age group`);
    }
    
    return messages.join(' • ') || `Based on your profile, here's what you should know about this supplement.`;
  }

  private static calculateAge(dateOfBirth: string): number | null {
    if (!dateOfBirth) return null;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

// Helper function for components to use
export const getPersonalizedAnalysis = (
  supplementData: any,
  userProfile: UserProfile | null
): PersonalizedAnalysis | null => {
  if (!userProfile) return null;
  return ProfileIntegration.analyzeSupplementForUser(supplementData, userProfile);
};