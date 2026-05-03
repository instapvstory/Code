// Security middleware for Next.js API routes
// Provides comprehensive security checks before processing requests

import { NextRequest, NextResponse } from 'next/server';
import { securityService } from './security';
import { rateLimiter } from './rate-limit';

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Enhanced rate limiting with security integration
export async function securityMiddleware(
  request: NextRequest,
  username?: string
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const path = request.nextUrl.pathname;
  
  // Step 1: Apply security headers to all responses
  const applySecurityHeaders = (response: NextResponse): NextResponse => {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };
  
  // Step 2: Check Cloudflare Turnstile (if enabled)
  if (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    const turnstileToken = request.headers.get('cf-turnstile-response');
    if (!turnstileToken) {
      const response = NextResponse.json(
        { error: 'Cloudflare Turnstile verification required' },
        { status: 403 }
      );
      return applySecurityHeaders(response);
    }
    
    // Verify Turnstile token (simplified - implement actual verification)
    const isValid = await verifyCloudflareTurnstile(turnstileToken, ip);
    if (!isValid) {
      const response = NextResponse.json(
        { error: 'Invalid Cloudflare Turnstile token' },
        { status: 403 }
      );
      return applySecurityHeaders(response);
    }
  }
  
  // Step 3: Comprehensive security analysis
  const securityAnalysis = await securityService.analyzeRequest(request, username);
  
  if (!securityAnalysis.allowed) {
    // Log the security violation
    console.warn(`Security violation blocked:`, {
      ip: securityAnalysis.ip,
      path: securityAnalysis.path,
      reasons: securityAnalysis.reasons,
      userAgent: securityAnalysis.userAgent,
      riskLevel: securityAnalysis.riskLevel,
    });
    
    const response = NextResponse.json(
      { 
        error: 'Access denied',
        message: 'Security policy violation detected',
        reasons: securityAnalysis.reasons,
        requestId: generateRequestId()
      },
      { status: 403 }
    );
    
    // Add security headers
    return applySecurityHeaders(response);
  }
  
  // Step 4: Enhanced rate limiting with security context
  const rateLimitKey = `security:${ip}:${path}`;
  const isRateLimited = !rateLimiter.isAllowed(rateLimitKey).allowed;
  
  if (isRateLimited) {
    const response = NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later'
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    const rateLimitHeaders = rateLimiter.getHeaders(rateLimitKey);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return applySecurityHeaders(response);
  }
  
  // Step 5: Request validation
  if (username) {
    // Validate username format
    if (username.length > 100) {
      const response = NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }
    
    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /exec(\s|\+)+(s|x)p\w+/i,
    ];
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(username)) {
        const response = NextResponse.json(
          { error: 'Invalid input detected' },
          { status: 400 }
        );
        return applySecurityHeaders(response);
      }
    }
  }
  
  // Step 6: Check for suspicious patterns in request
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /\/etc\/passwd/, // File access attempts
    /\/bin\/sh/, // Shell access
    /<script>/i, // XSS attempts
    /onload=/i, // XSS attempts
    /javascript:/i, // XSS attempts
  ];
  
  const url = request.url.toLowerCase();
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      const response = NextResponse.json(
        { error: 'Suspicious request pattern detected' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }
  }
  
  // Request passed all security checks
  return null;
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return '127.0.0.1';
}

// Generate a unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Verify Cloudflare Turnstile token (simplified - implement actual API call)
async function verifyCloudflareTurnstile(token: string, ip: string): Promise<boolean> {
  if (!process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    return true; // Skip verification if not configured
  }
  
  try {
    // In production, make actual API call to Cloudflare
    // const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    //     response: token,
    //     remoteip: ip,
    //   }),
    // });
    // const data = await response.json();
    // return data.success === true;
    
    // For now, return true for development
    return true;
  } catch (error) {
    console.error('Cloudflare Turnstile verification error:', error);
    return false;
  }
}

// Security monitoring function
export function logSecurityEvent(event: SecurityEvent): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event,
  };
  
  console.log(`[SECURITY] ${timestamp}: ${event.type} - ${event.ip} - ${event.message}`);
  
  // In production, send to security monitoring service
  // Example: Sentry, Datadog, or custom security logging
}

// Security event types
export interface SecurityEvent {
  type: 'BLOCKED' | 'SUSPICIOUS' | 'RATE_LIMITED' | 'ATTEMPT' | 'SUCCESS';
  ip: string;
  path: string;
  message: string;
  details?: Record<string, any>;
}

// Export security headers for use in other routes
export { SECURITY_HEADERS };