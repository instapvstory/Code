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

  // Check if a request is allowed
  isAllowed(key: string, limit?: number, windowMs?: number): { allowed: boolean; remaining: number; resetAfter: number } {
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
    
    if (allowed) {
      window.count++;
    }
    
    // Clean up old windows periodically (simple cleanup)
    if (Math.random() < 0.01) { // 1% chance to clean up on each request
      this.cleanup();
    }
    
    return {
      allowed,
      remaining: Math.max(0, maxRequests - window.count),
      resetAfter: Math.max(0, window.resetTime - now)
    };
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
  
  // Get rate limit headers
  getHeaders(key: string, limit?: number, windowMs?: number): Record<string, string> {
    const result = this.isAllowed(key, limit, windowMs);
    
    return {
      'X-RateLimit-Limit': (limit || this.defaultLimit).toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetAfter / 1000).toString(),
    };
  }
}

// Create singleton instance with defaults from environment
const rateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  60 * 1000 // 1 minute window
);

export { rateLimiter, RateLimiter };