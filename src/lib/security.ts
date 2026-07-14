// Comprehensive security service for DDoS protection, bot detection, and spam filtering
// This service provides multiple layers of security for the application

import { NextRequest } from 'next/server';

// Security configuration from environment
const SECURITY_CONFIG = {
  // Rate limiting tiers
  RATE_LIMIT_TIERS: {
    STRICT: { requestsPerMinute: 30, requestsPerHour: 300 }, // For suspicious IPs
    NORMAL: { requestsPerMinute: 60, requestsPerHour: 1000 }, // Normal users
    TRUSTED: { requestsPerMinute: 120, requestsPerHour: 5000 }, // Trusted sources
  },
  
  // Bot detection thresholds
  BOT_DETECTION: {
    MIN_REQUEST_INTERVAL_MS: 50, // Requests faster than 50ms apart are suspicious
    MAX_REQUESTS_PER_SECOND: 10, // More than 10 requests/second is suspicious
    USER_AGENT_BLACKLIST: [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
      'phantom', 'headless', 'selenium', 'puppeteer', 'playwright'
    ],
  },
  
  // IP blocking
  IP_BLOCKING: {
    MAX_FAILED_REQUESTS: 10, // Block after 10 failed requests
    BLOCK_DURATION_MINUTES: 60, // Block for 60 minutes
    WHITELIST: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
    BLACKLIST: process.env.IP_BLACKLIST ? process.env.IP_BLACKLIST.split(',') : [],
  },
  
  // Request validation
  REQUEST_VALIDATION: {
    MAX_USERNAME_LENGTH: 30,
    MIN_USERNAME_LENGTH: 1,
    ALLOWED_USERNAME_CHARS: /^[a-zA-Z0-9._]+$/,
    MAX_CONTENT_LENGTH: 10000, // 10KB max request size
  },
};

// In-memory storage for security data (in production, use Redis)
class SecurityStore {
  private ipRequestTimestamps: Map<string, number[]> = new Map();
  private ipFailedCounts: Map<string, number> = new Map();
  private ipBlockedUntil: Map<string, number> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  
  // Track request timestamp for an IP
  trackRequest(ip: string): void {
    const now = Date.now();
    const timestamps = this.ipRequestTimestamps.get(ip) || [];
    timestamps.push(now);
    
    // Keep only last 100 timestamps for performance
    if (timestamps.length > 100) {
      timestamps.shift();
    }
    
    this.ipRequestTimestamps.set(ip, timestamps);
  }
  
  // Get request frequency for an IP
  getRequestFrequency(ip: string): { perSecond: number; perMinute: number } {
    const timestamps = this.ipRequestTimestamps.get(ip) || [];
    const now = Date.now();
    
    const lastSecond = timestamps.filter(ts => now - ts < 1000).length;
    const lastMinute = timestamps.filter(ts => now - ts < 60000).length;
    
    return { perSecond: lastSecond, perMinute: lastMinute };
  }
  
  // Increment failed request count
  incrementFailedRequest(ip: string): number {
    const count = (this.ipFailedCounts.get(ip) || 0) + 1;
    this.ipFailedCounts.set(ip, count);
    
    // Mark as suspicious if too many failures
    if (count >= SECURITY_CONFIG.IP_BLOCKING.MAX_FAILED_REQUESTS) {
      this.suspiciousIPs.add(ip);
      this.ipBlockedUntil.set(ip, Date.now() + SECURITY_CONFIG.IP_BLOCKING.BLOCK_DURATION_MINUTES * 60000);
    }
    
    return count;
  }
  
  // Check if IP is blocked
  isIPBlocked(ip: string): boolean {
    const blockedUntil = this.ipBlockedUntil.get(ip);
    if (!blockedUntil) return false;
    
    if (Date.now() > blockedUntil) {
      // Block expired
      this.ipBlockedUntil.delete(ip);
      this.ipFailedCounts.delete(ip);
      return false;
    }
    
    return true;
  }
  
  // Check if IP is suspicious
  isIPSuspicious(ip: string): boolean {
    return this.suspiciousIPs.has(ip) || this.isIPBlocked(ip);
  }
  
  // Get security stats for an IP
  getIPStats(ip: string) {
    const frequency = this.getRequestFrequency(ip);
    const failedCount = this.ipFailedCounts.get(ip) || 0;
    const isBlocked = this.isIPBlocked(ip);
    const isSuspicious = this.isIPSuspicious(ip);
    
    return {
      ip,
      requestFrequency: frequency,
      failedRequests: failedCount,
      isBlocked,
      isSuspicious,
      blockedUntil: this.ipBlockedUntil.get(ip),
    };
  }
  
  // Public methods for SecurityService to access private properties
  getBlockedUntil(ip: string): number | undefined {
    return this.ipBlockedUntil.get(ip);
  }
  
  setBlockedUntil(ip: string, timestamp: number): void {
    this.ipBlockedUntil.set(ip, timestamp);
  }
  
  addToSuspiciousIPs(ip: string): void {
    this.suspiciousIPs.add(ip);
  }
  
  removeFromSuspiciousIPs(ip: string): void {
    this.suspiciousIPs.delete(ip);
  }
  
  deleteFailedCount(ip: string): void {
    this.ipFailedCounts.delete(ip);
  }
  
  getBlockedIPsEntries(): [string, number][] {
    return Array.from(this.ipBlockedUntil.entries());
  }
  
  // Clean up old data
  cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Clean up old request timestamps
    for (const [ip, timestamps] of this.ipRequestTimestamps.entries()) {
      const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
      if (recentTimestamps.length === 0) {
        this.ipRequestTimestamps.delete(ip);
      } else {
        this.ipRequestTimestamps.set(ip, recentTimestamps);
      }
    }
    
    // Clean up expired blocks
    for (const [ip, blockedUntil] of this.ipBlockedUntil.entries()) {
      if (now > blockedUntil) {
        this.ipBlockedUntil.delete(ip);
        this.ipFailedCounts.delete(ip);
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Bot detection service
class BotDetector {
  static isLikelyBot(userAgent: string | null): boolean {
    if (!userAgent) return true; // No user agent is suspicious
    
    const ua = userAgent.toLowerCase();
    
    // Whitelist search engine crawlers and social share scrapers
    const searchEngines = [
      'googlebot',
      'google-coop',
      'bingbot',
      'yandexbot',
      'baiduspider',
      'duckduckbot',
      'slurp', // Yahoo
      'pinterestbot',
      'linkedinbot',
      'facebookexternalhit',
      'twitterbot'
    ];
    if (searchEngines.some(engine => ua.includes(engine))) {
      return false;
    }
    
    // Check against blacklisted user agents
    for (const botKeyword of SECURITY_CONFIG.BOT_DETECTION.USER_AGENT_BLACKLIST) {
      if (ua.includes(botKeyword)) {
        return true;
      }
    }
    
    // Check for common bot patterns
    const botPatterns = [
      /bot\//i,
      /crawler\//i,
      /spider\//i,
      /scraper\//i,
      /^curl\//i,
      /^wget\//i,
      /python-requests\//i,
      /java\//i,
      /phantomjs\//i,
      /headless/i,
      /selenium/i,
      /puppeteer/i,
      /playwright/i,
    ];
    
    return botPatterns.some(pattern => pattern.test(ua));
  }
  
  static isRequestTooFast(requestTimestamps: number[]): boolean {
    if (requestTimestamps.length < 2) return false;
    
    const lastTwo = requestTimestamps.slice(-2);
    const interval = lastTwo[1] - lastTwo[0];
    
    return interval < SECURITY_CONFIG.BOT_DETECTION.MIN_REQUEST_INTERVAL_MS;
  }
}

// Request validation service
class RequestValidator {
  static validateUsername(username: string): { valid: boolean; error?: string } {
    // Check length
    if (username.length < SECURITY_CONFIG.REQUEST_VALIDATION.MIN_USERNAME_LENGTH) {
      return { valid: false, error: 'Username too short' };
    }
    
    if (username.length > SECURITY_CONFIG.REQUEST_VALIDATION.MAX_USERNAME_LENGTH) {
      return { valid: false, error: 'Username too long' };
    }
    
    // Check allowed characters
    if (!SECURITY_CONFIG.REQUEST_VALIDATION.ALLOWED_USERNAME_CHARS.test(username)) {
      return { valid: false, error: 'Username contains invalid characters' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./, // Double dots
      /\/\//, // Double slashes
      /\\/,   // Backslashes
      /\.(php|asp|aspx|jsp|py|sh|exe|bat|cmd)$/i, // File extensions
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(username)) {
        return { valid: false, error: 'Suspicious username pattern detected' };
      }
    }
    
    return { valid: true };
  }
  
  static validateRequestSize(request: NextRequest): { valid: boolean; error?: string } {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > SECURITY_CONFIG.REQUEST_VALIDATION.MAX_CONTENT_LENGTH) {
        return { valid: false, error: 'Request too large' };
      }
    }
    
    return { valid: true };
  }
  
  static validateHeaders(request: NextRequest): { valid: boolean; error?: string } {
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    
    // Check for missing or suspicious headers
    if (!userAgent) {
      return { valid: false, error: 'Missing User-Agent header' };
    }
    
    // Additional header validation can be added here
    return { valid: true };
  }
}

// Main security service
export class SecurityService {
  private store: SecurityStore;
  
  constructor() {
    this.store = new SecurityStore();
    // Periodic cleanup
    setInterval(() => this.store.cleanup(), 60000); // Clean up every minute
  }
  
  // Analyze a request and determine security risk
  async analyzeRequest(request: NextRequest, username?: string): Promise<SecurityAnalysis> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent');
    const path = request.nextUrl.pathname;
    
    // Track the request
    this.store.trackRequest(ip);
    
    // Get request frequency
    const frequency = this.store.getRequestFrequency(ip);
    
    // Check if IP is blocked
    if (this.store.isIPBlocked(ip)) {
      return {
        allowed: false,
        riskLevel: 'BLOCKED',
        reasons: ['IP is temporarily blocked due to suspicious activity'],
        ip,
        userAgent,
        path,
      };
    }
    
    // Check IP whitelist/blacklist
    if (SECURITY_CONFIG.IP_BLOCKING.BLACKLIST.includes(ip)) {
      return {
        allowed: false,
        riskLevel: 'BLOCKED',
        reasons: ['IP is on the blacklist'],
        ip,
        userAgent,
        path,
      };
    }
    
    // Skip whitelist checks for whitelisted IPs
    const isWhitelisted = SECURITY_CONFIG.IP_BLOCKING.WHITELIST.includes(ip);
    
    // Bot detection
    const isBot = BotDetector.isLikelyBot(userAgent);
    const isRequestTooFast = frequency.perSecond > SECURITY_CONFIG.BOT_DETECTION.MAX_REQUESTS_PER_SECOND;
    
    // Request validation
    const requestSizeValid = RequestValidator.validateRequestSize(request);
    const headersValid = RequestValidator.validateHeaders(request);
    
    // Username validation if provided
    let usernameValid: { valid: boolean; error?: string } = { valid: true };
    if (username) {
      usernameValid = RequestValidator.validateUsername(username);
    }
    
    // Determine risk level
    let riskLevel: SecurityRiskLevel = 'LOW';
    const reasons: string[] = [];
    
    if (isBot) {
      riskLevel = 'HIGH';
      reasons.push('Bot-like User-Agent detected');
    }
    
    if (isRequestTooFast && !isWhitelisted) {
      riskLevel = 'HIGH';
      reasons.push(`Request rate too high: ${frequency.perSecond} requests/second`);
    }
    
    if (!requestSizeValid.valid) {
      riskLevel = 'HIGH';
      reasons.push(requestSizeValid.error!);
    }
    
    if (!headersValid.valid) {
      riskLevel = 'MEDIUM';
      reasons.push(headersValid.error!);
    }
    
    if (!usernameValid.valid && username) {
      riskLevel = 'HIGH';
      reasons.push(usernameValid.error || 'Invalid username');
    }
    
    // Check if IP is suspicious
    if (this.store.isIPSuspicious(ip) && !isWhitelisted) {
      riskLevel = 'HIGH';
      reasons.push('IP has suspicious activity history');
    }
    
    // Determine if request should be allowed
    const allowed = riskLevel !== 'HIGH' || isWhitelisted;
    
    // If request is denied due to high risk, increment failed count
    if (!allowed && !isWhitelisted) {
      this.store.incrementFailedRequest(ip);
    }
    
    return {
      allowed,
      riskLevel,
      reasons,
      ip,
      userAgent,
      path,
      requestFrequency: frequency,
      isWhitelisted,
    };
  }
  
  // Get client IP from request
  private getClientIP(request: NextRequest): string {
    // Try to get IP from headers (behind proxy)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }
    
    // Fallback to remote address (for development)
    return '127.0.0.1';
  }
  
  // Get security stats for an IP
  getSecurityStats(ip: string) {
    return this.store.getIPStats(ip);
  }
  
  // Manually block an IP
  blockIP(ip: string, durationMinutes: number = 60): void {
    this.store.setBlockedUntil(ip, Date.now() + durationMinutes * 60000);
    this.store.addToSuspiciousIPs(ip);
  }
  
  // Manually unblock an IP
  unblockIP(ip: string): void {
    const blockedUntil = this.store.getBlockedUntil(ip);
    if (blockedUntil) {
      // Use the public methods
      this.store.setBlockedUntil(ip, 0); // Set to past time
    }
    this.store.removeFromSuspiciousIPs(ip);
    this.store.deleteFailedCount(ip);
  }
  
  // Get all blocked IPs
  getBlockedIPs(): string[] {
    const now = Date.now();
    const blockedIPs: string[] = [];
    
    const blockedEntries = this.store.getBlockedIPsEntries();
    for (const [ip, blockedUntil] of blockedEntries) {
      if (now < blockedUntil) {
        blockedIPs.push(ip);
      }
    }
    
    return blockedIPs;
  }
}

// Types
export type SecurityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';

export interface SecurityAnalysis {
  allowed: boolean;
  riskLevel: SecurityRiskLevel;
  reasons: string[];
  ip: string;
  userAgent: string | null;
  path: string;
  requestFrequency?: { perSecond: number; perMinute: number };
  isWhitelisted?: boolean;
}

// Create singleton instance
export const securityService = new SecurityService();