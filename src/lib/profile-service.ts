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
  const postsCount = profileData.posts_count ?? profileData.postsCount ?? profileData.posts ?? instagramProfile.posts ?? 0;
  const followersCount = profileData.followers_count ?? profileData.followersCount ?? profileData.followers ?? instagramProfile.followers ?? 0;
  const followingCount = profileData.following_count ?? profileData.followingCount ?? profileData.following ?? instagramProfile.following ?? 0;
  const fullName = profileData.full_name ?? profileData.fullName ?? instagramProfile.fullName ?? '';
  const bio = profileData.bio ?? instagramProfile.bio ?? '';
  const profilePicUrl = profileData.profile_pic_url ?? profileData.profilePicUrl ?? instagramProfile.profilePicUrl ?? '';
  const isVerified = profileData.is_verified ?? profileData.isVerified ?? instagramProfile.isVerified ?? false;
  const isBusinessAccount = profileData.is_business_account ?? profileData.isBusinessAccount ?? instagramProfile.isBusinessAccount ?? false;
  const hasStory = profileData.has_story ?? profileData.hasStory ?? instagramProfile.hasStory ?? false;

  return {
    username: profileData.username || instagramProfile.username,
    fullName,
    bio,
    profilePicUrl: proxyImageUrl(profilePicUrl),
    category: profileData.category || instagramProfile.category,
    website: profileData.website || instagramProfile.website,
    posts: postsCount,
    followers: followersCount,
    following: followingCount,
    isVerified,
    isBusinessAccount,
    hasStory,
    postsList: instagramProfile.postsList?.map((p: any) => ({
      id: p.id || p.instagramId,
      thumbUrl: proxyImageUrl(p.thumbUrl || p.mediaUrl || ''),
      mediaUrl: p.isVideo ? unproxyImageUrl(p.mediaUrl || '') : proxyImageUrl(p.mediaUrl || ''),
      likes: p.likes || 0,
      comments: p.comments || 0,
      isVideo: p.isVideo || false,
      isReel: p.isReel || false,
      isSidecar: p.isSidecar || false,
      caption: p.caption || '',
      timestamp: p.timestamp,
    })) || [],
    highlights: instagramProfile.highlights?.map((h: any) => ({
      id: h.id || h.instagramId,
      title: h.title || 'Highlight',
      coverUrl: proxyImageUrl(h.coverUrl || h.mediaUrl || ''),
      caption: h.caption,
      mediaUrl: (h.mediaUrl && /\.(mp4|mov|avi|webm|mkv)/i.test(unproxyImageUrl(h.mediaUrl))) ? unproxyImageUrl(h.mediaUrl) : proxyImageUrl(h.mediaUrl || ''),
      mediaCount: h.mediaCount || 1,
      createdAt: h.createdAt,
    })) || [],
    storiesList: instagramProfile.storiesList?.map((s: any) => ({
      id: s.id || s.instagramId,
      thumbUrl: proxyImageUrl(s.thumbUrl || s.mediaUrl || ''),
      mediaUrl: s.isVideo ? unproxyImageUrl(s.mediaUrl || '') : proxyImageUrl(s.mediaUrl || ''),
      likes: 0,
      comments: 0,
      isVideo: s.isVideo || false,
      isSidecar: false,
      caption: s.caption,
    })) || [],
  };
}

export async function fetchProfileData(username: string, bypassCache = false): Promise<{ profile: Profile; source: 'cache' | 'api' }> {
  const normalizedUsername = username.toLowerCase();

  const cachedProfile = !bypassCache ? await cacheService.getProfile(normalizedUsername) : null;

  if (cachedProfile) {
    // Detect stale cache: if we have posts but none have isReel defined,
    // the cache was built before the reels upgrade — force a fresh fetch.
    const cachedPosts: any[] = cachedProfile.posts_list || cachedProfile.posts || [];
    const isStale = cachedPosts.length > 0 && cachedPosts.every((p: any) => p.isReel === undefined);
    if (!isStale) {
      const profile = createFrontendProfile(cachedProfile, {
        postsList: cachedPosts,
        highlights: cachedProfile.highlights || [],
        storiesList: cachedProfile.stories || [],
      });
      return { profile, source: 'cache' };
    }
    console.log(`Stale cache detected for ${normalizedUsername} (no isReel field) — forcing fresh fetch`);
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

  await cacheService.storeProfile(normalizedUsername, profileData);

  const profile = createFrontendProfile(profileData, instagramProfile);
  return { profile, source: 'api' };
}
