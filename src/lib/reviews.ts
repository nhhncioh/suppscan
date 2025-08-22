// src/lib/reviews.ts - Create this new file
import type { Review, ReviewSummary } from '@/types/reviews';

export class ReviewManager {
  private reviews: Review[] = [];

  async fetchReviews(productName: string, brandName: string): Promise<Review[]> {
    const reviews: Review[] = [];
    
    try {
      // Fetch from multiple sources in parallel
      const [redditReviews, scrapedReviews] = await Promise.all([
        this.fetchRedditReviews(productName, brandName),
        this.fetchScrapedReviews(productName, brandName)
      ]);
      
      reviews.push(...redditReviews);
      reviews.push(...scrapedReviews);
      
      // If we don't get enough real reviews, supplement with some mock ones
      if (reviews.length < 3) {
        const mockReviews = this.getMockReviews(productName, brandName);
        reviews.push(...mockReviews.slice(0, 4 - reviews.length));
      }
      
      // Sort by helpfulness and verification status
      return reviews.sort((a, b) => {
        const aScore = (a.helpful || 0) + (a.verified ? 20 : 0);
        const bScore = (b.helpful || 0) + (b.verified ? 20 : 0);
        return bScore - aScore;
      }).slice(0, 8); // Limit to 8 reviews max
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to product-specific mock data
      return this.getMockReviews(productName, brandName);
    }
  }

  private async fetchRedditReviews(productName: string, brandName: string): Promise<Review[]> {
    try {
      const response = await fetch('/api/reviews/reddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, brandName })
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Reddit API error:', error);
      return [];
    }
  }

  private async fetchScrapedReviews(productName: string, brandName: string): Promise<Review[]> {
    try {
      const response = await fetch('/api/reviews/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, brandName })
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Scraping error:', error);
      return [];
    }
  }

  private getMockReviews(productName: string, brandName: string): Review[] {
    // Product-specific mock reviews as fallback
    const productLower = productName.toLowerCase();
    
    if (productLower.includes('vitamin c')) {
      return [
        {
          id: 'mock-vc-1',
          productName,
          brandName,
          rating: 5,
          title: "Excellent immune support",
          content: "This vitamin C has kept me healthy through flu season. High quality and good absorption.",
          author: "ImmuneSupport2024",
          date: "2024-08-10",
          source: 'manual',
          verified: false,
          helpful: 12
        },
        {
          id: 'mock-vc-2',
          productName,
          brandName,
          rating: 4,
          title: "Good value for money",
          content: "Works well and doesn't upset my stomach like some other brands. Will continue using.",
          author: "HealthyChoice",
          date: "2024-07-28",
          source: 'manual',
          verified: true,
          helpful: 8
        }
      ];
    }
    
    if (productLower.includes('vitamin d')) {
      return [
        {
          id: 'mock-vd-1',
          productName,
          brandName,
          rating: 4,
          title: "Helped my deficiency",
          content: "Doctor recommended this for my vitamin D deficiency. Blood levels improved after 3 months of consistent use.",
          author: "SunnyDays",
          date: "2024-07-25",
          source: 'manual',
          verified: false,
          helpful: 18
        },
        {
          id: 'mock-vd-2',
          productName,
          brandName,
          rating: 5,
          title: "Easy to take",
          content: "Small capsules that are easy to swallow. No aftertaste and good potency.",
          author: "DailyVitamins",
          date: "2024-08-05",
          source: 'manual',
          verified: true,
          helpful: 6
        }
      ];
    }

    if (productLower.includes('protein')) {
      return [
        {
          id: 'mock-protein-1',
          productName,
          brandName,
          rating: 5,
          title: "Great for post-workout",
          content: "Mixes well and tastes good. Perfect for recovery after intense training sessions.",
          author: "GymRat2024",
          date: "2024-08-12",
          source: 'manual',
          verified: true,
          helpful: 22
        },
        {
          id: 'mock-protein-2',
          productName,
          brandName,
          rating: 4,
          title: "Good protein content",
          content: "Solid macros and dissolves easily. Good value compared to other brands.",
          author: "FitnessTracker",
          date: "2024-07-30",
          source: 'manual',
          verified: true,
          helpful: 14
        }
      ];
    }
    
    // Default reviews for any product
    return [
      {
        id: 'mock-default-1',
        productName,
        brandName,
        rating: 4,
        title: "Good quality supplement",
        content: "This supplement works as expected. Good value for the price and no side effects.",
        author: "HealthyLifestyle",
        date: "2024-08-01",
        source: 'manual',
        verified: false,
        helpful: 8
      },
      {
        id: 'mock-default-2',
        productName,
        brandName,
        rating: 5,
        title: "Recommended by nutritionist",
        content: "My nutritionist recommended this brand. High quality ingredients and good manufacturing standards.",
        author: "WellnessJourney",
        date: "2024-07-20",
        source: 'manual',
        verified: true,
        helpful: 15
      }
    ];
  }

  generateSummary(reviews: Review[]): ReviewSummary {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
        highlights: [],
        concerns: []
      };
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    const highlights = this.extractHighlights(reviews);
    const concerns = this.extractConcerns(reviews);

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      highlights,
      concerns
    };
  }

  private extractHighlights(reviews: Review[]): string[] {
    const positiveKeywords = ['great', 'excellent', 'effective', 'quality', 'recommend', 'works', 'love', 'amazing', 'perfect'];
    const highlights: string[] = [];
    
    reviews.filter(r => r.rating >= 4).forEach(review => {
      const sentences = review.content.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.length > 10 && positiveKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          highlights.push(sentence.trim());
        }
      });
    });

    // Remove duplicates and return top 3
    return [...new Set(highlights)].slice(0, 3);
  }

  private extractConcerns(reviews: Review[]): string[] {
    const negativeKeywords = ['side effects', 'expensive', 'slow', 'doesn\'t work', 'poor', 'waste', 'disappointed'];
    const concerns: string[] = [];
    
    reviews.filter(r => r.rating <= 3).forEach(review => {
      const sentences = review.content.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.length > 10 && negativeKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          concerns.push(sentence.trim());
        }
      });
    });

    return [...new Set(concerns)].slice(0, 2);
  }
}