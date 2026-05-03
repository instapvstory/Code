import { LRUCache } from 'lru-cache';
import { supabase, getProfileByUsername, createOrUpdateProfile, getMediaByProfileId, storeMedia, trackCacheHit } from './supabase';

// Multi-layer cache service for CDN-first architecture
// Layer 1: Memory cache (LRU) - fastest
// Layer 2: Database cache (Supabase) - persistent
// Layer 3: External API (Instagram) - only on cache miss

export class CacheService {
  private memoryCache: LRUCache<string, any>;
  private defaultTTL: number;

  constructor() {
    const memoryTtlMinutes = parseInt(process.env.MEMORY_CACHE_TTL_MINUTES || '5');
    this.memoryCache = new LRUCache({
      max: 1000, // Maximum number of items in memory
      ttl: memoryTtlMinutes * 60 * 1000, // Configurable TTL for memory cache
    });
    
    this.defaultTTL = parseInt(process.env.PROFILE_CACHE_TTL_MINUTES || '600') * 60 * 1000;
  }

  // Get profile data with multi-layer caching
  async getProfile(username: string): Promise<any | null> {
    const startTime = Date.now();
    const cacheKey = `profile:${username.toLowerCase()}`;
    
    // Layer 1: Check memory cache
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached) {
      await trackCacheHit('profile', true, Date.now() - startTime, username);
      console.log(`Memory cache HIT for ${username}`);
      return memoryCached;
    }

    // Layer 2: Check database cache
    const dbProfile = await getProfileByUsername(username);
    if (dbProfile && await this.isDatabaseCacheValid(dbProfile)) {
      // Store in memory cache for faster access
      this.memoryCache.set(cacheKey, dbProfile);
      
      await trackCacheHit('profile', true, Date.now() - startTime, username);
      console.log(`Database cache HIT for ${username}`);
      return dbProfile;
    }

    // Layer 3: Cache miss - will be fetched by API
    await trackCacheHit('profile', false, Date.now() - startTime, username);
    console.log(`Cache MISS for ${username}`);
    return null;
  }

  // Store profile data in both memory and database caches
  async storeProfile(username: string, profileData: any): Promise<void> {
    const cacheKey = `profile:${username.toLowerCase()}`;
    
    // Store in memory cache
    this.memoryCache.set(cacheKey, profileData);
    
    // Store in database cache
    await createOrUpdateProfile({
      username: username.toLowerCase(),
      ...profileData,
    });
    
    console.log(`Stored profile for ${username} in cache`);
  }

  // Get media for a profile with caching
  async getMedia(profileId: string, username: string): Promise<any[]> {
    const startTime = Date.now();
    const cacheKey = `media:${profileId}`;
    
    // Layer 1: Check memory cache
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached) {
      await trackCacheHit('media', true, Date.now() - startTime, username);
      return memoryCached;
    }

    // Layer 2: Check database cache
    const dbMedia = await getMediaByProfileId(profileId);
    if (dbMedia && dbMedia.length > 0) {
      // Store in memory cache
      this.memoryCache.set(cacheKey, dbMedia);
      
      await trackCacheHit('media', true, Date.now() - startTime, username);
      return dbMedia;
    }

    // Layer 3: Cache miss
    await trackCacheHit('media', false, Date.now() - startTime, username);
    return [];
  }

  // Store media in cache
  async storeMedia(profileId: string, mediaItems: any[]): Promise<void> {
    const cacheKey = `media:${profileId}`;
    
    // Store in memory cache
    this.memoryCache.set(cacheKey, mediaItems);
    
    // Store each media item in database
    for (const media of mediaItems) {
      await storeMedia({
        profile_id: profileId,
        media_url: media.mediaUrl || media.url,
        thumb_url: media.thumbUrl || media.thumbnail,
        media_type: media.isVideo ? 'video' : 'image',
        instagram_id: media.id,
        width: media.width,
        height: media.height,
        duration: media.duration,
        likes_count: media.likesCount || 0,
        comments_count: media.commentsCount || 0,
        timestamp: media.timestamp || new Date().toISOString(),
      });
    }
    
    console.log(`Stored ${mediaItems.length} media items for profile ${profileId}`);
  }

  // Check if database cache is still valid
  private async isDatabaseCacheValid(profile: any): Promise<boolean> {
    if (!profile.last_fetched) {
      return false;
    }

    const lastFetched = new Date(profile.last_fetched);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);

    // Different cache strategies based on profile popularity
    const cacheTTL = this.getCacheTTLForProfile(profile);
    return diffInMinutes < cacheTTL;
  }

  // Dynamic cache TTL based on profile characteristics
  private getCacheTTLForProfile(profile: any): number {
    // Requirements strictly dictate 6 to 12 hours cache TTL
    if (profile.followers_count > 1000000) {
      return 360; // 6 hours for very popular profiles
    } else if (profile.followers_count > 100000) {
      return 480; // 8 hours for popular profiles
    } else if (profile.followers_count > 10000) {
      return 600; // 10 hours for moderately popular profiles
    }
    
    return 720; // 12 hours max default for regular profiles
  }

  // Clear cache for a specific profile
  async clearProfileCache(username: string): Promise<void> {
    const profileKey = `profile:${username.toLowerCase()}`;
    this.memoryCache.delete(profileKey);
    
    // Note: Database cache is not cleared, only marked as stale
    // by updating last_fetched to a very old date
    await supabase
      .from('profiles')
      .update({ last_fetched: '2000-01-01T00:00:00Z' })
      .eq('username', username.toLowerCase());
    
    console.log(`Cleared cache for ${username}`);
  }

  // Get cache statistics
  async getStats(): Promise<{
    memoryCacheSize: number;
    memoryCacheKeys: string[];
    hitRate?: number;
  }> {
    return {
      memoryCacheSize: this.memoryCache.size,
      memoryCacheKeys: Array.from(this.memoryCache.keys()),
    };
  }

  // Clear all memory cache
  clearMemoryCache(): void {
    this.memoryCache.clear();
    console.log('Cleared all memory cache');
  }

  // Clean up old cache entries (older than maxAgeDays)
  async cleanupOldCache(maxAgeDays: number = 30): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    // Delete old profiles from database
    const { error, count } = await supabase
      .from('profiles')
      .delete()
      .lt('last_fetched', cutoffDate.toISOString());
    
    if (error) {
      console.error('Error cleaning up old cache:', error);
      return { deletedCount: 0 };
    }
    
    // Also clean up media cache for deleted profiles
    // This would require a more complex query, but for now we'll just log
    console.log(`Cleaned up ${count || 0} old cache entries older than ${maxAgeDays} days`);
    
    return { deletedCount: count || 0 };
  }
}

// Singleton instance
export const cacheService = new CacheService();