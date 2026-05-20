import { createClient } from '@supabase/supabase-js';




// Supabase client for server-side operations
let _supabase: any; export const supabase = new Proxy({}, { get(target, prop) { if (!_supabase) { _supabase = createClient(process.env.SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'); } return _supabase[prop]; } }) as any;




// Supabase client for client-side operations (public)
let _supabasePublic: any; export const supabasePublic = new Proxy({}, { get(target, prop) { if (!_supabasePublic) { _supabasePublic = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder'); } return _supabasePublic[prop]; } }) as any;

// Database types
export interface Profile {
  id: string;
  username: string;
  instagram_id?: string;
  full_name?: string;
  bio?: string;
  profile_pic_url?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_verified: boolean;
  is_business_account: boolean;
  has_story: boolean;
  last_fetched: string;
  created_at: string;
  updated_at: string;
  // JSON fields for caching stories, highlights, and posts
  stories?: any[];
  highlights?: any[];
  posts_list?: any[];
  // Metadata for placeholder data
  stories_are_placeholder?: boolean;
  highlights_are_placeholder?: boolean;
}

export interface MediaCache {
  id: string;
  profile_id: string;
  media_url: string;
  thumb_url?: string;
  media_type: 'image' | 'video' | 'reel' | 'story';
  instagram_id?: string;
  width?: number;
  height?: number;
  duration?: number;
  likes_count: number;
  comments_count: number;
  timestamp?: string;
  created_at: string;
}

// Helper functions
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function createOrUpdateProfile(profileData: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      ...profileData,
      updated_at: new Date().toISOString(),
      last_fetched: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating profile:', error);
    return null;
  }

  return data;
}

export async function getMediaByProfileId(profileId: string, limit: number = 50): Promise<MediaCache[]> {
  const { data, error } = await supabase
    .from('media_cache')
    .select('*')
    .eq('profile_id', profileId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching media:', error);
    return [];
  }

  return data;
}

export async function storeMedia(mediaData: Omit<MediaCache, 'id' | 'created_at'>): Promise<MediaCache | null> {
  const { data, error } = await supabase
    .from('media_cache')
    .insert(mediaData)
    .select()
    .single();

  if (error) {
    console.error('Error storing media:', error);
    return null;
  }

  return data;
}

export async function isCacheValid(username: string, maxAgeMinutes: number = 10): Promise<boolean> {
  const profile = await getProfileByUsername(username);
  
  if (!profile || !profile.last_fetched) {
    return false;
  }

  const lastFetched = new Date(profile.last_fetched);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);

  return diffInMinutes < maxAgeMinutes;
}

// Cache statistics
export async function trackCacheHit(endpoint: string, cacheHit: boolean, responseTime: number, username?: string) {
  try {
    await supabase
      .from('cache_stats')
      .insert({
        endpoint,
        cache_hit: cacheHit,
        response_time_ms: responseTime,
        username,
      });
  } catch (error) {
    console.error('Error tracking cache stats:', error);
  }
}