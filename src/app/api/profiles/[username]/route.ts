import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';
import { getInstagramProfile } from '@/lib/instagram';
import { rateLimiter } from '@/lib/rate-limit';
import { securityMiddleware, logSecurityEvent } from '@/lib/security-middleware';
import type { Profile as InstagramProfile } from '@/components/viewer/ProfileView/ProfileView';

// Helper function to get cache headers
function getCacheHeaders(isFresh: boolean = false, cacheType: 'profile' | 'media' = 'profile'): Headers {
  const headers = new Headers();
  
  // Use environment variables or fallback to defaults (6 hours browser, 7 hours CDN)
  const defaultBrowserCache = 360 * 60; // 6 hours
  const defaultCdnCache = 420 * 60; // 7 hours
  
  let cacheDuration: number;
  let sMaxAge: number;

  if (cacheType === 'profile') {
    cacheDuration = parseInt(process.env.BROWSER_CACHE_DURATION_SECONDS || defaultBrowserCache.toString());
    sMaxAge = parseInt(process.env.CDN_CACHE_DURATION_SECONDS || defaultCdnCache.toString());
  } else {
    cacheDuration = parseInt(process.env.BROWSER_CACHE_DURATION_SECONDS || defaultBrowserCache.toString());
    sMaxAge = parseInt(process.env.CDN_CACHE_DURATION_SECONDS || defaultCdnCache.toString());
  }
  
  // CDN cache headers (Vercel + Cloudflare)
  headers.set('Cache-Control', `public, max-age=${cacheDuration}, s-maxage=${sMaxAge}`);
  headers.set('CDN-Cache-Control', `public, s-maxage=${sMaxAge}`);
  headers.set('Vercel-CDN-Cache-Control', `public, s-maxage=${sMaxAge}`);
  
  // Custom headers for monitoring
  headers.set('X-Cache-Source', isFresh ? 'api' : 'cache');
  headers.set('X-Cache-TTL', cacheDuration.toString());
  headers.set('X-Cache-Type', cacheType);
  
  return headers;
}

// Helper function to check if cache needs refresh
function needsRefresh(lastFetched?: string, cacheType: 'profile' | 'media' = 'profile'): boolean {
  if (!lastFetched) return true;
  
  const lastFetchedDate = new Date(lastFetched);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastFetchedDate.getTime()) / (1000 * 60);
  
  // Both profiles and media refresh after 6 hours (360 minutes)
  const refreshThreshold = 360; // 6 hours for both
  
  return diffInMinutes > refreshThreshold;
}

// Helper function to convert snake_case to camelCase
function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = snakeToCamel(obj[key]);
    }
  }
  return result;
}

// Helper function to create frontend-compatible profile data
function createFrontendProfile(profileData: any, instagramProfile: any): any {
  // Handle both snake_case and camelCase property names from profileData
  // Also check instagramProfile as fallback
  const postsCount = profileData.posts_count || profileData.postsCount || profileData.posts || instagramProfile.posts || 0;
  const followersCount = profileData.followers_count || profileData.followersCount || profileData.followers || instagramProfile.followers || 0;
  const followingCount = profileData.following_count || profileData.followingCount || profileData.following || instagramProfile.following || 0;
  const fullName = profileData.full_name || profileData.fullName || instagramProfile.fullName || '';
  const bio = profileData.bio || instagramProfile.bio || '';
  const profilePicUrl = profileData.profile_pic_url || profileData.profilePicUrl || instagramProfile.profilePicUrl || '';
  const isVerified = profileData.is_verified || profileData.isVerified || instagramProfile.isVerified || false;
  const isBusinessAccount = profileData.is_business_account || profileData.isBusinessAccount || instagramProfile.isBusinessAccount || false;
  const hasStory = profileData.has_story || profileData.hasStory || instagramProfile.hasStory || false;
  const lastFetched = profileData.last_fetched || profileData.lastFetched;

  return {
    username: profileData.username || instagramProfile.username,
    fullName,
    bio,
    profilePicUrl,
    posts: postsCount,
    followers: followersCount,
    following: followingCount,
    isVerified,
    isBusinessAccount,
    hasStory,
    lastFetched,
    postsList: instagramProfile.postsList || [],
    highlights: instagramProfile.highlights || [],
    storiesList: instagramProfile.storiesList || [],
  };
}



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { username } = await params;
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { 
          status: 400,
          headers: getCacheHeaders(false, 'profile') // Cache error responses with profile cache
        }
      );
    }

    const normalizedUsername = username.toLowerCase();
    
    // Apply comprehensive security middleware
    const securityResponse = await securityMiddleware(request, normalizedUsername);
    if (securityResponse) {
      // Security middleware blocked the request
      logSecurityEvent({
        type: 'BLOCKED',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        path: request.nextUrl.pathname,
        message: 'Request blocked by security middleware',
        details: { username: normalizedUsername }
      });
      return securityResponse;
    }
    
    // Apply enhanced rate limiting based on IP address
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitKey = `security:${ip}:${request.nextUrl.pathname}`;
    
    const rateLimitResult = rateLimiter.isAllowed(rateLimitKey);
    const rateLimitHeaders = rateLimiter.getHeaders(rateLimitKey);
    
    // Add rate limit headers to response
    const headers = getCacheHeaders(false, 'profile');
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    if (!rateLimitResult.allowed) {
      headers.set('Retry-After', Math.ceil(rateLimitResult.resetAfter / 1000).toString());
      
      logSecurityEvent({
        type: 'RATE_LIMITED',
        ip,
        path: request.nextUrl.pathname,
        message: `Rate limit exceeded: ${rateLimitResult.remaining} requests remaining`,
        details: { username: normalizedUsername, resetAfter: rateLimitResult.resetAfter }
      });
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetAfter / 1000)
        },
        {
          status: 429,
          headers
        }
      );
    }
    
    // Check if we should bypass cache (nocache, force, fresh parameters)
    const searchParams = request.nextUrl.searchParams;
    const bypassCache = searchParams.has('nocache') || searchParams.has('force') || searchParams.has('fresh');
    
    // Check multi-layer cache first (unless bypassing)
    const cachedProfile = !bypassCache ? await cacheService.getProfile(normalizedUsername) : null;
    
    if (cachedProfile) {
      // Cache hit - return cached data with CDN headers
      const responseTime = Date.now() - startTime;
      
      // Convert snake_case to camelCase for frontend compatibility
      const frontendProfile = createFrontendProfile(cachedProfile, {
        postsList: cachedProfile.posts_list || cachedProfile.posts || [],
        highlights: cachedProfile.highlights || [],
        storiesList: cachedProfile.stories || [],
      });
      
      return NextResponse.json({
        data: frontendProfile,
        source: 'cache',
        cached: true,
        responseTime,
        lastFetched: cachedProfile.last_fetched || cachedProfile.lastSyncedAt,
      }, {
        headers
      });
    }

    // Cache miss - fetch from Instagram API
    console.log(`Cache miss for ${normalizedUsername}, fetching from Instagram API`);
    const instagramProfile = await getInstagramProfile(normalizedUsername);

    // Validate that we have valid profile data before caching
    if (!instagramProfile || !instagramProfile.username || !instagramProfile.profilePicUrl) {
      console.error('Invalid profile data received from Instagram API:', instagramProfile);
      throw new Error('Invalid profile data received from Instagram API');
    }

    // Transform Instagram API response to our format
    const profileData = {
      username: instagramProfile.username,
      full_name: instagramProfile.fullName,
      bio: instagramProfile.bio,
      profile_pic_url: instagramProfile.profilePicUrl,
      followers_count: instagramProfile.followers || 0,
      following_count: instagramProfile.following || 0,
      posts_count: instagramProfile.posts || 0,
      is_verified: instagramProfile.isVerified,
      is_business_account: instagramProfile.isBusinessAccount || false,
      has_story: instagramProfile.hasStory || false,
      last_fetched: new Date().toISOString(),
      // Store stories, highlights, and posts as JSON
      stories: instagramProfile.storiesList || [],
      highlights: instagramProfile.highlights || [],
      posts_list: instagramProfile.postsList || [],
    };

    // Store in cache (both memory and database) - only if we have valid data
    await cacheService.storeProfile(normalizedUsername, profileData);

    // Store media in cache if available (legacy, now stored in posts_list JSON)
    if (instagramProfile.postsList && instagramProfile.postsList.length > 0) {
      // We need a profile ID, but we don't have it yet
      // For now, we'll store media with a placeholder profile ID
      // In a real implementation, we'd get the profile ID from the database
      const profileId = `ig_${normalizedUsername}`;
      await cacheService.storeMedia(profileId, instagramProfile.postsList);
    }

    const responseTime = Date.now() - startTime;
    
    // Create frontend-compatible profile data
    const frontendProfile = createFrontendProfile(profileData, instagramProfile);
    
    // Return fresh data with CDN headers (cache for 24 hours)
    return NextResponse.json({
      data: frontendProfile,
      source: 'api',
      cached: false,
      responseTime,
      lastFetched: profileData.last_fetched,
    }, {
      headers: getCacheHeaders(true, 'profile') // Cache fresh profile data
    });

  } catch (error: any) {
    console.error('Profile API error:', error);
    
    const responseTime = Date.now() - startTime;
    
    // Specifically detect our custom PERSONAL_ACCOUNT error from the instagram lib
    const isPersonalAccount = error?.message?.includes('PERSONAL_ACCOUNT') || error?.code === 110;
    
    const isNotFoundError = error?.message?.includes('Invalid user id') ||
                            error?.message?.includes('not found') ||
                            error?.message?.includes('not exist') ||
                            error?.message?.includes('does not exist');
    
    const isInstagramAPIError = error?.message?.includes('Instagram API Error');
    
    let status = 500;
    let errorMessage = 'Failed to connect to Instagram API';
    
    if (isPersonalAccount) {
      status = 403;
      errorMessage = 'Personal Account Restriction: This profile is a Personal account and cannot be fully accessed via the Instagram API. Public metadata fallback failed.';
    } else if (isNotFoundError) {
      status = 404;
      errorMessage = 'Profile not found or is not accessible via Instagram API';
    } else if (isInstagramAPIError) {
      status = 400;
      errorMessage = 'Instagram API limitation: This account may not be a Business/Creator account or has privacy restrictions';
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        responseTime,
        isPersonal: isPersonalAccount,
        note: isPersonalAccount 
          ? 'Instagram restricts deep data (like stories and full post lists) for Personal accounts. Conversion to a Business/Creator account is required for full API access.'
          : 'Some Instagram accounts (especially personal accounts) may not be accessible via the official API. This is an Instagram platform limitation.'
      },
      {
        status,
        headers: getCacheHeaders(false, 'profile')
      }
    );
  }
}

// Note: For rate limiting, consider using:
// 1. Vercel's built-in rate limiting
// 2. A dedicated middleware file
// 3. Cloudflare rate limiting rules