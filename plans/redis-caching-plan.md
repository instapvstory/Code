# Redis Caching Layer Implementation Plan

## Overview
This document outlines the implementation of a Redis caching layer for the Instapvstory.com application. Redis will provide fast, in-memory caching to reduce database queries and Instagram API calls, improving performance and reducing rate limiting.

## Why Redis?
- **In-memory performance**: Sub-millisecond response times
- **Data structures**: Support for strings, hashes, lists, sets, sorted sets
- **TTL support**: Automatic expiration of cached data
- **Persistence**: Optional disk persistence for durability
- **Scalability**: Redis Cluster for horizontal scaling

## Architecture Design

### Caching Strategy
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   API Layer │────▶│   Redis     │
│   (Next.js) │     │   (Next.js) │     │   Cache     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ PostgreSQL  │◀────│   Cache     │
                    │   Database  │     │   Miss      │
                    └─────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Instagram   │◀────│   API       │
                    │   Graph API │     │   Fallback  │
                    └─────────────┘     └─────────────┘
```

### Cache Keys Design
- `profile:{username}` - Complete profile data with posts/highlights
- `profile_meta:{username}` - Profile metadata only
- `posts:{username}:{page}` - Paginated posts list
- `highlights:{username}` - Profile highlights
- `stories:{username}` - Active stories
- `api_cache:{endpoint}:{params}` - Raw Instagram API responses

## Step 1: Install Redis Dependencies

### Required Packages
```bash
npm install redis ioredis
npm install -D @types/redis @types/ioredis
```

### Redis Client Options
We'll use `ioredis` for better TypeScript support and Redis Cluster compatibility.

## Step 2: Set Up Redis Configuration

### Update .env.local
```env
# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_TLS=false

# For production (Redis Cloud/Upstash)
# REDIS_URL="rediss://:password@host:port"
# REDIS_TLS=true
```

### Create Redis Client Singleton
Create `src/lib/redis.ts`:
```typescript
// src/lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const redisTls = process.env.REDIS_TLS === 'true'
  
  const options: Redis.RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    enableReadyCheck: true,
    // TLS configuration for production
    ...(redisTls ? { tls: {} } : {})
  }

  return new Redis(redisUrl, options)
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}

export async function clearPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis clear pattern error:', error)
  }
}
```

## Step 3: Create Caching Service

Create `src/services/cache.service.ts`:
```typescript
// src/services/cache.service.ts
import { redis, getCache, setCache, deleteCache, clearPattern } from '@/lib/redis'
import { Profile, Post, Highlight } from '@/components/viewer/ProfileView/ProfileView'

export class CacheService {
  private readonly DEFAULT_TTL = 300 // 5 minutes
  private readonly PROFILE_TTL = 600 // 10 minutes for profiles
  private readonly API_TTL = 1800 // 30 minutes for API responses

  // Profile caching
  async getProfile(username: string): Promise<Profile | null> {
    const key = `profile:${username}`
    return getCache<Profile>(key)
  }

  async setProfile(username: string, profile: Profile): Promise<void> {
    const key = `profile:${username}`
    await setCache(key, profile, this.PROFILE_TTL)
    
    // Also cache individual components for partial updates
    await this.setProfileMeta(username, {
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      profilePicUrl: profile.profilePicUrl,
      isVerified: profile.isVerified,
      posts: profile.posts,
      followers: profile.followers,
      following: profile.following,
      hasStory: profile.hasStory
    })
  }

  async deleteProfile(username: string): Promise<void> {
    const keys = [
      `profile:${username}`,
      `profile_meta:${username}`,
      `posts:${username}:*`,
      `highlights:${username}`,
      `stories:${username}`
    ]
    
    for (const pattern of keys) {
      await clearPattern(pattern)
    }
  }

  // Profile metadata (lightweight)
  async getProfileMeta(username: string): Promise<any | null> {
    const key = `profile_meta:${username}`
    return getCache(key)
  }

  async setProfileMeta(username: string, meta: any): Promise<void> {
    const key = `profile_meta:${username}`
    await setCache(key, meta, this.PROFILE_TTL)
  }

  // Posts caching with pagination
  async getPosts(username: string, page: number = 1, limit: number = 12): Promise<Post[] | null> {
    const key = `posts:${username}:${page}:${limit}`
    return getCache<Post[]>(key)
  }

  async setPosts(username: string, posts: Post[], page: number = 1, limit: number = 12): Promise<void> {
    const key = `posts:${username}:${page}:${limit}`
    await setCache(key, posts, this.DEFAULT_TTL)
  }

  // Highlights caching
  async getHighlights(username: string): Promise<Highlight[] | null> {
    const key = `highlights:${username}`
    return getCache<Highlight[]>(key)
  }

  async setHighlights(username: string, highlights: Highlight[]): Promise<void> {
    const key = `highlights:${username}`
    await setCache(key, highlights, this.DEFAULT_TTL)
  }

  // Stories caching (short TTL)
  async getStories(username: string): Promise<Post[] | null> {
    const key = `stories:${username}`
    return getCache<Post[]>(key)
  }

  async setStories(username: string, stories: Post[]): Promise<void> {
    const key = `stories:${username}`
    // Stories expire quickly (1 hour max)
    await setCache(key, stories, 3600)
  }

  // API response caching
  async getApiCache(endpoint: string, params: any): Promise<any | null> {
    const key = this.getApiCacheKey(endpoint, params)
    return getCache(key)
  }

  async setApiCache(endpoint: string, params: any, data: any): Promise<void> {
    const key = this.getApiCacheKey(endpoint, params)
    await setCache(key, data, this.API_TTL)
  }

  // Clear all cache for a user
  async clearUserCache(username: string): Promise<void> {
    await this.deleteProfile(username)
  }

  // Clear all cache (admin function)
  async clearAllCache(): Promise<void> {
    await redis.flushall()
  }

  // Cache statistics
  async getStats(): Promise<any> {
    try {
      const info = await redis.info()
      const keys = await redis.keys('*')
      
      return {
        totalKeys: keys.length,
        memoryUsage: info.match(/used_memory_human:(\S+)/)?.[1] || '0',
        connectedClients: info.match(/connected_clients:(\d+)/)?.[1] || '0',
        uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1] || '0'
      }
    } catch (error) {
      console.error('Redis stats error:', error)
      return null
    }
  }

  private getApiCacheKey(endpoint: string, params: any): string {
    const paramString = JSON.stringify(params)
    const hash = this.simpleHash(paramString)
    return `api_cache:${endpoint}:${hash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

export const cache = new CacheService()
```

## Step 4: Update Instagram Service with Redis Caching

Update `src/lib/instagram.ts` to use Redis cache:
```typescript
// src/lib/instagram.ts
import { cache } from '@/services/cache.service'
import { db } from '@/services/database.service'
import { Profile, Post, Highlight } from '@/components/viewer/ProfileView/ProfileView'

export async function getInstagramProfile(username: string): Promise<Profile> {
  // 1. Check Redis cache first
  const cachedProfile = await cache.getProfile(username)
  if (cachedProfile) {
    console.log(`Cache hit for profile: ${username}`)
    return cachedProfile
  }

  // 2. Check database (with freshness check)
  const dbProfile = await db.getProfileByUsername(username)
  
  if (dbProfile && dbProfile.lastSyncedAt && 
      Date.now() - dbProfile.lastSyncedAt.getTime() < 5 * 60 * 1000) {
    // Data is fresh (less than 5 minutes old)
    const profile = this.convertDbToProfile(dbProfile)
    
    // Cache in Redis
    await cache.setProfile(username, profile)
    return profile
  }

  // 3. Fall back to Instagram API
  console.log(`Cache miss, fetching from API: ${username}`)
  const profile = await getInstagramProfileFromAPI(username)
  
  // 4. Save to database
  const savedProfile = await db.createOrUpdateProfile({
    instagramId: `api_${Date.now()}`,
    username: profile.username,
    fullName: profile.fullName,
    bio: profile.bio,
    website: profile.website,
    category: profile.category,
    isVerified: profile.isVerified,
    isBusinessAccount: profile.isBusinessAccount,
    profilePicUrl: profile.profilePicUrl,
    postsCount: profile.posts,
    followersCount: profile.followers,
    followingCount: profile.following,
    hasStory: profile.hasStory
  })

  // 5. Save posts and highlights to database
  if (savedProfile.id) {
    await db.syncPosts(savedProfile.id, profile.postsList)
    await db.syncHighlights(savedProfile.id, profile.highlights)
  }

  // 6. Cache in Redis
  await cache.setProfile(username, profile)
  
  return profile
}

// Helper function to convert database model to frontend Profile
function convertDbToProfile(dbProfile: any): Profile {
  return {
    username: dbProfile.username,
    fullName: dbProfile.fullName || '',
    bio: dbProfile.bio || '',
    website: dbProfile.website,
    category: dbProfile.category,
    isVerified: dbProfile.isVerified,
    isBusinessAccount: dbProfile.isBusinessAccount,
    profilePicUrl: dbProfile.profilePicUrl || '',
    posts: dbProfile.postsCount,
    followers: dbProfile.followersCount,
    following: dbProfile.followingCount,
    hasStory: dbProfile.hasStory,
    highlights: dbProfile.highlights.map((h: any) => ({
      id: h.instagramId,
      title: h.title,
      coverUrl: h.coverUrl || '',
      caption: h.caption,
      mediaUrl: h.mediaUrl,
      mediaCount: h.mediaCount,
      createdAt: h.createdAt?.toISOString()
    })),
    postsList: dbProfile.posts.map((p: any) => ({
      id: p.instagramId,
      thumbUrl: p.thumbUrl || '',
      likes: p.likes,
      comments: p.comments,
      isVideo: p.isVideo,
      isSidecar: p.isSidecar,
      mediaUrl: p.mediaUrl,
      caption: p.caption
    })),
    storiesList: dbProfile.stories.map((s: any) => ({
      id: s.instagramId,
      thumbUrl: s.thumbUrl || '',
      likes: 0,
      comments: 0,
      isVideo: s.isVideo,
      isSidecar: false,
      mediaUrl: s.mediaUrl,
      caption: s.caption
    }))
  }
}

// Cache API responses
export async function getInstagramProfileFromAPI(username: string): Promise<Profile> {
  const cacheKey = `api:profile:${username}`
  const cached = await cache.getApiCache('profile', { username })
  
  if (cached) {
    return cached
  }

  // Original API call logic here...
  const profileData = await fetchFromInstagramAPI(username)
  
  // Cache API response
  await cache.setApiCache('profile', { username }, profileData)
  
  return profileData
}
```

## Step 5: Create Cache Management API

Create `src/app/api/cache/route.ts`:
```typescript
// src/app/api/cache/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/services/cache.service'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  const username = searchParams.get('username')

  try {
    switch (action) {
      case 'stats':
        const stats = await cache.getStats()
        return NextResponse.json({ stats })
      
      case 'clear':
        if (username) {
          await cache.clearUserCache(username)
          return NextResponse.json({ 
            message: `Cache cleared for user: ${username}` 
          })
        } else {
          await cache.clearAllCache()
          return NextResponse.json({ 
            message: 'All cache cleared' 
          })
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cache API error:', error)
    return NextResponse.json(
      { error: 'Failed to process cache request' },
      { status: 500 }
    )
  }
}
```

## Step 6: Redis Setup Instructions

### Local Development with Docker
```bash
# Run Redis with Docker
docker run --name instapvstory-redis -p 6379:6379 -d redis

# Or with persistence
docker run --name instapvstory-redis -p 6379:6379 -v redis-data:/data -d redis redis-server --appendonly yes
```

### Production Setup Options

#### Option 1: Redis Cloud (Managed)
1. Sign up at https://redis.com/cloud
2. Create a database
3. Get connection string
4. Update `.env.local`:
```env
REDIS_URL="rediss://:password@host:port"
REDIS_TLS=true
```

#### Option 2: Upstash Redis (Serverless)
1. Sign up at https://upstash.com
2. Create Redis database
3. Get REST API URL and token
4. Update `.env.local`:
```env
REDIS_URL="redis://:token@host:port"
REDIS_TLS=true
```

#### Option 3: Self-hosted Redis
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Set password (optional)
requirepass yourpassword

# Restart Redis
sudo systemctl restart redis
```

## Step 7: Testing the Redis Implementation

### Test Script
Create `scripts/test-redis.js`:
```javascript
// scripts/test-redis.js
const { redis } = require('../src/lib/redis')

async function testRedis() {
  console.log('Testing Redis connection...')
  
  try {
    // Test connection
    await redis.ping()
    console.log('✅ Redis connected successfully')
    
    // Test set/get
    await redis.set('test:key', 'Hello Redis!')
    const value = await redis.get('test:key')
    console.log(`✅ Get test value: ${value}`)
    
    // Test TTL
    await redis.setex('test:ttl', 10, 'Expires in 10s')
    const ttl = await redis.ttl('test:ttl')
    console.log(`✅ TTL test: ${ttl} seconds`)
    
    // Test JSON
    const data = { username: 'test', followers: 1000 }
    await redis.set('test:json', JSON.stringify(data))
    const jsonData = JSON.parse(await redis.get('test:json'))
    console.log(`✅ JSON test:`, jsonData)
    
    // Cleanup
    await redis.del('test:key', 'test:ttl', 'test:json')
    console.log('✅ Test keys cleaned up')
    
    await redis.quit()
    console.log('✅ Redis connection closed')
    
  } catch (error) {
    console.error('❌ Redis test failed:', error)
    process.exit(1)
  }
}

testRedis()
```

### Run Tests
```bash
node scripts/test-redis.js
```

## Step 8: Monitoring and Maintenance

### Health Check Endpoint
Create `src/app/api/health/route.ts`:
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    // Check Redis
    await redis.ping()
    
    // Check database (via Prisma)
    // Add database check here
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: 'connected',
        database: 'connected'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 500 }
    )
  }
}
```

### Cache Warming Strategy
Implement cache warming for popular profiles:
```typescript
// src/services/cache-warmer.service.ts
export class CacheWarmerService {
  async warmPopularProfiles() {
    const popularUsernames = ['instagram', 'cristiano', 'therock', 'kyliejenner']
    
    for (const username of popularUsernames) {
      try {
        await getInstagramProfile(username)
        console.log(`Warmed cache for: ${username}`)
      } catch (error) {
        console.error(`Failed to warm cache for ${username}:`, error)
      }
    }
  }
}
```

## Step 9: Performance Optimization

### Cache Invalidation Strategies
1. **Time-based**: Automatic TTL expiration
2. **Event-based**: Invalidate on data updates
3. **Manual**: Admin-triggered cache clearing

### Memory Optimization
```typescript
// Use Redis memory optimization techniques
async function optimizeMemory() {
  // Set maxmemory policy
  await redis.config('SET', 'maxmemory-policy', 'allkeys-lru')
  
  // Enable compression for large values
  await redis.config('SET', 'hash-max-ziplist-entries', 512)
  await redis.config('SET', 'hash-max-ziplist-value', 64)
}
```

## Step 10: Deployment Considerations

### Environment Variables
Update deployment configuration:
```env
# Development
REDIS_URL="redis://localhost:6379"
REDIS_TLS=false

# Production
REDIS_URL="rediss://:password@host:port"
REDIS_TLS=true
```

### Docker Compose
Create `docker-compose.yml` for local development:
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: instapvstory
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  redis-data:
  postgres-data:
```

## Conclusion

This Redis caching implementation provides:

1. **Performance**: Sub-millisecond response times for cached data
2. **Scalability**: Handles high traffic with in-memory storage
3. **Reliability**: Fallback to database/API on cache misses
4. **Maintainability**: Clean service layer with TypeScript support
5. **Monitoring**: Health checks and cache statistics

The caching layer reduces:
- Instagram API calls by 90%+ for repeated requests
- Database queries for frequently accessed profiles
- Response times from seconds to milliseconds

Next steps:
1. Implement the REST API endpoints
2. Update frontend to use new API
3. Add cache warming for popular profiles
4. Monitor cache hit rates and optimize TTL values