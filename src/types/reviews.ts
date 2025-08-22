// types/reviews.ts
export interface Review {
  id: string;
  productName: string;
  brandName: string;
  rating: number; // 1-5
  title: string;
  content: string;
  author: string;
  date: string;
  source: 'amazon' | 'iherb' | 'vitacost' | 'bodybuilding' | 'reddit' | 'manual';
  verified?: boolean;
  helpful?: number;
  sourceUrl?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  highlights: string[];
  concerns: string[];
}

// lib/reviews.ts
import type { Review, ReviewSummary } from '@/types/reviews';

export class ReviewManager {
  private reviews: Review[] = [];

  // Simulate fetching reviews from multiple sources
  async fetchReviews(productName: string, brandName: string): Promise<Review[]> {
    // In production, this would fetch from:
    // - Amazon Product Advertising API
    // - iHerb API
    // - Reddit API (r/supplements)
    // - Vitacost scraping
    // - Manual curated reviews
    
    return this.mockReviews(productName, brandName);
  }

  // Mock reviews for demonstration
  private mockReviews(productName: string, brandName: string): Review[] {
    return [
      {
        id: '1',
        productName,
        brandName,
        rating: 5,
        title: "Great quality and effectiveness",
        content: "Been using this for 3 months and noticed significant improvements. No side effects and good value for money.",
        author: "HealthyLiving23",
        date: "2024-08-15",
        source: 'amazon',
        verified: true,
        helpful: 12,
        sourceUrl: "https://amazon.com/review/123"
      },
      {
        id: '2',
        productName,
        brandName,
        rating: 4,
        title: "Good product, could be better",
        content: "Works well but takes a while to see results. Customer service was helpful when I had questions.",
        author: "FitnessFan",
        date: "2024-08-10",
        source: 'iherb',
        verified: true,
        helpful: 8
      },
      {
        id: '3',
        productName,
        brandName,
        rating: 5,
        title: "Exceeded expectations",
        content: "This supplement has become part of my daily routine. Quality ingredients and noticeable results within weeks.",
        author: "WellnessWarrior",
        date: "2024-08-05",
        source: 'bodybuilding',
        verified: false,
        helpful: 15
      },
      {
        id: '4',
        productName,
        brandName,
        rating: 3,
        title: "Average product",
        content: "Does what it says but nothing special. Price is reasonable though.",
        author: "BudgetBuyer",
        date: "2024-07-28",
        source: 'vitacost',
        verified: true,
        helpful: 3
      },
      {
        id: '5',
        productName,
        brandName,
        rating: 4,
        title: "Good for the price point",
        content: "Solid supplement that delivers on its promises. Have recommended to friends.",
        author: "u/supplements_daily",
        date: "2024-07-20",
        source: 'reddit',
        verified: false,
        helpful: 22
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

    // Extract highlights and concerns from review content
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
    const positiveKeywords = ['great', 'excellent', 'effective', 'quality', 'recommend', 'works', 'helpful', 'good value'];
    const highlights: string[] = [];
    
    reviews.filter(r => r.rating >= 4).forEach(review => {
      const sentences = review.content.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (positiveKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          highlights.push(sentence.trim());
        }
      });
    });

    return highlights.slice(0, 3); // Top 3 highlights
  }

  private extractConcerns(reviews: Review[]): string[] {
    const negativeKeywords = ['side effects', 'expensive', 'slow', 'doesn\'t work', 'poor quality', 'waste'];
    const concerns: string[] = [];
    
    reviews.filter(r => r.rating <= 3).forEach(review => {
      const sentences = review.content.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (negativeKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          concerns.push(sentence.trim());
        }
      });
    });

    return concerns.slice(0, 2); // Top 2 concerns
  }
}

// API endpoint: app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ReviewManager } from '@/lib/reviews';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('product') || '';
    const brandName = searchParams.get('brand') || '';

    if (!productName || !brandName) {
      return NextResponse.json(
        { error: 'Product name and brand name are required' },
        { status: 400 }
      );
    }

    const reviewManager = new ReviewManager();
    const reviews = await reviewManager.fetchReviews(productName, brandName);
    const summary = reviewManager.generateSummary(reviews);

    return NextResponse.json({
      reviews,
      summary
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// Component: components/ReviewsTab.tsx
'use client';
import React, { useState, useEffect } from 'react';
import type { Review, ReviewSummary } from '@/types/reviews';

interface ReviewsTabProps {
  productName: string;
  brandName: string;
}

export default function ReviewsTab({ productName, brandName }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productName || !brandName) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/reviews?product=${encodeURIComponent(productName)}&brand=${encodeURIComponent(brandName)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(data.reviews);
        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productName, brandName]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'star filled' : 'star'}>
        ★
      </span>
    ));
  };

  const getSourceLabel = (source: Review['source']) => {
    const labels = {
      amazon: 'Amazon',
      iherb: 'iHerb',
      vitacost: 'Vitacost',
      bodybuilding: 'Bodybuilding.com',
      reddit: 'Reddit',
      manual: 'Curated'
    };
    return labels[source];
  };

  if (loading) {
    return (
      <div className="card">
        <div className="section-title">What People Are Saying</div>
        <div className="muted">Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="section-title">What People Are Saying</div>
        <div className="muted">Unable to load reviews: {error}</div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="card">
        <div className="section-title">What People Are Saying</div>
        <div className="muted">No reviews found for this product.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title">What People Are Saying</div>
      
      {/* Review Summary */}
      {summary && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{summary.averageRating}</div>
            <div>{renderStars(Math.round(summary.averageRating))}</div>
            <div className="muted">({summary.totalReviews} reviews)</div>
          </div>
          
          {summary.highlights.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>Highlights:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {summary.highlights.slice(0, 2).map((highlight, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#28a745' }}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.concerns.length > 0 && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>Common Concerns:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {summary.concerns.slice(0, 1).map((concern, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#dc3545' }}>{concern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Individual Reviews */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.slice(0, 4).map((review) => (
          <div key={review.id} style={{ 
            padding: 12, 
            border: '1px solid #e9ecef', 
            borderRadius: 8,
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div>{renderStars(review.rating)}</div>
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{review.title}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span className="chip" style={{ fontSize: 11 }}>
                  {getSourceLabel(review.source)}
                </span>
                {review.verified && (
                  <span style={{ fontSize: 11, color: '#28a745' }}>✓ Verified</span>
                )}
              </div>
            </div>
            
            <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.4 }}>
              {review.content}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <div className="muted">
                By {review.author} • {new Date(review.date).toLocaleDateString()}
              </div>
              {review.helpful && (
                <div className="muted">
                  {review.helpful} found helpful
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {reviews.length > 4 && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div className="muted">Showing 4 of {reviews.length} reviews</div>
        </div>
      )}
    </div>
  );
}