# Frontend API Integration Plan

## Overview
This document outlines the migration of the Instapvstory.com frontend from direct Instagram API calls to using our new backend API with Redis caching and PostgreSQL database. The goal is to improve performance, reliability, and maintainability while maintaining the same user experience.

## Current Architecture vs New Architecture

### Current (Direct API Calls)
```
Frontend → Instagram Graph API → Response
```

### New (Backend API with Caching)
```
Frontend → Our Backend API → Redis Cache → PostgreSQL → Instagram API (fallback)
```

## Benefits of Migration
1. **Faster response times** - Redis cache provides sub-millisecond responses
2. **Reduced API rate limiting** - Fewer direct Instagram API calls
3. **Better error handling** - Consistent error responses
4. **Offline capabilities** - Cached data available when Instagram API is down
5. **Analytics** - Track usage patterns
6. **Scalability** - Handle more users with caching

## Step 1: Analyze Current Frontend Structure

### Current Files to Update
1. `src/app/[username]/page.tsx` - Main profile page
2. `src/app/actions.ts` - Server actions
3. `src/lib/instagram.ts` - Instagram API client
4. `src/components/viewer/ProfileView/ProfileView.tsx` - Profile component
5. `src/components/viewer/PostsGrid/PostsGrid.tsx` - Posts grid component

### Current Data Flow
```typescript
// Current flow in page.tsx
const profile = await fetchProfile(username) // Calls getInstagramProfile
// → Direct Instagram API call
// → Returns Profile interface
```

## Step 2: Create API Client Integration

### Update Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_API_BASE=/api/v1
```

### Create API Client
Already created in `src/lib/api-client.ts` (from REST API plan). We'll use this.

## Step 3: Update Server Actions

### Current `src/app/actions.ts`
```typescript
// Current implementation
export async function fetchProfile(username: string) {
  try {
    const profile = await getInstagramProfile(username)
    return { data: profile }
  } catch (error) {
    return { error: 'Failed to fetch profile' }
  }
}
```

### Updated `src/app/actions.ts`
```typescript
// Updated implementation
import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types/api'

export async function fetchProfile(username: string): Promise<{ data?: any; error?: string }> {
  try {
    const response: ApiResponse = await apiClient.getProfile(username)
    
    if (!response.success) {
      return { 
        error: response.error?.message || 'Failed to fetch profile' 
      }
    }
    
    return { data: response.data }
  } catch (error) {
    console.error('Fetch profile error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

export async function fetchProfileMeta(username: string) {
  try {
    const response = await apiClient.getProfileMeta(username)
    
    if (!response.success) {
      return { error: response.error?.message }
    }
    
    return { data: response.data }
  } catch (error) {
    return { error: 'Failed to fetch profile metadata' }
  }
}

export async function fetchPosts(username: string, page: number = 1, limit: number = 12) {
  try {
    const response = await apiClient.getPosts(username, page, limit)
    
    if (!response.success) {
      return { error: response.error?.message }
    }
    
    return { data: response.data }
  } catch (error) {
    return { error: 'Failed to fetch posts' }
  }
}
```

## Step 4: Update Profile Page

### Current `src/app/[username]/page.tsx` Analysis
The current page uses `fetchProfile` from actions.ts which calls the Instagram API directly. We need to update it to handle the new API response structure.

### Updated `src/app/[username]/page.tsx`
```typescript
// Updated implementation - key changes
useEffect(() => {
  async function loadData() {
    setLoading(true);
    setError(null);
    setProfile(null);

    const result = await fetchProfile(username);
    
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      // New API returns { profile, posts, highlights, stories }
      const apiData = result.data;
      
      // Transform to match existing Profile interface
      const transformedProfile: Profile = {
        username: apiData.profile.username,
        fullName: apiData.profile.fullName,
        bio: apiData.profile.bio,
        website: apiData.profile.website,
        category: apiData.profile.category,
        isVerified: apiData.profile.isVerified,
        isBusinessAccount: apiData.profile.isBusinessAccount,
        profilePicUrl: apiData.profile.profilePicUrl,
        posts: apiData.profile.posts,
        followers: apiData.profile.followers,
        following: apiData.profile.following,
        hasStory: apiData.profile.hasStory,
        highlights: apiData.highlights,
        postsList: apiData.posts,
        storiesList: apiData.stories
      };
      
      setProfile(transformedProfile);
    }
    
    setLoading(false);
  }

  if (username) {
    loadData();
  }
}, [username]);
```

## Step 5: Update ProfileView Component

### Current `src/components/viewer/ProfileView/ProfileView.tsx`
The ProfileView component already uses the Profile interface. We need to ensure it can handle the transformed data correctly.

### No changes needed to ProfileView.tsx
The component already accepts the Profile interface and will work with the transformed data.

## Step 6: Update PostsGrid Component

### Current `src/components/viewer/PostsGrid/PostsGrid.tsx`
The PostsGrid component already uses the Post interface. We need to ensure it receives the posts data correctly.

### Update in `src/app/[username]/page.tsx`
```typescript
// In renderTabContent function
{activeTab === 'posts' && (
  <PostsGrid 
    posts={profile.postsList} 
    username={profile.username} 
  />
)}
```

This already works with the transformed data.

## Step 7: Update Instagram Library

### Current `src/lib/instagram.ts`
This file currently makes direct Instagram API calls. We need to update it to use our backend API.

### Updated `src/lib/instagram.ts`
```typescript
// Updated to use our backend API
import { apiClient } from './api-client'
import { Profile, Post, Highlight } from '@/components/viewer/ProfileView/ProfileView'

export async function getInstagramProfile(username: string): Promise<Profile> {
  const response = await apiClient.getProfile(username)
  
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch profile')
  }
  
  const apiData = response.data
  
  // Transform to match existing return type
  return {
    username: apiData.profile.username,
    fullName: apiData.profile.fullName,
    bio: apiData.profile.bio,
    website: apiData.profile.website,
    category: apiData.profile.category,
    isVerified: apiData.profile.isVerified,
    isBusinessAccount: apiData.profile.isBusinessAccount,
    profilePicUrl: apiData.profile.profilePicUrl,
    posts: apiData.profile.posts,
    followers: apiData.profile.followers,
    following: apiData.profile.following,
    hasStory: apiData.profile.hasStory,
    highlights: apiData.highlights,
    postsList: apiData.posts,
    storiesList: apiData.stories
  }
}

// Keep original function for backward compatibility
export async function getInstagramProfileFromAPI(username: string): Promise<Profile> {
  // This can be used as fallback or for direct API calls if needed
  return getInstagramProfile(username)
}
```

## Step 8: Create Data Transformation Utilities

Create `src/lib/data-transform.ts`:
```typescript
// src/lib/data-transform.ts
import { 
  Profile as ApiProfile, 
  Post as ApiPost, 
  Highlight as ApiHighlight 
} from '@/types/api'
import { 
  Profile as FrontendProfile, 
  Post as FrontendPost, 
  Highlight as FrontendHighlight 
} from '@/components/viewer/ProfileView/ProfileView'

export function transformApiToFrontend(apiData: any): FrontendProfile {
  return {
    username: apiData.profile.username,
    fullName: apiData.profile.fullName,
    bio: apiData.profile.bio,
    website: apiData.profile.website,
    category: apiData.profile.category,
    isVerified: apiData.profile.isVerified,
    isBusinessAccount: apiData.profile.isBusinessAccount,
    profilePicUrl: apiData.profile.profilePicUrl,
    posts: apiData.profile.posts,
    followers: apiData.profile.followers,
    following: apiData.profile.following,
    hasStory: apiData.profile.hasStory,
    highlights: apiData.highlights.map(transformHighlight),
    postsList: apiData.posts.map(transformPost),
    storiesList: apiData.stories.map(transformPost)
  }
}

export function transformPost(apiPost: ApiPost): FrontendPost {
  return {
    id: apiPost.id,
    thumbUrl: apiPost.thumbUrl,
    likes: apiPost.likes,
    comments: apiPost.comments,
    isVideo: apiPost.isVideo,
    isSidecar: apiPost.isSidecar,
    mediaUrl: apiPost.mediaUrl,
    caption: apiPost.caption
  }
}

export function transformHighlight(apiHighlight: ApiHighlight): FrontendHighlight {
  return {
    id: apiHighlight.id,
    title: apiHighlight.title,
    coverUrl: apiHighlight.coverUrl,
    caption: apiHighlight.caption,
    mediaUrl: apiHighlight.mediaUrl,
    mediaCount: apiHighlight.mediaCount,
    createdAt: apiHighlight.createdAt
  }
}
```

## Step 9: Update Error Handling

### Add Error States
Update `src/app/[username]/page.tsx` to show cache status:
```typescript
// Add cache status to state
const [cacheStatus, setCacheStatus] = useState<'cached' | 'fresh' | 'error'>('fresh')

// Update in loadData function
if (result.data?.metadata) {
  setCacheStatus(result.data.metadata.cached ? 'cached' : 'fresh')
}
```

### Add Cache Status Indicator
Add to the UI:
```typescript
{cacheStatus === 'cached' && (
  <div className={styles.cacheIndicator}>
    <span>⚡ Cached data</span>
  </div>
)}
```

## Step 10: Add Loading States and Skeleton Improvements

### Enhanced Skeleton Loader
Update `src/components/viewer/SkeletonLoader/SkeletonLoader.tsx` to match the new data structure.

### Progressive Loading
Implement progressive loading for better UX:
```typescript
// Load profile metadata first, then details
async function loadDataProgressive(username: string) {
  // Load metadata first (fast)
  const metaResult = await fetchProfileMeta(username)
  if (metaResult.data) {
    setProfile(metaResult.data)
  }
  
  // Then load full profile (slower)
  const fullResult = await fetchProfile(username)
  if (fullResult.data) {
    setProfile(fullResult.data)
  }
}
```

## Step 11: Update TypeScript Interfaces

### Create Shared Types
Update `src/types/api.ts` to include transformation types:
```typescript
// Add to existing types
export interface ApiProfileResponse {
  profile: ProfileData
  posts: PostData[]
  highlights: HighlightData[]
  stories: StoryData[]
  metadata: ApiMetadata
}

// Add transformation types
export type FrontendProfile = {
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
  highlights: HighlightData[]
  postsList: PostData[]
  storiesList: StoryData[]
}
```

## Step 12: Testing the Integration

### Test Script
Create `scripts/test-frontend-api.js`:
```javascript
// scripts/test-frontend-api.js
const axios = require('axios')

async function testFrontendAPI() {
  console.log('Testing frontend API integration...')
  
  const testCases = [
    { username: 'instagram', expected: 'Instagram' },
    { username: 'cristiano', expected: 'Cristiano Ronaldo' }
  ]
  
  for (const testCase of testCases) {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/profiles/${testCase.username}`)
      
      if (response.data.success) {
        console.log(`✅ ${testCase.username}:`, {
          success: true,
          username: response.data.data.profile.username,
          cached: response.data.data.metadata?.cached || false
        })
      } else {
        console.log(`❌ ${testCase.username}:`, response.data.error)
      }
    } catch (error) {
      console.log(`❌ ${testCase.username}:`, error.message)
    }
  }
}

testFrontendAPI()
```

### Run Tests
```bash
node scripts/test-frontend-api.js
```

## Step 13: Performance Monitoring

### Add Performance Tracking
```typescript
// Add to API client
export class ApiClient {
  private metrics = {
    requestCount: 0,
    cacheHitCount: 0,
    averageResponseTime: 0
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    this.metrics.requestCount++
    
    try {
      const response = await fetch(url, options)
      const duration = Date.now() - startTime
      
      // Update metrics
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + duration) / this.metrics.requestCount
      
      return await response.json()
    } catch (error) {
      console.error('API Request Error:', error)
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed'
        }
      }
    }
  }
  
  getMetrics() {
    return this.metrics
  }
}
```

## Step 14: Fallback Strategy

### Implement Fallback to Direct API
```typescript
export async function getInstagramProfileWithFallback(username: string): Promise<Profile> {
  try {
    // Try our API first
    return await getInstagramProfile(username)
  } catch (error) {
    console.warn('Backend API failed, falling back to direct Instagram API')
    
    // Fall back to direct API (original implementation)
    return await getInstagramProfileDirect(username)
  }
}
```

## Step 15: Deployment Strategy

### Phased Rollout
1. **Phase 1**: Deploy backend API only
2. **Phase 2**: Update frontend to use API for 10% of traffic
3. **Phase 3**: Monitor performance and fix issues
4. **Phase 4**: Ramp up to 100% traffic

### A/B Testing
```typescript
// Feature flag for API migration
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true' || 
                   Math.random() < 0.1 // 10% rollout

export async function fetchProfile(username: string) {
  if (USE_NEW_API) {
    return fetchProfileFromNewAPI(username)
  } else {
    return fetchProfileFromDirectAPI(username)
  }
}
```

## Step 16: Monitoring and Alerting

### Key Metrics to Monitor
1. **API response time** - Should be < 500ms for cached, < 2000ms for uncached
2. **Cache hit rate** - Should be > 80%
3. **Error rate** - Should be < 1%
4. **Instagram API calls** - Should be reduced by 90%

### Set Up Alerts
- Alert if cache hit rate drops below 50%
- Alert if average response time exceeds 2000ms
- Alert if error rate exceeds 5%

## Conclusion

This frontend API integration plan provides:

1. **Seamless migration** - Minimal changes to existing components
2. **Backward compatibility** - Existing interfaces maintained
3. **Performance improvements** - Redis caching reduces response times
4. **Better error handling** - Consistent error responses
5. **Monitoring** - Performance tracking and metrics

The migration will be transparent to users while providing significant performance benefits and reducing dependency on the Instagram API.

### Next Steps After Implementation
1. Monitor performance metrics for 24 hours
2. Gradually increase traffic to new API
3. Optimize cache TTL based on usage patterns
4. Add more advanced caching strategies (pre-warming, predictive caching)
5. Implement API versioning for future updates