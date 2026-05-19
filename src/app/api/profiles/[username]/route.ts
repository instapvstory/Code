import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';
import { getInstagramProfile } from '@/lib/instagram';
import { rateLimiter } from '@/lib/rate-limit';
import { securityMiddleware, logSecurityEvent } from '@/lib/security-middleware';
import { fetchProfileData } from '@/lib/profile-service';
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

// Helper functions removed as they are now in profile-service.ts



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
    
    // Check multi-layer cache first (unless bypassing) or fetch from API
    const { profile, source } = await fetchProfileData(normalizedUsername, bypassCache);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      data: profile,
      source: source,
      cached: source === 'cache',
      responseTime,
      // @ts-ignore
      lastFetched: profile.lastFetched || new Date().toISOString(),
    }, {
      headers: getCacheHeaders(source === 'api', 'profile')
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