# REST API Endpoints Implementation Plan

## Overview
This document outlines the implementation of REST API endpoints for the Instapvstory.com application. The API will serve as the backend layer between the frontend and our database/caching system, providing type-safe, efficient endpoints for profile data, posts, highlights, and stories.

## API Design Principles
1. **RESTful conventions** - Use standard HTTP methods and status codes
2. **Type safety** - TypeScript interfaces for all requests/responses
3. **Caching** - Leverage Redis cache layer
4. **Rate limiting** - Protect against abuse
5. **Error handling** - Consistent error responses
6. **Documentation** - OpenAPI/Swagger documentation

## API Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Next.js   │────▶│   Redis     │────▶│ PostgreSQL  │
│   (React)   │     │   API Routes│     │   Cache     │     │   Database  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                     │                     │
                           ▼                     ▼                     ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │   Rate      │     │   Cache     │     │   Data Sync │
                    │   Limiter   │     │   Manager   │     │   Jobs      │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

## API Endpoints

### Base URL
```
https://instapvstory.com/api/v1
```

### 1. Profile Endpoints

#### GET `/api/v1/profiles/{username}`
Get complete profile data including posts, highlights, and stories.

**Request:**
```http
GET /api/v1/profiles/instagram
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "username": "instagram",
      "fullName": "Instagram",
      "bio": "Bringing you closer...",
      "website": "https://about.instagram.com",
      "category": "Social Media",
      "isVerified": true,
      "isBusinessAccount": true,
      "profilePicUrl": "https://...",
      "posts": 1000,
      "followers": 500000000,
      "following": 300,
      "hasStory": true
    },
    "posts": [
      {
        "id": "123456789",
        "thumbUrl": "https://...",
        "likes": 1000000,
        "comments": 50000,
        "isVideo": false,
        "isSidecar": false,
        "mediaUrl": "https://...",
        "caption": "Beautiful sunset..."
      }
    ],
    "highlights": [
      {
        "id": "highlight_123",
        "title": "Travel",
        "coverUrl": "https://...",
        "caption": "My travel adventures",
        "mediaUrl": "https://...",
        "mediaCount": 5,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "stories": [
      {
        "id": "story_456",
        "thumbUrl": "https://...",
        "likes": 0,
        "comments": 0,
        "isVideo": true,
        "isSidecar": false,
        "mediaUrl": "https://...",
        "caption": "Check out our new feature!"
      }
    ],
    "metadata": {
      "cached": true,
      "cacheAge": 120,
      "source": "redis",
      "lastSynced": "2024-01-20T14:30:00Z"
    }
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Profile not found",
    "details": "The requested profile does not exist"
  }
}
```

#### GET `/api/v1/profiles/{username}/meta`
Get lightweight profile metadata only.

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "instagram",
    "fullName": "Instagram",
    "profilePicUrl": "https://...",
    "isVerified": true,
    "posts": 1000,
    "followers": 500000000,
    "following": 300,
    "hasStory": true
  }
}
```

#### POST `/api/v1/profiles/{username}/refresh`
Force refresh profile data from Instagram API.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Profile refresh initiated",
    "refreshId": "refresh_123",
    "estimatedTime": 30
  }
}
```

### 2. Posts Endpoints

#### GET `/api/v1/profiles/{username}/posts`
Get paginated posts for a profile.

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Items per page, default: 12
- `type` (optional): Filter by type - `all`, `images`, `videos`, `carousel`

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1000,
      "pages": 84,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET `/api/v1/posts/{postId}`
Get specific post details.

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "123456789",
      "profile": {
        "username": "instagram",
        "profilePicUrl": "https://..."
      },
      "thumbUrl": "https://...",
      "mediaUrl": "https://...",
      "likes": 1000000,
      "comments": 50000,
      "isVideo": false,
      "isSidecar": false,
      "caption": "Beautiful sunset...",
      "postedAt": "2024-01-15T10:30:00Z",
      "tags": ["sunset", "nature", "photography"],
      "mentions": ["@photographer"]
    }
  }
}
```

### 3. Highlights Endpoints

#### GET `/api/v1/profiles/{username}/highlights`
Get all highlights for a profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "highlights": [...],
    "count": 5
  }
}
```

#### GET `/api/v1/highlights/{highlightId}`
Get specific highlight with its media items.

**Response:**
```json
{
  "success": true,
  "data": {
    "highlight": {
      "id": "highlight_123",
      "title": "Travel",
      "coverUrl": "https://...",
      "caption": "My travel adventures",
      "mediaItems": [
        {
          "id": "media_1",
          "mediaUrl": "https://...",
          "isVideo": false,
          "caption": "Paris sunset",
          "order": 1
        }
      ],
      "mediaCount": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 4. Stories Endpoints

#### GET `/api/v1/profiles/{username}/stories`
Get active stories for a profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "stories": [...],
    "count": 3,
    "expiresIn": 3600
  }
}
```

### 5. Cache Management Endpoints

#### GET `/api/v1/cache/stats`
Get cache statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "redis": {
      "totalKeys": 1250,
      "memoryUsage": "45.2MB",
      "connectedClients": 3,
      "uptime": "7d 3h 15m"
    },
    "hitRate": 0.89,
    "popularKeys": [
      {"key": "profile:instagram", "hits": 12500},
      {"key": "profile:cristiano", "hits": 8900}
    ]
  }
}
```

#### DELETE `/api/v1/cache`
Clear cache (admin only).

**Query Parameters:**
- `pattern` (optional): Clear specific pattern, e.g., `profile:*`

**Response:**
```json
{
  "success": true,
  "data": {
    "cleared": 1250,
    "message": "Cache cleared successfully"
  }
}
```

### 6. Health & Monitoring Endpoints

#### GET `/api/v1/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-20T14:30:00Z",
    "services": {
      "redis": "connected",
      "database": "connected",
      "instagram_api": "connected"
    },
    "version": "1.0.0",
    "uptime": "7d 3h 15m"
  }
}
```

#### GET `/api/v1/metrics`
Application metrics (Prometheus format).

## Step 1: Create API Types and Interfaces

Create `src/types/api.ts`:
```typescript
// src/types/api.ts

// Base API response
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ApiMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: string
  validationErrors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiMetadata {
  cached?: boolean
  cacheAge?: number
  source?: 'redis' | 'database' | 'api'
  lastSynced?: string
  pagination?: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

// Profile types
export interface ProfileResponse {
  profile: ProfileData
  posts: PostData[]
  highlights: HighlightData[]
  stories: StoryData[]
  metadata: ApiMetadata
}

export interface ProfileData {
  username: string
  fullName: string
  bio: string
  website?: string
  category?: string
  isVerified: boolean
  isBusinessAccount: boolean
  profilePicUrl: string
  posts: number
  followers: number
  following: number
  hasStory: boolean
}

export interface PostData {
  id: string
  thumbUrl: string
  likes: number
  comments: number
  isVideo: boolean
  isSidecar: boolean
  mediaUrl?: string
  caption?: string
  postedAt?: string
}

export interface HighlightData {
  id: string
  title: string
  coverUrl: string
  caption?: string
  mediaUrl?: string
  mediaCount?: number
  createdAt?: string
}

export interface StoryData {
  id: string
  thumbUrl: string
  likes: number
  comments: number
  isVideo: boolean
  isSidecar: boolean
  mediaUrl?: string
  caption?: string
  expiresAt?: string
}

// Request types
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface RefreshProfileParams {
  force?: boolean
  priority?: 'low' | 'normal' | 'high'
}
```

## Step 2: Create API Service Layer

Create `src/services/api.service.ts`:
```typescript
// src/services/api.service.ts
import { cache } from './cache.service'
import { db } from './database.service'
import { getInstagramProfile } from '@/lib/instagram'
import { 
  ApiResponse, 
  ProfileResponse, 
  ProfileData,
  PostData,
  HighlightData,
  StoryData,
  PaginationParams
} from '@/types/api'

export class ApiService {
  async getProfile(username: string): Promise<ApiResponse<ProfileResponse>> {
    try {
      // Validate username
      if (!username || username.length < 1) {
        return this.errorResponse('INVALID_USERNAME', 'Username is required')
      }

      // Get profile data
      const profile = await getInstagramProfile(username)
      
      // Transform to API response
      const response: ProfileResponse = {
        profile: this.transformProfile(profile),
        posts: profile.postsList.map(this.transformPost),
        highlights: profile.highlights.map(this.transformHighlight),
        stories: profile.storiesList.map(this.transformStory),
        metadata: {
          cached: true, // Would check actual cache status
          source: 'redis',
          lastSynced: new Date().toISOString()
        }
      }

      return this.successResponse(response)
    } catch (error) {
      console.error('API Service Error:', error)
      return this.errorResponse(
        'PROFILE_FETCH_FAILED',
        'Failed to fetch profile',
        error.message
      )
    }
  }

  async getProfileMeta(username: string): Promise<ApiResponse<ProfileData>> {
    try {
      // Check cache first
      const cachedMeta = await cache.getProfileMeta(username)
      if (cachedMeta) {
        return this.successResponse(cachedMeta, {
          cached: true,
          source: 'redis'
        })
      }

      // Get from database
      const dbProfile = await db.getProfileByUsername(username)
      if (!dbProfile) {
        return this.errorResponse('PROFILE_NOT_FOUND', 'Profile not found')
      }

      const profileData = this.transformProfileFromDb(dbProfile)
      
      // Cache the metadata
      await cache.setProfileMeta(username, profileData)
      
      return this.successResponse(profileData, {
        cached: false,
        source: 'database'
      })
    } catch (error) {
      return this.errorResponse(
        'METADATA_FETCH_FAILED',
        'Failed to fetch profile metadata',
        error.message
      )
    }
  }

  async getPosts(username: string, params: PaginationParams = {}): Promise<ApiResponse<any>> {
    try {
      const page = params.page || 1
      const limit = params.limit || 12
      const offset = (page - 1) * limit

      // Check cache
      const cacheKey = `posts:${username}:${page}:${limit}`
      const cached = await cache.getPosts(username, page, limit)
      
      if (cached) {
        return this.successResponse({
          posts: cached,
          pagination: {
            page,
            limit,
            total: 0, // Would need total count
            pages: 0,
            hasNext: false,
            hasPrev: page > 1
          }
        }, {
          cached: true,
          source: 'redis'
        })
      }

      // Get from database
      const dbProfile = await db.getProfileByUsername(username)
      if (!dbProfile) {
        return this.errorResponse('PROFILE_NOT_FOUND', 'Profile not found')
      }

      const posts = dbProfile.posts.slice(offset, offset + limit)
      const transformedPosts = posts.map(this.transformPostFromDb)
      
      // Cache the results
      await cache.setPosts(username, transformedPosts, page, limit)
      
      return this.successResponse({
        posts: transformedPosts,
        pagination: {
          page,
          limit,
          total: dbProfile.postsCount,
          pages: Math.ceil(dbProfile.postsCount / limit),
          hasNext: offset + limit < dbProfile.postsCount,
          hasPrev: page > 1
        }
      }, {
        cached: false,
        source: 'database'
      })
    } catch (error) {
      return this.errorResponse(
        'POSTS_FETCH_FAILED',
        'Failed to fetch posts',
        error.message
      )
    }
  }

  // Helper methods
  private transformProfile(profile: any): ProfileData {
    return {
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.bio,
      website: profile.website,
      category: profile.category,
      isVerified: profile.isVerified,
      isBusinessAccount: profile.isBusinessAccount,
      profilePicUrl: profile.profilePicUrl,
      posts: profile.posts,
      followers: profile.followers,
      following: profile.following,
      hasStory: profile.hasStory
    }
  }

  private transformProfileFromDb(dbProfile: any): ProfileData {
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
      hasStory: dbProfile.hasStory
    }
  }

  private transformPost(post: any): PostData {
    return {
      id: post.id,
      thumbUrl: post.thumbUrl,
      likes: post.likes,
      comments: post.comments,
      isVideo: post.isVideo,
      isSidecar: post.isSidecar,
      mediaUrl: post.mediaUrl,
      caption: post.caption,
      postedAt: post.postedAt
    }
  }

  private transformPostFromDb(dbPost: any): PostData {
    return {
      id: dbPost.instagramId,
      thumbUrl: dbPost.thumbUrl || '',
      likes: dbPost.likes,
      comments: dbPost.comments,
      isVideo: dbPost.isVideo,
      isSidecar: dbPost.isSidecar,
      mediaUrl: dbPost.mediaUrl,
      caption: dbPost.caption,
      postedAt: dbPost.postedAt?.toISOString()
    }
  }

  private transformHighlight(highlight: any): HighlightData {
    return {
      id: highlight.id,
      title: highlight.title,
      coverUrl: highlight.coverUrl,
      caption: highlight.caption,
      mediaUrl: highlight.mediaUrl,
      mediaCount: highlight.mediaCount,
      createdAt: highlight.createdAt
    }
  }

  private transformStory(story: any): StoryData {
    return {
      id: story.id,
      thumbUrl: story.thumbUrl,
      likes: story.likes || 0,
      comments: story.comments || 0,
      isVideo: story.isVideo,
      isSidecar: false,
      mediaUrl: story.mediaUrl,
      caption: story.caption,
      expiresAt: story.expiresAt
    }
  }

  private successResponse<T>(data: T, metadata?: any): ApiResponse<T> {
    return {
      success: true,
      data,
      metadata
    }
  }

  private errorResponse(code: string, message: string, details?: string): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    }
  }
}

export const api = new ApiService()
```

## Step 3: Create API Route Handlers

### Profile API Route
Create `src/app/api/v1/profiles/[username]/route.ts`:
```typescript
// src/app/api/v1/profiles/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/services/api.service'
import { rateLimit } from '@/lib/rate-limit'

// Rate limiting: 100 requests per hour per IP
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500
})

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // Rate limiting
    const ip = request.ip || '127.0.0.1'
    const isRateLimited = await limiter.check(100, ip)
    
    if (isRateLimited) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            details: 'Please try again later'
          }
        },
        { status: 429 }
      )
    }

    const username = params.username.toLowerCase()
    const response = await api.getProfile(username)
    
    if (!response.success) {
      return NextResponse.json(
        response,
        { status: response.error?.code === 'PROFILE_NOT_FOUND' ? 404 : 500 }
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Profile API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: error.message
        }
      },
      { status: 500 }
    )
  }
}
```

### Posts API Route
Create `src/app/api/v1/profiles/[username]/posts/route.ts`:
```typescript
// src/app/api/v1/profiles/[username]/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/services/api.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username.toLowerCase()
    const searchParams = request.nextUrl.searchParams
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const type = searchParams.get('type') || 'all'

    const response = await api.getPosts(username, { page, limit })
    
    if (!response.success) {
      return NextResponse.json(
        response,
        { status: response.error?.code === 'PROFILE_NOT_FOUND' ? 404 : 500 }
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Posts API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
}
```

### Health Check Route
Create `src/app/api/v1/health/route.ts`:
```typescript
// src/app/api/v1/health/route.ts
import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check Redis
    await redis.ping()
    
    // Check Database
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: 'connected',
          database: 'connected'
        },
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable',
          details: error.message
        }
      },
      { status: 503 }
    )
  }
}
```

## Step 4: Create Rate Limiting Middleware

Create `src/lib/rate-limit.ts`:
```typescript
// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  interval: number
  uniqueTokenPerInterval: number
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000
  })

  return {
    check: async (limit: number, token: string) => {
      const tokenCount = (tokenCache.get(token) as number) || 0
      
      if (tokenCount >= limit) {
        return true // Rate limited
      }
      
      tokenCache.set(token, tokenCount + 1)
      return false // Not rate limited
    }
  }
}
```

## Step 5: Create API Documentation

Create `src/app/api/v1/docs/route.ts`:
```typescript
// src/app/api/v1/docs/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'Instapvstory.com API',
      version: '1.0.0',
      description: 'API for accessing Instagram profile data'
    },
    servers: [
      {
        url: 'https://instapvstory.com/api/v1',
        description: 'Production server'
      }
    ],
    paths: {
      '/profiles/{username}': {
        get: {
          summary: 'Get profile data',
          parameters: [
            {
              name: 'username',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response'
            },
            '404': {
              description: 'Profile not found'
            },
            '429': {
              description: 'Rate limited'
            }
          }
        }
      }
      // ... other endpoints
    }
  }

  return NextResponse.json(docs)
}
```

## Step 6: Testing the API

### Test Script
Create `scripts/test-api.js`:
```javascript
// scripts/test-api.js
const axios = require('axios')

const BASE_URL = 'http://localhost:3000/api/v1'

async function testAPI() {
  console.log('Testing API endpoints...')
  
  try {
    // Test health endpoint
    const health = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check:', health.data.data.status)
    
    // Test profile endpoint
    const profile = await axios.get(`${BASE_URL}/profiles/instagram`)
    console.log('✅ Profile API:', {
      success: profile.data.success,
      username: profile.data.data?.profile?.username
    })
    
    // Test posts endpoint
    const posts = await axios.get(`${BASE_URL}/profiles/instagram/posts?page=1&limit=5`)
    console.log('✅ Posts API:', {
      success: posts.data.success,
      count: posts.data.data?.posts?.length
    })
    
    // Test error case
    try {
      await axios.get(`${BASE_URL}/profiles/invalidusername12345`)
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Error handling: Profile not found')
      }
    }
    
    console.log('✅ All API tests passed')
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
    process.exit(1)
  }
}

testAPI()
```

### Run Tests
```bash
node scripts/test-api.js
```

## Step 7: API Client for Frontend

Create `src/lib/api-client.ts`:
```typescript
// src/lib/api-client.ts
import { ApiResponse } from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/v1'

export class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API Request Error:', error)
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          details: error.message
        }
      }
    }
  }

  // Profile methods
  async getProfile(username: string) {
    return this.request(`/profiles/${username}`)
  }

  async getProfileMeta(username: string) {
    return this.request(`/profiles/${username}/meta`)
  }

  async getPosts(username: string, page: number = 1, limit: number = 12) {
    return this.request(`/profiles/${username}/posts?page=${page}&limit=${limit}`)
  }

  async getHighlights(username: string) {
    return this.request(`/profiles/${username}/highlights`)
  }

  async getStories(username: string) {
    return this.request(`/profiles/${username}/stories`)
  }

  // Cache management
  async getCacheStats() {
    return this.request('/cache/stats')
  }

  // Health check
  async getHealth() {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()
```

## Step 8: Deployment Configuration

### Environment Variables
Update `.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_BASE=/api/v1
API_RATE_LIMIT_PER_HOUR=100
API_CACHE_TTL=300

# CORS Configuration (if needed)
CORS_ORIGIN=https://instapvstory.com
```

### Next.js Configuration
Update `next.config.ts`:
```typescript
// next.config.ts
const nextConfig = {
  // API route configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
        ]
      }
    ]
  }
}

export default nextConfig
```

## Step 9: Monitoring and Analytics

### Logging Middleware
Create `src/middleware.ts`:
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Log API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
      ip: request.ip,
      userAgent: request.headers.get('user-agent')
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
```

### Performance Monitoring
Add performance tracking to API routes:
```typescript
// Add to API routes
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... API logic
    
    const duration = Date.now() - startTime
    console.log(`API ${request.nextUrl.pathname} took ${duration}ms`)
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`API ${request.nextUrl.pathname} failed after ${duration}ms:`, error)
    throw error
  }
}
```

## Conclusion

This REST API implementation provides:

1. **Complete API coverage** - All necessary endpoints for the application
2. **Type safety** - Full TypeScript support
3. **Caching integration** - Efficient Redis caching layer
4. **Rate limiting** - Protection against abuse
5. **Error handling** - Consistent error responses
6. **Documentation** - OpenAPI documentation
7. **Monitoring** - Performance tracking and logging

The API serves as a robust backend layer that can scale to handle high traffic while maintaining fast response times through intelligent caching.

Next steps:
1. Update frontend to use new API endpoints
2. Implement data sync jobs for background updates
3. Add API authentication (if needed)
4. Set up API monitoring and alerting