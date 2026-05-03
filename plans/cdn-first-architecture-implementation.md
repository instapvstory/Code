# CDN-First Architecture Implementation Plan
## InstaPVStory - Ultra Fast Instagram Profile Viewer SaaS

## **Architecture Overview**

```
User Request
    ↓
Cloudflare CDN (Cache Layer 1 - 70-90% traffic)
    ↓
Vercel Frontend + API Routes (Next.js Serverless)
    ↓
Supabase PostgreSQL (Cache Layer 2 - Persistent)
    ↓
Instagram API (Only on cache miss - <10% requests)
```

## **Current State Analysis**

### **Issues to Fix:**
1. **Redis Dependency**: Current cache service uses Redis (failing connection)
2. **Media Storage**: Current design stores media locally (against CDN-first principle)
3. **Complex Database**: Prisma + SQLite adds overhead
4. **No CDN Caching**: API responses not cached at edge

### **Target Architecture (Your Plan):**
- **CDN-First**: Cloudflare caches API responses
- **No Media Storage**: Only store metadata + URLs
- **No Redis**: Use database as persistent cache
- **Serverless**: Vercel + Supabase for scalability

## **Implementation Phases**

### **Phase 1: Database Setup**
1. Create Supabase account (free tier)
2. Set up PostgreSQL database
3. Create optimized schema
4. Configure connection

### **Phase 2: Remove Redis & Media Storage**
1. Replace Redis cache with database cache
2. Remove media download/storage logic
3. Update cache service to use Supabase
4. Remove Redis dependencies from package.json

### **Phase 3: CDN Configuration**
1. Set up Cloudflare CDN
2. Configure cache headers
3. Implement cache invalidation
4. Test CDN hit rates

### **Phase 4: API Optimization**
1. Update API routes with cache headers
2. Implement multi-layer cache logic
3. Add rate limiting
4. Optimize database queries

### **Phase 5: Deployment**
1. Configure Vercel deployment
2. Set up environment variables
3. Test end-to-end flow
4. Monitor performance

## **Detailed Implementation Steps**

### **Step 1: Supabase Database Setup**

#### **1.1 Create Supabase Account**
- Go to supabase.com
- Create new project "instapvstory"
- Note: Project URL, anon key, service role key

#### **1.2 Database Schema**
```sql
-- Profiles table
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    instagram_id VARCHAR(255) UNIQUE,
    full_name TEXT,
    bio TEXT,
    profile_pic_url TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_business_account BOOLEAN DEFAULT false,
    has_story BOOLEAN DEFAULT false,
    last_fetched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media cache table (stores only URLs, not files)
CREATE TABLE media_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    thumb_url TEXT,
    media_type VARCHAR(50) CHECK (media_type IN ('image', 'video', 'reel', 'story')),
    instagram_id VARCHAR(255),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_last_fetched ON profiles(last_fetched);
CREATE INDEX idx_media_cache_profile_id ON media_cache(profile_id);
CREATE INDEX idx_media_cache_created_at ON media_cache(created_at);
```

#### **1.3 Environment Variables**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Instagram API (optional for fallback)
INSTAGRAM_ACCESS_TOKEN=your-token

# Cache Configuration
CACHE_TTL_MINUTES=10
MAX_CACHE_AGE_HOURS=24
```

### **Step 2: Remove Redis Dependency**

#### **2.1 Update package.json**
```json
{
  "dependencies": {
    // Remove these:
    // "ioredis": "^5.10.1",
    // "redis": "^5.12.1",
    // "@prisma/client": "^7.6.0",
    // "prisma": "^7.6.0",
    // "@prisma/adapter-better-sqlite3": "^7.6.0",
    // "better-sqlite3": "^12.9.0",
    
    // Add these:
    "@supabase/supabase-js": "^2.39.0",
    "lru-cache": "^10.0.0"
  }
}
```

#### **2.2 New Cache Service (No Redis)**
```typescript
// src/lib/cache.ts
import { createClient } from '@supabase/supabase-js';
import LRU from 'lru-cache';

export class CacheService {
  private supabase;
  private memoryCache: LRU<string, any>;
  
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    
    this.memoryCache = new LRU({
      max: 1000, // 1000 items in memory
      ttl: 5 * 60 * 1000, // 5 minutes
    });
  }
  
  async getProfile(username: string) {
    // Layer 1: Memory cache
    const memoryKey = `profile:${username}`;
    const memoryCached = this.memoryCache.get(memoryKey);
    if (memoryCached) return memoryCached;
    
    // Layer 2: Database cache
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (data && this.isCacheValid(data.last_fetched)) {
      this.memoryCache.set(memoryKey, data);
      return data;
    }
    
    return null; // Cache miss
  }
  
  private isCacheValid(lastFetched: string): boolean {
    const cacheAge = Date.now() - new Date(lastFetched).getTime();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    return cacheAge < maxAge;
  }
}
```

### **Step 3: Cloudflare CDN Configuration**

#### **3.1 Cache Headers in API Routes**
```typescript
// src/app/api/profile/[username]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;
  
  // Set CDN cache headers
  const headers = new Headers({
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'CDN-Cache-Control': 'public, s-maxage=600',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
  });
  
  // Your API logic here...
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}
```

#### **3.2 Cloudflare Worker (Optional for advanced caching)**
```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Cache API responses
  if (url.pathname.startsWith('/api/')) {
    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    const responseToCache = response.clone();
    
    // Cache for 10 minutes
    const headers = new Headers(responseToCache.headers);
    headers.set('Cache-Control', 'public, max-age=600');
    
    event.waitUntil(
      cache.put(request, new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      }))
    );
    
    return response;
  }
  
  return fetch(request);
}
```

### **Step 4: Multi-Layer Cache System**

#### **4.1 Cache Flow Implementation**
```typescript
// src/lib/data-fetcher.ts
export async function getProfileData(username: string) {
  const cacheService = new CacheService();
  
  // Layer 1: Check memory cache
  const memoryData = cacheService.getFromMemory(username);
  if (memoryData) {
    console.log('Memory cache HIT');
    return memoryData;
  }
  
  // Layer 2: Check database cache
  const dbData = await cacheService.getFromDatabase(username);
  if (dbData && isCacheValid(dbData.last_fetched)) {
    console.log('Database cache HIT');
    cacheService.setToMemory(username, dbData);
    return dbData;
  }
  
  // Layer 3: Fetch from Instagram (cache miss)
  console.log('Cache MISS - fetching from Instagram');
  const freshData = await fetchFromInstagram(username);
  
  // Store in database cache
  await cacheService.storeInDatabase(username, freshData);
  
  // Store in memory cache
  cacheService.setToMemory(username, freshData);
  
  return freshData;
}
```

#### **4.2 Cache Validation Logic**
```typescript
function isCacheValid(lastFetched: Date): boolean {
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);
  
  // Different TTLs based on profile popularity
  if (diffInMinutes < 5) return true; // Very fresh
  if (diffInMinutes < 30) return true; // Still valid
  if (diffInMinutes < 60) return Math.random() > 0.3; // 70% chance to use cache
  return false; // Too old
}
```

### **Step 5: API Routes Optimization**

#### **5.1 Profile API Route**
```typescript
// src/app/api/profile/[username]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username.toLowerCase();
    
    // Rate limiting check
    const isRateLimited = await checkRateLimit(username, request);
    if (isRateLimited) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: getCacheHeaders(60) } // 1 minute cache for rate limit
      );
    }
    
    // Get data with caching
    const data = await getProfileData(username);
    
    // Set cache headers based on data freshness
    const cacheDuration = data.isFresh ? 600 : 300; // 10 min fresh, 5 min cached
    const headers = getCacheHeaders(cacheDuration);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Profile API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch profile data' }),
      { status: 500, headers: getCacheHeaders(60) }
    );
  }
}

function getCacheHeaders(seconds: number): Headers {
  return new Headers({
    'Cache-Control': `public, max-age=${seconds}, s-maxage=${seconds * 2}`,
    'CDN-Cache-Control': `public, s-maxage=${seconds * 2}`,
    'Content-Type': 'application/json',
  });
}
```

#### **5.2 Posts API Route**
```typescript
// src/app/api/posts/[username]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;
  
  // Check cache first
  const cacheKey = `posts:${username}`;
  const cached = await getFromCache(cacheKey);
  
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: getCacheHeaders(600), // 10 minutes for posts
    });
  }
  
  // Fetch and cache
  const posts = await fetchPosts(username);
  await storeInCache(cacheKey, posts, 600);
  
  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: getCacheHeaders(600),
  });
}
```

### **Step 6: Frontend Updates**

#### **6.1 Update Profile View Component**
```typescript
// src/components/viewer/ProfileView/ProfileView.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ProfileView({ username }: { username: string }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/profile/${username}`);
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [username]);
  
  // Render profile data...
}
```

#### **6.2 Add Loading States**
```typescript
// src/components/viewer/SkeletonLoader/SkeletonLoader.tsx
export default function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      {/* Skeleton UI for loading state */}
    </div>
  );
}
```

### **Step 7: Deployment Configuration**

#### **7.1 Vercel Configuration**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "headers": {
        "Cache-Control": "public, max-age=300, s-maxage=600"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### **7.2 Environment Variables in Vercel**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 8: Monitoring & Optimization**

#### **8.1 Performance Metrics**
```typescript
// src/lib/metrics.ts
export async function trackMetrics(
  endpoint: string,
  cacheHit: boolean,
  responseTime: number
) {
  // Send to analytics service
  console.log(`[METRICS] ${endpoint}: cache=${cacheHit}, time=${responseTime}ms`);
  
  // Track CDN hit rate
  if (typeof window !== 'undefined' && window.performance) {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('CDN timing:', timing);
  }
}
```

#### **8.2 Cache Hit Rate Monitoring**
```typescript
// Middleware to track cache performance
export async function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();
  const end = Date.now();
  
  const responseTime = end - start;
  const cacheStatus = response.headers.get('x-cache-status') || 'miss';
  
  // Log for monitoring
  console.log({
    url: request.url,
    cacheStatus,
    responseTime,
    timestamp: new Date().toISOString(),
  });
  
  return response;
}
```

## **Cost Analysis**

### **Free Tier Limits:**
- **Vercel**: 100GB bandwidth, unlimited serverless functions
- **Supabase**: 500MB database, 1GB bandwidth
- **Cloudflare**: Unlimited bandwidth, free CDN

### **Cost at 100k Users/Month:**
- **Vercel**: Free (within 100GB bandwidth)
- **Supabase**: Free (500MB database enough for metadata)
- **Cloudflare**: Free
- **Total Additional Cost**: $0

### **Bandwidth Calculation:**
- 100k users × 100KB/page = 10GB bandwidth
- Well within free tiers

## **Performance Targets**

### **Cache Hit Rates:**
- **CDN Cache**: 70-90% (Cloudflare edge)
- **Database Cache**: 90-95% of remaining
- **Instagram API Calls**: <5% of total requests

### **Response Times:**
- **CDN Cache Hit**: <100ms
- **Database Cache Hit**: <200ms
- **Instagram Fetch**: 1-3 seconds

### **Scalability:**
- Phase 1: 0-100k users/month (current architecture)
- Phase 2: 100k-1M users/month (add more caching layers)
- Phase 3: 1M+ users/month (external worker system)

## **Implementation Checklist**

### **Database Setup:**
- [ ] Create Supabase account
- [ ] Set up PostgreSQL database
- [ ] Create profiles table
- [ ] Create media_cache table
- [ ] Add indexes for performance

### **Code Changes:**
- [ ] Remove Redis dependencies
- [ ] Update cache service to use Supabase
- [ ] Add CDN cache headers to API routes
- [ ] Implement multi-layer cache logic
- [ ] Update frontend to use new API
- [ ] Add rate limiting

### **Deployment:**
- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Configure Cloudflare CDN
- [ ] Test end-to-end flow
- [ ] Monitor cache hit rates

### **Monitoring:**
- [ ] Set up performance tracking
- [ ] Monitor cache effectiveness
- [ ] Track Instagram API usage
- [ ] Set up alerts for issues

## **Next Steps**

1. **Approve this implementation plan**
2. **Switch to Code mode for execution**
3. **Implement Phase 1: Database setup**
4. **Test and deploy incrementally**

This architecture will deliver:
- **Ultra fast performance** (CDN-first)
- **Zero media storage costs**
- **Scalability to 100k+ users**
- **Production-ready reliability**
- **$0 additional monthly cost**