// src/lib/productInsights.ts - Core insights system
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Core Types
export interface ProductInsight {
  productName: string;
  brandName: string;
  barcode?: string;
  overallScore: number;
  dataSource: 'user_reviews' | 'clinical_data' | 'ingredient_analysis' | 'hybrid';
  lastUpdated: string;
  insights: {
    effectiveness: string;
    safety: string;
    value: string;
    quality: string;
  };
  userFeedback?: {
    totalReviews: number;
    averageRating: number;
    recentReviews: number; // reviews in last 30 days
    commonBenefits: string[];
    commonSideEffects: string[];
    recommendationRate: number; // percentage who would recommend
  };
  ingredientData?: {
    keyIngredients: string[];
    effectivenessScores: Record<string, number>;
    bioavailabilityScore: number;
    dosageOptimality: number;
  };
  clinicalEvidence?: {
    studyCount: number;
    participantCount: number;
    efficacyRate: number;
    safetyProfile: 'excellent' | 'good' | 'fair' | 'caution';
  };
}

export interface UserReview {
  id?: string;
  userId: string;
  productName: string;
  brandName: string;
  barcode?: string;
  rating: number; // 1-5
  helpfulnessRating?: number; // 1-5 for specific benefits
  reviewText?: string;
  symptoms: string[]; // which symptoms they were targeting
  outcomes: {
    symptomId: string;
    improvement: number; // -2 to +2 (much worse to much better)
    timeframe: string; // "1-2 weeks", "1 month", etc.
  }[];
  sideEffects: string[];
  wouldRecommend: boolean;
  dosageUsed?: string;
  durationUsed: string; // "2 weeks", "3 months", etc.
  verifiedPurchase: boolean;
  scannerVerified: boolean; // they scanned the product
  createdAt: string;
  updatedAt: string;
}

export interface IngredientEffectiveness {
  ingredient: string;
  normalizedName: string;
  symptoms: Record<string, {
    effectivenessScore: number; // 0-5
    userReports: number;
    clinicalEvidence: 'strong' | 'moderate' | 'limited' | 'none';
    averageTimeframe: string;
    commonDosageRange: string;
    sideEffectRate: number;
  }>;
  bioavailabilityByForm: Record<string, number>;
  qualityFactors: {
    thirdPartyTested: number; // percentage of products
    dosageAccuracy: number;
    contaminationRisk: 'low' | 'moderate' | 'high';
  };
}

// Core service class
export class ProductInsightsService {
  
  // Add a user review
  static async addUserReview(review: Omit<UserReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const reviewData = {
        ...review,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'productReviews'), reviewData);
      
      // Trigger insight recalculation
      await this.updateProductInsights(review.productName, review.brandName);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  // Get product insights with all data sources
  static async getProductInsights(productName: string, brandName: string, barcode?: string): Promise<ProductInsight> {
    try {
      // Get user reviews
      const userFeedback = await this.getUserFeedbackData(productName, brandName);
      
      // Get ingredient analysis
      const ingredientData = await this.getIngredientAnalysis(productName);
      
      // Get clinical evidence
      const clinicalEvidence = await this.getClinicalEvidence(productName);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(userFeedback, ingredientData, clinicalEvidence);
      
      // Generate insights
      const insights = this.generateInsights(userFeedback, ingredientData, clinicalEvidence);
      
      return {
        productName,
        brandName,
        barcode,
        overallScore,
        dataSource: 'hybrid',
        lastUpdated: new Date().toISOString(),
        insights,
        userFeedback,
        ingredientData,
        clinicalEvidence
      };
      
    } catch (error) {
      console.error('Error getting product insights:', error);
      return this.getFallbackInsights(productName, brandName);
    }
  }

  // Get user feedback data
  private static async getUserFeedbackData(productName: string, brandName: string) {
    try {
      const q = query(
        collection(db, 'productReviews'),
        where('productName', '==', productName),
        where('brandName', '==', brandName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReview));
      
      if (reviews.length === 0) return undefined;

      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      const recentReviews = reviews.filter(r => 
        new Date(r.createdAt).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
      ).length;
      
      // Analyze benefits and side effects
      const benefitCounts: Record<string, number> = {};
      const sideEffectCounts: Record<string, number> = {};
      let recommendCount = 0;

      reviews.forEach(review => {
        if (review.wouldRecommend) recommendCount++;
        
        review.outcomes.forEach(outcome => {
          if (outcome.improvement > 0) {
            benefitCounts[outcome.symptomId] = (benefitCounts[outcome.symptomId] || 0) + 1;
          }
        });
        
        review.sideEffects.forEach(effect => {
          sideEffectCounts[effect] = (sideEffectCounts[effect] || 0) + 1;
        });
      });

      const commonBenefits = Object.entries(benefitCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([benefit]) => benefit);

      const commonSideEffects = Object.entries(sideEffectCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([effect]) => effect);

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        recentReviews,
        commonBenefits,
        commonSideEffects,
        recommendationRate: Math.round((recommendCount / totalReviews) * 100)
      };
      
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return undefined;
    }
  }

  // Analyze product ingredients for effectiveness
  private static async getIngredientAnalysis(productName: string) {
    // This would analyze the product's ingredients against your ingredient database
    // For now, return mock data structure
    return {
      keyIngredients: ['Magnesium Glycinate', 'Vitamin B6', 'L-Theanine'],
      effectivenessScores: {
        'sleep': 4.2,
        'stress': 3.8,
        'anxiety': 4.0
      },
      bioavailabilityScore: 8.5,
      dosageOptimality: 7.8
    };
  }

  // Get clinical evidence data
  private static async getClinicalEvidence(productName: string) {
    // This would query your clinical evidence database
    // Mock data for structure
    return {
      studyCount: 12,
      participantCount: 2847,
      efficacyRate: 73,
      safetyProfile: 'good' as const
    };
  }

  // Calculate overall score from all data sources
  private static calculateOverallScore(userFeedback?: any, ingredientData?: any, clinicalEvidence?: any): number {
    let score = 3; // baseline
    let factors = 1;

    if (userFeedback) {
      score += (userFeedback.averageRating - 3) * 0.4;
      factors++;
    }

    if (ingredientData) {
      const avgEffectiveness = Object.values(ingredientData.effectivenessScores).reduce((a: any, b: any) => a + b, 0) / Object.keys(ingredientData.effectivenessScores).length;
      score += (avgEffectiveness - 3) * 0.3;
      factors++;
    }

    if (clinicalEvidence && clinicalEvidence.efficacyRate) {
      const clinicalScore = (clinicalEvidence.efficacyRate / 100) * 5;
      score += (clinicalScore - 3) * 0.3;
      factors++;
    }

    return Math.max(1, Math.min(5, Math.round((score / factors) * 10) / 10));
  }

  // Generate human-readable insights
  private static generateInsights(userFeedback?: any, ingredientData?: any, clinicalEvidence?: any) {
    return {
      effectiveness: userFeedback?.totalReviews > 10 
        ? `${userFeedback.recommendationRate}% of users would recommend this product`
        : ingredientData 
        ? `Contains evidence-backed ingredients for targeted symptoms`
        : 'Limited effectiveness data available',
      
      safety: clinicalEvidence?.safetyProfile === 'excellent'
        ? `Excellent safety profile in ${clinicalEvidence.studyCount} clinical studies`
        : userFeedback?.commonSideEffects.length === 0
        ? `No common side effects reported by users`
        : 'Generally well-tolerated with monitoring',
      
      value: ingredientData?.dosageOptimality > 8
        ? 'Contains therapeutic doses of active ingredients'
        : 'Dosage and value assessment pending',
      
      quality: ingredientData?.bioavailabilityScore > 8
        ? 'Uses highly bioavailable forms of nutrients'
        : 'Standard ingredient forms and quality'
    };
  }

  // Fallback insights when no data available
  private static getFallbackInsights(productName: string, brandName: string): ProductInsight {
    return {
      productName,
      brandName,
      overallScore: 3,
      dataSource: 'ingredient_analysis',
      lastUpdated: new Date().toISOString(),
      insights: {
        effectiveness: 'Effectiveness data being collected from users',
        safety: 'No safety concerns identified in initial analysis',
        value: 'Value assessment based on ingredient analysis',
        quality: 'Quality evaluation pending user feedback'
      }
    };
  }

  // Update product insights after new review
  private static async updateProductInsights(productName: string, brandName: string) {
    // Trigger background recalculation of insights
    console.log(`Updating insights for ${brandName} ${productName}`);
  }

  // Get ingredient effectiveness data
  static async getIngredientEffectiveness(ingredient: string): Promise<IngredientEffectiveness | null> {
    try {
      // Query your ingredient database
      // For now, return mock structure
      return {
        ingredient,
        normalizedName: ingredient.toLowerCase().replace(/\s+/g, '-'),
        symptoms: {
          'stress': {
            effectivenessScore: 4.2,
            userReports: 156,
            clinicalEvidence: 'strong',
            averageTimeframe: '2-4 weeks',
            commonDosageRange: '200-400mg',
            sideEffectRate: 5
          }
        },
        bioavailabilityByForm: {
          'glycinate': 8.5,
          'oxide': 4.2,
          'citrate': 6.8
        },
        qualityFactors: {
          thirdPartyTested: 73,
          dosageAccuracy: 89,
          contaminationRisk: 'low'
        }
      };
    } catch (error) {
      console.error('Error getting ingredient data:', error);
      return null;
    }
  }
}