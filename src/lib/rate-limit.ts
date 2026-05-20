// Simple in-memory rate limiter for API protection
// In production, consider using:
// 1. Redis for distributed rate limiting
// 2. Cloudflare rate limiting at the edge
// 3. Vercel's built-in rate limiting

interface RateLimitWindow {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private windows: Map<string, RateLimitWindow>;
  private readonly defaultLimit: number;
  private readonly defaultWindowMs: number;

  constructor(defaultLimit: number = 60, defaultWindowMs: number = 60 * 1000) {
    this.windows = new Map();
    this.defaultLimit = defaultLimit;
    this.defaultWindowMs = defaultWindowMs;
  }

  // Core check method, with optional incrementing
  private check(key: string, limit?: number, windowMs?: number, increment: boolean = true): { 
    allowed: boolean; 
    remaining: number; 
    resetAfter: number;
    headers: Record<string, string>;
  } {
    const now = Date.now();
    const windowKey = `${key}:${limit || this.defaultLimit}:${windowMs || this.defaultWindowMs}`;
    
    let window = this.windows.get(windowKey);
    
    // Create new window if none exists or window has expired
    if (!window || now >= window.resetTime) {
      window = {
        count: 0,
        resetTime: now + (windowMs || this.defaultWindowMs)
      };
      this.windows.set(windowKey, window);
    }
    
    // Check if limit is exceeded
    const maxRequests = limit || this.defaultLimit;
    const allowed = window.count < maxRequests;
    
    if (allowed && increment) {
      window.count++;
    }
    
    // Clean up old windows periodically (simple cleanup)
    if (Math.random() < 0.01) { // 1% chance to clean up on each request
      this.cleanup();
    }
    
    const remaining = Math.max(0, maxRequests - window.count);
    const resetAfter = Math.max(0, window.resetTime - now);
    
    return {
      allowed,
      remaining,
      resetAfter,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetAfter / 1000).toString(),
      }
    };
  }

  // Check if a request is allowed (increments the counter)
  isAllowed(key: string, limit?: number, windowMs?: number): { allowed: boolean; remaining: number; resetAfter: number } {
    const result = this.check(key, limit, windowMs, true);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAfter: result.resetAfter
    };
  }
  
  // Get current status without incrementing
  getStatus(key: string, limit?: number, windowMs?: number): { 
    allowed: boolean; 
    remaining: number; 
    resetAfter: number; 
    headers: Record<string, string>;
  } {
    return this.check(key, limit, windowMs, false);
  }
  
  // Get rate limit headers (uses current state, does NOT increment)
  getHeaders(key: string, limit?: number, windowMs?: number): Record<string, string> {
    return this.check(key, limit, windowMs, false).headers;
  }

  // Clean up expired windows
  private cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      if (now >= window.resetTime) {
        this.windows.delete(key);
      }
    }
  }
}

// Create singleton instance with defaults from environment
const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  60 * 1000 // 1 minute window
);

export { rateLimiter, RateLimiter };