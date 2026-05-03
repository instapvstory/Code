'use server';

import { Profile } from '@/components/viewer/ProfileView/ProfileView';

/**
 * Server Action to fetch an Instagram profile.
 * Now uses our backend API with caching and database layer.
 */
export async function fetchProfile(username: string): Promise<{ data?: Profile; error?: string }> {
  console.log('=== fetchProfile called for username:', username, '===');
  try {
    // Call our backend API endpoint
    const apiUrl = `${getBaseUrl()}/api/profiles/${encodeURIComponent(username)}`;
    console.log('Fetching profile from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      // Add cache control headers
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', response.status, errorData);
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('API Response for', username, ':', JSON.stringify(result, null, 2).substring(0, 1000) + '...');
    
    if (!result.data) {
      console.error('No data in API response:', result);
      throw new Error('No data in API response');
    }
    
    // Transform the API response to match the frontend Profile interface
    const profile = transformApiProfile(result.data);
    console.log('Transformed profile for', username, ':', {
      username: profile.username,
      posts: profile.posts,
      followers: profile.followers,
      following: profile.following,
      profilePicUrl: profile.profilePicUrl?.substring(0, 50) + '...',
      postsListLength: profile.postsList?.length,
      highlightsLength: profile.highlights?.length,
      hasStory: profile.hasStory,
      isVerified: profile.isVerified,
    });
    
    console.log('=== fetchProfile returning data ===');
    return { data: profile };
  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    
    // Fallback to direct Instagram API if our backend is down
    // This ensures the application remains functional
    try {
      console.log('Falling back to direct Instagram API...');
      const { getInstagramProfile } = await import('@/lib/instagram');
      const profile = await getInstagramProfile(username);
      console.log('Direct Instagram API profile:', {
        username: profile.username,
        posts: profile.posts,
        followers: profile.followers,
        following: profile.following,
      });
      return { data: profile };
    } catch (fallbackError: any) {
      console.error('Fallback also failed:', fallbackError);
      return { error: fallbackError.message || 'Failed to fetch profile' };
    }
  }
}

/**
 * Transform API profile response to frontend Profile interface
 */
function transformApiProfile(apiProfile: any): Profile {
  return {
    username: apiProfile.username,
    fullName: apiProfile.fullName || '',
    bio: apiProfile.bio || '',
    website: apiProfile.website,
    category: apiProfile.category,
    isVerified: apiProfile.isVerified || false,
    isBusinessAccount: apiProfile.isBusinessAccount || false,
    profilePicUrl: apiProfile.profilePicUrl || '',
    posts: apiProfile.posts || 0,
    followers: apiProfile.followers || 0,
    following: apiProfile.following || 0,
    hasStory: apiProfile.hasStory || false,
    highlights: apiProfile.highlights?.map((h: any) => ({
      id: h.id || h.instagramId,
      title: h.title || 'Highlight',
      coverUrl: h.coverUrl || h.mediaUrl || '',
      caption: h.caption,
      mediaUrl: h.mediaUrl,
      mediaCount: h.mediaCount || 1,
      createdAt: h.createdAt,
    })) || [],
    postsList: apiProfile.postsList?.map((p: any) => ({
      id: p.id || p.instagramId,
      thumbUrl: p.thumbUrl || p.mediaUrl || '',
      mediaUrl: p.mediaUrl || '',
      likes: p.likes || 0,
      comments: p.comments || 0,
      isVideo: p.isVideo || false,
      isSidecar: p.isSidecar || false,
      caption: p.caption,
    })) || [],
    storiesList: apiProfile.storiesList?.map((s: any) => ({
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

/**
 * Get base URL for API calls
 */
function getBaseUrl(): string {
  // In server actions, we should use relative URLs when possible
  // to avoid issues with internal routing
  if (typeof window !== 'undefined') {
    // Client-side: use full URL
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    return process.env.NEXT_PUBLIC_BASE_URL || '';
  } else {
    // Server-side: use relative URL or full URL based on environment
    // For server actions, we can use the origin from environment or relative path
    const origin = process.env.NEXT_PUBLIC_BASE_URL ||
                  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
    
    // If we have an origin, use it, otherwise use relative path
    return origin || '';
  }
}
