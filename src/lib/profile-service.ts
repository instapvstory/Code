import { cacheService } from '@/lib/cache';
import { getInstagramProfile } from '@/lib/instagram';
import type { Profile } from '@/components/viewer/ProfileView/ProfileView';

/**
 * Decodes a previously proxied URL back to its original raw URL.
 * Essential for video tags to retrieve raw CDN URLs for streaming range requests.
 */
function unproxyImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('/api/proxy-image?url=')) {
    try {
      const searchParams = new URL(url, 'http://localhost').searchParams;
      return searchParams.get('url') || url;
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * Rewrites an Instagram/imginn CDN URL to go through our local proxy so the
 * browser can load it without being blocked by hotlink-protection headers.
 * Only rewrites known CDN hosts — relative paths and other URLs pass through unchanged.
 */
function proxyImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Already a proxy URL or a relative/data URL — return as-is
  if (url.startsWith('/api/proxy-image') || url.startsWith('data:') || url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    const cdn = /cdninstagram\.com|fbcdn\.net|instagram\.com|imginn\.com/i.test(parsed.hostname);
    if (cdn) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // not a valid URL — return as-is
  }
  return url;
}

// Helper function to create frontend-compatible profile data
function createFrontendProfile(profileData: any, instagramProfile: any): Profile {
  const postsCount = profileData.posts_count ?? profileData.postsCount ?? profileData.posts ?? instagramProfile?.posts ?? 0;
  const followersCount = profileData.followers_count ?? profileData.followersCount ?? profileData.followers ?? instagramProfile?.followers ?? 0;
  const followingCount = profileData.following_count ?? profileData.followingCount ?? profileData.following ?? instagramProfile?.following ?? 0;
  const fullName = profileData.full_name ?? profileData.fullName ?? instagramProfile?.fullName ?? '';
  const bio = profileData.bio ?? instagramProfile?.bio ?? '';
  const profilePicUrl = profileData.profile_pic_url ?? profileData.profilePicUrl ?? instagramProfile?.profilePicUrl ?? '';
  const isVerified = profileData.is_verified ?? profileData.isVerified ?? instagramProfile?.isVerified ?? false;
  const isBusinessAccount = profileData.is_business_account ?? profileData.isBusinessAccount ?? instagramProfile?.isBusinessAccount ?? false;
  const hasStory = profileData.has_story ?? profileData.hasStory ?? instagramProfile?.hasStory ?? false;

  const rawPosts = instagramProfile?.postsList || instagramProfile?.posts_list || profileData.posts_list || profileData.postsList || [];
  const rawHighlights = instagramProfile?.highlights || profileData.highlights || [];
  const rawStories = instagramProfile?.storiesList || instagramProfile?.stories_list || instagramProfile?.stories || profileData.stories || profileData.stories_list || [];

  return {
    username: profileData.username || instagramProfile?.username,
    fullName,
    bio,
    profilePicUrl: proxyImageUrl(profilePicUrl),
    category: profileData.category || instagramProfile?.category,
    website: profileData.website || instagramProfile?.website,
    posts: postsCount,
    followers: followersCount,
    following: followingCount,
    isVerified,
    isBusinessAccount,
    hasStory,
    postsList: rawPosts.map((p: any) => ({
      id: p.id || p.instagramId || p.instagram_id,
      thumbUrl: proxyImageUrl(p.thumbUrl || p.thumb_url || p.mediaUrl || p.media_url || ''),
      mediaUrl: proxyImageUrl(p.mediaUrl || p.media_url || p.thumbUrl || p.thumb_url || ''),
      likes: p.likes || 0,
      comments: p.comments || 0,
      isVideo: p.isVideo ?? p.is_video ?? false,
      isReel: p.isReel ?? p.is_reel ?? false,
      isSidecar: p.isSidecar ?? p.is_sidecar ?? false,
      caption: p.caption || '',
      timestamp: p.timestamp,
    })),
    highlights: rawHighlights.map((h: any) => ({
      id: h.id || h.instagramId || h.instagram_id,
      title: h.title || 'Highlight',
      coverUrl: proxyImageUrl(h.coverUrl || h.cover_url || h.mediaUrl || h.media_url || ''),
      caption: h.caption || '',
      mediaUrl: proxyImageUrl(h.mediaUrl || h.media_url || h.coverUrl || h.cover_url || ''),
      mediaCount: h.mediaCount || h.media_count || 1,
      createdAt: h.createdAt || h.created_at,
    })),
    storiesList: rawStories.map((s: any) => ({
      id: s.id || s.instagramId || s.instagram_id,
      thumbUrl: proxyImageUrl(s.thumbUrl || s.thumb_url || s.mediaUrl || s.media_url || ''),
      mediaUrl: proxyImageUrl(s.mediaUrl || s.media_url || s.thumbUrl || s.thumb_url || ''),
      likes: s.likes || 0,
      comments: s.comments || 0,
      isVideo: s.isVideo ?? s.is_video ?? false,
      isSidecar: false,
      caption: s.caption || '',
    })),
  };
}

export async function fetchProfileData(username: string, bypassCache = false): Promise<{ profile: Profile; source: 'cache' | 'api' }> {
  const normalizedUsername = username.toLowerCase();

  const cachedProfile = !bypassCache ? await cacheService.getProfile(normalizedUsername) : null;

  if (cachedProfile) {
    // Detect stale cache: if older than 12 hours (signed URLs expire), built before reels upgrade, or fallback avatar
    const cachedPosts: any[] = cachedProfile.posts_list || cachedProfile.posts || [];
    const lastFetched = cachedProfile.last_fetched ? new Date(cachedProfile.last_fetched).getTime() : 0;
    const isExpired = !lastFetched || (Date.now() - lastFetched) > (12 * 60 * 60 * 1000);
    const isStale = isExpired ||
                    (cachedPosts.length > 0 && cachedPosts.every((p: any) => p.isReel === undefined)) ||
                    (cachedProfile.profile_pic_url && cachedProfile.profile_pic_url.includes('ui-avatars.com'));
    if (!isStale) {
      const profile = createFrontendProfile(cachedProfile, {
        postsList: cachedPosts,
        highlights: cachedProfile.highlights || [],
        storiesList: cachedProfile.stories || [],
      });
      return { profile, source: 'cache' };
    }
    console.log(`Stale cache detected for ${normalizedUsername} — forcing fresh fetch from Instagram API`);
  }

  const instagramProfile = await getInstagramProfile(normalizedUsername);

  if (!instagramProfile || !instagramProfile.username || !instagramProfile.profilePicUrl) {
    throw new Error('Invalid profile data received from Instagram API');
  }

  const profileData = {
    username: instagramProfile.username,
    full_name: instagramProfile.fullName,
    bio: instagramProfile.bio,
    profile_pic_url: instagramProfile.profilePicUrl,
    followers_count: instagramProfile.followers || 0,
    following_count: instagramProfile.following || 0,
    posts_count: instagramProfile.posts || 0,
    is_verified: instagramProfile.isVerified,
    is_business_account: instagramProfile.isBusinessAccount || false,
    has_story: instagramProfile.hasStory || false,
    last_fetched: new Date().toISOString(),
    stories: instagramProfile.storiesList || [],
    highlights: instagramProfile.highlights || [],
    posts_list: instagramProfile.postsList || [],
  };

  // Only store real profile data in Supabase cache — skip fallback profiles
  if (!instagramProfile.profilePicUrl?.includes('ui-avatars.com')) {
    await cacheService.storeProfile(normalizedUsername, profileData);
  }

  const profile = createFrontendProfile(profileData, instagramProfile);
  return { profile, source: 'api' };
}
