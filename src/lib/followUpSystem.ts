// src/lib/followUpSystem.ts - Track supplement effectiveness over time
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export interface FollowUpPrompt {
  id?: string;
  userId: string;
  productName: string;
  brandName: string;
  barcode?: string;
  initialReviewId?: string;
  promptType: 'effectiveness_check' | 'side_effect_update' | 'continuation_check';
  scheduledDate: string;
  completed: boolean;
  response?: {
    stillTaking: boolean;
    currentEffectiveness: number; // 1-5
    sideEffectsChanged: boolean;
    newSideEffects?: string[];
    wouldStillRecommend: boolean;
    notes?: string;
    completedAt: string;
  };
  createdAt: string;
}

export class FollowUpSystem {
  
  // Schedule follow-up prompts after a review is submitted
  static async scheduleFollowUps(userId: string, productName: string, brandName: string, reviewId: string, barcode?: string) {
    try {
      const now = new Date();
      
      // 2-week effectiveness check
      const twoWeekDate = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
      await addDoc(collection(db, 'followUpPrompts'), {
        userId,
        productName,
        brandName,
        barcode,
        initialReviewId: reviewId,
        promptType: 'effectiveness_check',
        scheduledDate: twoWeekDate.toISOString(),
        completed: false,
        createdAt: now.toISOString()
      });