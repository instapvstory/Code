import { cacheService } from '@/lib/cache';
import { getInstagramProfile } from '@/lib/instagram';
import type { Profile } from '@/components/viewer/ProfileView/ProfileView';

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
    profilePicUrl,
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
      thumbUrl: p.thumbUrl || p.mediaUrl || '',
      mediaUrl: p.mediaUrl || '',
      likes: p.likes || 0,
      comments: p.comments || 0,
      isVideo: p.isVideo || false,
      isSidecar: p.isSidecar || false,
      caption: p.caption,
    })) || [],
    highlights: instagramProfile.highlights?.map((h: any) => ({
      id: h.id || h.instagramId,
      title: h.title || 'Highlight',
      coverUrl: h.coverUrl || h.mediaUrl || '',
      caption: h.caption,
      mediaUrl: h.mediaUrl,
      mediaCount: h.mediaCount || 1,
      createdAt: h.createdAt,
    })) || [],
    storiesList: instagramProfile.storiesList?.map((s: any) => ({
      id: s.id || s.instagramId,
      thumbUrl: s.thumbUrl || s.mediaUrl || '',
      mediaUrl: s.mediaUrl || '',
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
    const profile = createFrontendProfile(cachedProfile, {
      postsList: cachedProfile.posts_list || cachedProfile.posts || [],
      highlights: cachedProfile.highlights || [],
      storiesList: cachedProfile.stories || [],
    });
    return { profile, source: 'cache' };
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

  if (instagramProfile.postsList && instagramProfile.postsList.length > 0) {
    const profileId = `ig_${normalizedUsername}`;
    await cacheService.storeMedia(profileId, instagramProfile.postsList);
  }

  const profile = createFrontendProfile(profileData, instagramProfile);
  return { profile, source: 'api' };
}
