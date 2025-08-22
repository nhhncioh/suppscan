'use client';
import React, { useState, useEffect } from 'react';

interface Review {
  id: string;
  productName: string;
  brandName: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  source: 'amazon' | 'iherb' | 'vitacost' | 'bodybuilding' | 'reddit' | 'manual';
  verified?: boolean;
  helpful?: number;
  sourceUrl?: string;
}

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  highlights: string[];
  concerns: string[];
}

interface ReviewsTabProps {
  productName: string;
  brandName: string;
  onReviewCountChange?: (count: number) => void;
}

export default function ReviewsTab({ productName, brandName, onReviewCountChange }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productName || !brandName) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the real review API endpoint
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, brandName })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || null);
        
        // Notify parent component of review count
        const reviewCount = data.reviews?.length || 0;
        onReviewCountChange?.(reviewCount);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to mock data on error
        const fallbackReviews = await fetchFallbackReviews();
        setReviews(fallbackReviews);
        setSummary(generateFallbackSummary(fallbackReviews));
        
        // Notify parent component of fallback review count
        onReviewCountChange?.(fallbackReviews.length);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productName, brandName]);

  const fetchFallbackReviews = async () => {
    // Fallback mock reviews when API fails
    return [
      {
        id: 'fallback-1',
        productName,
        brandName,
        rating: 4,
        title: "Good supplement overall",
        content: "This supplement works as described. Good quality and value for the price.",
        author: "VerifiedUser",
        date: "2024-08-15",
        source: 'manual' as const,
        verified: true,
        helpful: 8
      }
    ];
  };

  const generateFallbackSummary = (reviews: Review[]) => {
    if (!reviews.length) return null;
    
    return {
      averageRating: 4.0,
      totalReviews: reviews.length,
      ratingDistribution: { 4: reviews.length },
      highlights: ["Good quality supplement"],
      concerns: []
    };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'star filled' : 'star'} style={{
        fontSize: '16px',
        color: i < rating ? '#ffc107' : '#ddd'
      }}>
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
      <div>
        <div className="muted">Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="muted">Unable to load reviews: {error}</div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div>
        <div className="muted">No reviews found for this product.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Review Summary */}
      {summary && (
        <div style={{ marginBottom: 20, padding: 16, background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: 12, border: '2px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#495057' }}>{summary.averageRating}</div>
            <div>{renderStars(Math.round(summary.averageRating))}</div>
            <div style={{ color: '#6c757d', fontSize: 16, fontWeight: '500' }}>({summary.totalReviews} reviews)</div>
          </div>
          
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#495057', marginBottom: 8 }}>Review Summary</div>
          
          {summary.highlights.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 6, color: '#495057' }}>✓ What people love:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {summary.highlights.slice(0, 2).map((highlight, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#28a745', marginBottom: 2 }}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.concerns.length > 0 && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 6, color: '#495057' }}>⚠ Common concerns:</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {summary.concerns.slice(0, 1).map((concern, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#dc3545', marginBottom: 2 }}>{concern}</li>
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
                <div style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>{review.title}</div>
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
            
            <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.4, color: '#333' }}>
              {review.content}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <div style={{ color: '#666' }}>
                By {review.author} • {new Date(review.date).toLocaleDateString()}
              </div>
              {review.helpful && (
                <div style={{ color: '#666' }}>
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