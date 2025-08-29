// src/app/api/reviews/reddit/route.ts - CREATE THIS NEW FILE
import { NextRequest, NextResponse } from 'next/server';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
}

interface RedditComment {
  id: string;
  body: string;
  author: string;
  created_utc: number;
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const { productName, brandName } = await request.json();
    
    if (!productName || !brandName) {
      return NextResponse.json({ error: 'Missing product info' }, { status: 400 });
    }

    console.log(`🔍 Searching Reddit for real reviews: ${brandName} ${productName}`);

    // Search Reddit for posts about the supplement
    const searchQuery = `${brandName} ${productName}`.replace(/\s+/g, '+');
    const redditUrl = `https://www.reddit.com/r/supplements/search.json?q=${searchQuery}&restrict_sr=1&limit=15&sort=relevance`;
    
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'SuppScan/1.0 (supplement review aggregator)'
      }
    });

    if (!response.ok) {
      console.log(`❌ Reddit API returned ${response.status}: ${response.statusText}`);
      return NextResponse.json({ reviews: [], error: `Reddit API error: ${response.status}` });
    }

    const data = await response.json();
    const posts = data?.data?.children || [];
    
    console.log(`📝 Found ${posts.length} Reddit posts`);

    if (posts.length === 0) {
      console.log('📭 No Reddit posts found for this supplement');
      return NextResponse.json({ reviews: [], message: 'No Reddit posts found' });
    }

    const reviews = [];
    
    // Convert Reddit posts to reviews
    for (const postData of posts.slice(0, 8)) {
      const post: RedditPost = postData.data;
      
      // Skip if post doesn't seem relevant
      if (!isRelevantPost(post, productName, brandName)) {
        continue;
      }

      // Get post content and convert to review
      const postReview = convertPostToReview(post, productName, brandName);
      if (postReview) {
        reviews.push(postReview);
        console.log(`✅ Added Reddit post review: "${postReview.title}"`);
      }

      // Get top comments from this post (if it has good engagement)
      if (post.num_comments > 5 && post.score > 10) {
        try {
          const comments = await getPostComments(post.id);
          const commentReviews = comments
            .filter(comment => isRelevantComment(comment, productName, brandName))
            .slice(0, 2) // Max 2 comments per post
            .map(comment => convertCommentToReview(comment, productName, brandName));
          
          reviews.push(...commentReviews);
          console.log(`✅ Added ${commentReviews.length} comment reviews from post`);
        } catch (commentError) {
          console.log('⚠️ Failed to fetch comments for post:', commentError);
        }
      }
    }

    console.log(`🎉 Converted ${reviews.length} total Reddit reviews`);

    return NextResponse.json({
      reviews: reviews.slice(0, 10), // Limit to 10 reviews max
      source: 'reddit',
      searchQuery,
      postsFound: posts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Reddit reviews error:', error);
    return NextResponse.json({
      reviews: [],
      error: error instanceof Error ? error.message : 'Failed to fetch Reddit reviews'
    });
  }
}

function isRelevantPost(post: RedditPost, productName: string, brandName: string): boolean {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
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
  
  // Skip deleted/removed posts
  if (post.author === '[deleted]' || post.selftext === '[removed]') {
    return false;
  }
  
  // Skip posts that are just questions without experience
  const questionWords = ['help', 'question', 'advice', 'should i', 'what do you think', 'recommendations'];
  const experienceWords = ['tried', 'using', 'took', 'been taking', 'experience', 'results', 'review', 'months'];
  
  const hasQuestion = questionWords.some(word => text.includes(word));
  const hasExperience = experienceWords.some(word => text.includes(word));
  
  // Prefer posts with experience over pure questions
  return hasExperience || !hasQuestion;
}

function isRelevantComment(comment: RedditComment, productName: string, brandName: string): boolean {
  const text = comment.body.toLowerCase();
  const product = productName.toLowerCase();
  const brand = brandName.toLowerCase();
  
  // Must mention the product somehow or show personal experience
  const hasProductMention = text.includes(brand) || text.includes(product) || text.includes('this') || text.includes('it');
  const hasExperience = ['tried', 'using', 'took', 'been taking', 'helped', 'worked', 'noticed'].some(word => text.includes(word));
  
  if (!hasProductMention && !hasExperience) {
    return false;
  }
  
  // Must be substantial
  if (text.length < 30 || comment.score < 1) {
    return false;
  }
  
  // Skip deleted/removed comments
  if (text.includes('[deleted]') || text.includes('[removed]')) {
    return false;
  }
  
  return true;
}

function convertPostToReview(post: RedditPost, productName: string, brandName: string) {
  // Extract a rating from the post content (1-5 stars)
  const rating = extractRatingFromText(`${post.title} ${post.selftext}`);
  
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
    id: `reddit-post-${post.id}`,
    productName,
    brandName,
    rating,
    title,
    content,
    author: post.author || 'Anonymous',
    date: new Date(post.created_utc * 1000).toISOString().split('T')[0],
    source: 'reddit' as const,
    verified: false,
    helpful: Math.max(0, post.score),
    sourceUrl: `https://reddit.com${post.permalink}`
  };
}

function convertCommentToReview(comment: RedditComment, productName: string, brandName: string) {
  const rating = extractRatingFromText(comment.body);
  
  // Create a title from comment content
  let title = comment.body.split('.')[0];
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  if (title.length < 20) {
    title = "User experience shared";
  }
  
  let content = comment.body;
  if (content.length > 300) {
    content = content.substring(0, 297) + '...';
  }
  
  return {
    id: `reddit-comment-${comment.id}`,
    productName,
    brandName,
    rating,
    title,
    content,
    author: comment.author || 'Anonymous',
    date: new Date(comment.created_utc * 1000).toISOString().split('T')[0],
    source: 'reddit' as const,
    verified: false,
    helpful: Math.max(0, comment.score),
    sourceUrl: `https://reddit.com/comments/${comment.id}`
  };
}

async function getPostComments(postId: string): Promise<RedditComment[]> {
  try {
    const commentsUrl = `https://www.reddit.com/comments/${postId}.json?limit=15&sort=top`;
    const response = await fetch(commentsUrl, {
      headers: {
        'User-Agent': 'SuppScan/1.0 (supplement review aggregator)'
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const commentsListing = data[1]?.data?.children || [];
    
    return commentsListing
      .map((child: any) => child.data)
      .filter((comment: any) => comment.body && comment.author && comment.author !== 'AutoModerator')
      .slice(0, 10); // Max 10 comments per post
      
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
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