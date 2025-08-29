// src/app/api/reviews/route.ts - COMPLETE SINGLE FILE VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productName, brandName, productContext } = await request.json();
    
    if (!productName || !brandName) {
      return NextResponse.json(
        { error: 'Product name and brand name are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching REAL reviews for: ${brandName} ${productName}`);

    const allReviews = [];
    const sources = [];
    const errors = [];

    // Try to get real Reddit reviews directly (no internal API call)
    try {
      console.log('Searching Reddit directly...');
      const redditReviews = await fetchRedditReviews(productName, brandName);
      if (redditReviews.length > 0) {
        allReviews.push(...redditReviews);
        sources.push('reddit');
        console.log(`Found ${redditReviews.length} real Reddit reviews`);
      } else {
        console.log('No Reddit reviews found');
        errors.push('Reddit: No reviews found');
      }
    } catch (error) {
      console.error('Reddit search failed:', error);
      errors.push('Reddit: Search failed');
    }

    // Try web reviews (placeholder)
    const webReviews = await fetchWebReviews(productName, brandName);
    if (webReviews.length > 0) {
      allReviews.push(...webReviews);
      sources.push('web');
      console.log(`Added ${webReviews.length} web reviews`);
    }

    // If we got real reviews, return them
    if (allReviews.length > 0) {
      const summary = generateSummary(allReviews);
      
      console.log(`SUCCESS: Found ${allReviews.length} total real reviews from ${sources.join(', ')}`);
      
      return NextResponse.json({
        reviews: allReviews.slice(0, 10),
        summary,
        sources,
        source: 'real_reviews',
        timestamp: new Date().toISOString()
      });
    }

    // Fallback to generated reviews
    console.log('No real reviews found, falling back to generated reviews');
    console.log('Search attempts:', errors.join(', '));
    
    const fallbackReviews = generateSmartFallbackReviews(productName, brandName, productContext);
    const fallbackSummary = generateSummary(fallbackReviews);

    return NextResponse.json({
      reviews: fallbackReviews,
      summary: fallbackSummary,
      sources: ['generated'],
      source: 'fallback',
      message: 'No real reviews found for this specific product',
      searchAttempts: errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Critical error in reviews API:', error);
    
    return NextResponse.json({
      reviews: [],
      summary: null,
      error: error instanceof Error ? error.message : 'Failed to fetch reviews'
    }, { status: 500 });
  }
}

// Direct Reddit API fetch (no internal routing)
async function fetchRedditReviews(productName: string, brandName: string) {
  try {
    console.log(`Searching Reddit for: ${brandName} ${productName}`);
    
    // Search Reddit for posts about the supplement
    const searchQuery = `${brandName} ${productName}`.replace(/\s+/g, '+');
    const redditUrl = `https://www.reddit.com/r/supplements/search.json?q=${searchQuery}&restrict_sr=1&limit=15&sort=relevance`;
    
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'SuppScan/1.0 (supplement review aggregator)'
      }
    });

    if (!response.ok) {
      console.log(`Reddit API returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const posts = data?.data?.children || [];
    
    console.log(`Found ${posts.length} Reddit posts`);

    if (posts.length === 0) {
      return [];
    }

    const reviews = [];
    
    // Convert Reddit posts to reviews
    for (const postData of posts.slice(0, 8)) {
      const post = postData.data;
      
      // Skip if post doesn't seem relevant
      if (!isRelevantPost(post, productName, brandName)) {
        continue;
      }

      // Convert post to review format
      const review = convertPostToReview(post, productName, brandName);
      if (review) {
        reviews.push(review);
        console.log(`Added Reddit review: "${review.title}"`);
      }
    }

    console.log(`Converted ${reviews.length} Reddit posts to reviews`);
    return reviews;

  } catch (error) {
    console.error('Reddit fetch error:', error);
    return [];
  }
}

function isRelevantPost(post: any, productName: string, brandName: string): boolean {
  const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
  const product = productName.toLowerCase();
  const brand = brandName.toLowerCase();
  
  // Must mention the brand or product
  if (!text.includes(brand) && !text.includes(product)) {
    return false;
  }
  
  // Skip very short posts
  if (text.length < 50) {
    return false;
  }
  
  // Skip deleted posts
  if (post.author === '[deleted]' || post.selftext === '[removed]') {
    return false;
  }
  
  return true;
}

function convertPostToReview(post: any, productName: string, brandName: string) {
  // Extract a rating from the post content (1-5 stars)
  const rating = extractRatingFromText(`${post.title} ${post.selftext || ''}`);
  
  // Create a title from the Reddit post title
  let title = post.title;
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  
  // Use post content as review content
  let content = post.selftext || post.title;
  if (content.length > 400) {
    content = content.substring(0, 397) + '...';
  }
  
  return {
    id: `reddit-${post.id}`,
    productName,
    brandName,
    rating,
    title,
    content,
    author: post.author || 'Anonymous',
    date: new Date(post.created_utc * 1000).toISOString().split('T')[0],
    source: 'reddit' as const,
    verified: false,
    helpful: Math.max(0, post.score || 0),
    sourceUrl: `https://reddit.com${post.permalink}`
  };
}

function extractRatingFromText(text: string): number {
  const lowerText = text.toLowerCase();
  
  // Look for explicit ratings first
  const ratingMatch = text.match(/(\d+)\/5|\b(\d+)\s*stars?|\b(\d+)\s*out\s*of\s*5/i);
  if (ratingMatch) {
    const rating = parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3]);
    return Math.min(5, Math.max(1, rating));
  }
  
  // Strong positive indicators = 5 stars
  const strongPositive = ['amazing', 'fantastic', 'incredible', 'life changing', 'best supplement', 'highly recommend'];
  if (strongPositive.some(word => lowerText.includes(word))) return 5;
  
  // Negative indicators = 2 stars  
  const negative = ['terrible', 'awful', 'waste', 'horrible', 'useless', 'disappointed', 'side effects', 'made me sick'];
  if (negative.some(word => lowerText.includes(word))) return 2;
  
  // Neutral/mixed = 3 stars
  const neutral = ['okay', 'average', 'decent', 'fine', 'alright', 'mixed results', 'not sure'];
  if (neutral.some(word => lowerText.includes(word))) return 3;
  
  // Positive indicators = 4 stars
  const positive = ['good', 'great', 'excellent', 'love', 'recommend', 'works well', 'helped', 'effective'];
  if (positive.some(word => lowerText.includes(word))) return 4;
  
  // Default to 3 if no clear sentiment
  return 3;
}

// Placeholder for web review fetching
async function fetchWebReviews(productName: string, brandName: string) {
  const searchQueries = [
    `"${brandName}" "${productName}" review site:examine.com`,
    `"${brandName}" "${productName}" review site:consumerlab.com`,
    `"${brandName}" "${productName}" review site:labdoor.com`
  ];

  console.log('Web scraping would search for:', searchQueries);
  return [];
}

// Enhanced fallback reviews
function generateSmartFallbackReviews(productName: string, brandName: string, productContext?: any) {
  const ingredients = productContext?.ingredients || [];
  const category = productContext?.category || 'supplement';
  
  console.log(`Generating smart fallback for ${category} with ${ingredients.length} ingredients`);
  
  const reviews = [
    {
      id: 'fallback-honest-1',
      productName,
      brandName,
      rating: 4,
      title: "No user reviews found yet",
      content: `We searched Reddit and supplement review sites but couldn't find user reviews for this specific ${productName} by ${brandName}. This might be a newer product or smaller brand. Check the manufacturer's website, Amazon, or ask in r/supplements for real user experiences.`,
      author: "SuppScan System",
      date: new Date().toISOString().split('T')[0],
      source: 'manual' as const,
      verified: false,
      helpful: 0,
      isGenerated: true
    }
  ];

  if (ingredients.length > 0) {
    const mainIngredient = ingredients[0].name;
    reviews.push({
      id: 'fallback-ingredient-1',
      productName,
      brandName,
      rating: 3,
      title: `Contains ${mainIngredient}`,
      content: `This supplement contains ${mainIngredient}${ingredients.length > 1 ? ` and ${ingredients.length - 1} other ingredients` : ''}. For real user experiences with ${mainIngredient} supplements, try searching Reddit's r/supplements or check reviews on major retailers like Amazon or iHerb.`,
      author: "Ingredient Analysis",
      date: new Date().toISOString().split('T')[0],
      source: 'manual' as const,
      verified: false,
      helpful: 0,
      isGenerated: true
    });
  }

  return reviews;
}

function generateSummary(reviews: any[]) {
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
  const averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews;
  
  const ratingDistribution = reviews.reduce((dist: any, review: any) => {
    dist[review.rating] = (dist[review.rating] || 0) + 1;
    return dist;
  }, {});

  const highlights = reviews
    .filter((r: any) => r.rating >= 4 && !r.isGenerated)
    .map((r: any) => {
      const sentences = r.content.split(/[.!?]+/);
      return sentences.find((s: string) => s.trim().length > 15 && s.trim().length < 120);
    })
    .filter((h: string) => h && h.trim().length > 0)
    .slice(0, 3);

  const concerns = reviews
    .filter((r: any) => r.rating <= 3 && !r.isGenerated)
    .map((r: any) => {
      const sentences = r.content.split(/[.!?]+/);
      return sentences.find((s: string) => s.trim().length > 15 && s.trim().length < 120);
    })
    .filter((c: string) => c && c.trim().length > 0)
    .slice(0, 2);

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution,
    highlights: highlights.map((h: string) => h.trim()),
    concerns: concerns.map((c: string) => c.trim())
  };
}

// Keep GET for backward compatibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productName = searchParams.get('product') || '';
  const brandName = searchParams.get('brand') || '';

  const postRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName, brandName })
  });

  return POST(postRequest as NextRequest);
}