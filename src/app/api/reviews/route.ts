// app/api/reviews/route.ts - Main endpoint that coordinates everything
import { NextRequest, NextResponse } from 'next/server';
import { ReviewManager } from '@/lib/reviews';

export async function POST(request: NextRequest) {
  try {
    const { productName, brandName } = await request.json();
    
    if (!productName || !brandName) {
      return NextResponse.json(
        { error: 'Product name and brand name are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching reviews for: ${brandName} ${productName}`);

    const reviewManager = new ReviewManager();
    const reviews = await reviewManager.fetchReviews(productName, brandName);
    const summary = reviewManager.generateSummary(reviews);

    console.log(`Found ${reviews.length} reviews with average rating ${summary.averageRating}`);

    return NextResponse.json({
      reviews,
      summary,
      sources: [...new Set(reviews.map(r => r.source))],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reviews',
        reviews: [],
        summary: null
      },
      { status: 500 }
    );
  }
}

// Install required dependencies:
// npm install cheerio
// npm install @types/cheerio (if using TypeScript)

// File structure you need to create:
/*
src/
├── app/
│   └── api/
│       └── reviews/
│           ├── route.ts (this file)
│           ├── reddit/
│           │   └── route.ts
│           └── scrape/
│               └── route.ts
└── lib/
    └── reviews.ts (updated ReviewManager)
*/

// Updated types/reviews.ts (add this to your existing types)
export interface ReviewSource {
  name: string;
  url?: string;
  lastUpdated: string;
  reviewCount: number;
  averageRating: number;
}

export interface ReviewResponse {
  reviews: Review[];
  summary: ReviewSummary;
  sources: string[];
  timestamp: string;
  fromCache?: boolean;
}

// Environment variables you might want to add to .env.local:
/*
# Reddit API (optional, public API works without keys but has rate limits)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# Rate limiting and caching
REVIEW_CACHE_TTL=3600  # 1 hour cache
MAX_REQUESTS_PER_MINUTE=30

# Scraping configuration
SCRAPING_DELAY_MS=2000  # 2 second delay between requests
USER_AGENT=SuppScan-Review-Aggregator/1.0
*/