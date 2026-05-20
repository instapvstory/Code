import { Profile, Post } from '@/components/viewer/ProfileView/ProfileView';


const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Instagram Graph API Implementation
 * 
 * This implementation uses the official Instagram Graph API to fetch:
 * 1. Stories (24-hour content)
 * 2. Highlights (saved stories)
 * 3. Profile information
 * 
 * Note: Requires Instagram Business Account with proper permissions
 */

/**
 * Get Instagram Business Account ID from the access token
 */
async function getInstagramBusinessId(): Promise<string> {
  if (!(process.env.INSTAGRAM_ACCESS_TOKEN)) {
    throw new Error('INSTAGRAM_(process.env.INSTAGRAM_ACCESS_TOKEN) is not configured');
  }

  try {
    // Method 1: Try to get from /me/accounts
    const accountsResponse = await fetch(
      `${BASE_URL}/me/accounts?fields=instagram_business_account&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`
    );
    const accountsData = await accountsResponse.json();
    
    if (accountsData.data && accountsData.data.length > 0) {
      const igAccount = accountsData.data.find((acc: any) => acc.instagram_business_account);
      if (igAccount?.instagram_business_account?.id) {
        return igAccount.instagram_business_account.id;
      }
    }

    // Method 2: Try to get from /me directly
    const meResponse = await fetch(
      `${BASE_URL}/me?fields=instagram_business_account&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`
    );
    const meData = await meResponse.json();
    
    if (meData.instagram_business_account?.id) {
      return meData.instagram_business_account.id;
    }

    // Method 3: Try debug_token to get target IDs
    const debugResponse = await fetch(
      `${BASE_URL}/debug_token?input_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`
    );
    const debugData = await debugResponse.json();
    
    if (debugData.data?.granular_scopes) {
      const scopes = debugData.data.granular_scopes;
      const basicScope = scopes.find((s: any) => 
        s.scope === 'instagram_basic' || s.scope === 'instagram_manage_insights'
      );
      if (basicScope?.target_ids && basicScope.target_ids.length > 0) {
        return basicScope.target_ids[0];
      }
    }

    throw new Error('Could not find Instagram Business Account ID. Make sure your account is a Business Account with proper permissions.');
  } catch (error) {
    console.error('Error getting Instagram Business ID:', error);
    throw new Error(`Failed to get Instagram Business Account ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch stories from Instagram Graph API
 */
async function fetchStories(instagramUserId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/${instagramUserId}/stories?fields=id,media_type,media_url,permalink,timestamp,caption&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching stories:', data.error);
      return [];
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

/**
 * Fetch media (posts) from Instagram Graph API
 * This can be used to get highlights (saved stories)
 */
async function fetchMedia(instagramUserId: string, limit: number = 50): Promise<any[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/${instagramUserId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{media_type,media_url},like_count,comments_count&limit=${limit}&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching media:', data.error);
      return [];
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
}

/**
 * Fetch Instagram profile information
 */
async function fetchProfileInfo(instagramUserId: string): Promise<any> {
  try {
    const response = await fetch(
      `${BASE_URL}/${instagramUserId}?fields=id,username,profile_picture_url,followers_count,follows_count,media_count,name,biography,website&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching profile info:', data.error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching profile info:', error);
    return null;
  }
}

/**
 * Convert Instagram Graph API story to our Story interface
 */
function convertGraphStoryToStory(graphStory: any, index: number, profilePicUrl: string): any {
  let thumbUrl = graphStory.thumbnail_url || graphStory.media_url || profilePicUrl;
  if (thumbUrl && /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(thumbUrl)) thumbUrl = profilePicUrl;
  
  return {
    id: graphStory.id || `story_${index}`,
    thumbUrl,
    likes: 0, // Stories don't have likes in Graph API
    comments: 0, // Stories don't have comments in Graph API
    isVideo: graphStory.media_type === 'VIDEO' || graphStory.media_type === 'REELS',
    isSidecar: false,
    mediaUrl: graphStory.media_url || '',
    caption: graphStory.caption || '',
    timestamp: graphStory.timestamp ? new Date(graphStory.timestamp).getTime() : Date.now(),
    isPlaceholder: false,
  };
}

/**
 * Convert Instagram Graph API media to our Post interface
 */
function convertGraphMediaToPost(graphMedia: any, index: number, profilePicUrl: string): Post {
  let thumbUrl = graphMedia.thumbnail_url || graphMedia.media_url || profilePicUrl;
  if (thumbUrl && /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(thumbUrl)) thumbUrl = profilePicUrl;

  return {
    id: graphMedia.id || `post_${index}`,
    thumbUrl,
    likes: graphMedia.like_count || 0,
    comments: graphMedia.comments_count || 0,
    isVideo: graphMedia.media_type === 'VIDEO' || graphMedia.media_type === 'REELS',
    isSidecar: graphMedia.media_type === 'CAROUSEL_ALBUM',
    mediaUrl: graphMedia.media_url || '',
    caption: graphMedia.caption || '',
  };
}

/**
 * Get highlights from media (filter for saved stories/reels)
 */
function extractHighlightsFromMedia(media: any[], profilePicUrl: string): any[] {
  // Sort by engagement (likes + comments) to pick the "best" highlights
  const highlights = [...media]
    .sort((a, b) => ((b.like_count || 0) + (b.comments_count || 0)) - ((a.like_count || 0) + (a.comments_count || 0)))
    .filter(item => item.media_type === 'REELS' || item.media_type === 'CAROUSEL_ALBUM' || item.media_type === 'VIDEO')
    .slice(0, 2); 
  
  return highlights.map((highlight, index) => {
    const rawUrl = highlight.thumbnail_url || highlight.media_url || profilePicUrl;
    const isVideo = /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(rawUrl);
    
    return {
      id: highlight.id || `highlight_${index}`,
      title: extractHighlightTitle(highlight.caption) || `Featured ${index + 1}`,
      coverUrl: isVideo ? profilePicUrl : rawUrl,
      caption: highlight.caption || '',
      mediaCount: highlight.children ? highlight.children.length : 1,
      isPlaceholder: false,
    };
  });
}

/**
 * Extract a title from highlight caption
 */
function extractHighlightTitle(caption: string): string {
  if (!caption) return '';
  
  // Try to extract first few words as title
  const words = caption.split(' ').slice(0, 3).join(' ');
  return words.length > 20 ? words.substring(0, 20) + '...' : words;
}

/**
 * Main function to fetch Instagram profile with stories and highlights using Graph API
 */
export async function getInstagramProfileGraphAPI(username: string): Promise<Profile> {
  try {
    console.log(`Fetching Instagram profile for ${username} using Graph API...`);
    
    // First, get the Instagram Business Account ID
    const instagramUserId = await getInstagramBusinessId();
    console.log(`Instagram Business Account ID: ${instagramUserId}`);
    
    // Fetch profile information
    const profileInfo = await fetchProfileInfo(instagramUserId);
    if (!profileInfo) {
      throw new Error('Failed to fetch profile information');
    }
    
    const profilePicUrl = profileInfo.profile_picture_url || '';

    // Fetch stories
    const graphStories = await fetchStories(instagramUserId);
    const storiesList = graphStories.slice(0, 2).map((s, i) => convertGraphStoryToStory(s, i, profilePicUrl));
    
    // Fetch media (for posts and highlights)
    const graphMedia = await fetchMedia(instagramUserId, 30);
    const postsList = graphMedia.map((m, i) => convertGraphMediaToPost(m, i, profilePicUrl));
    
    // Extract highlights from media
    const highlights = extractHighlightsFromMedia(graphMedia, profilePicUrl);
    
    // Build the profile object
    const profile: Profile = {
      username: profileInfo.username || username,
      fullName: profileInfo.name || '',
      profilePicUrl: profileInfo.profile_picture_url || '',
      bio: profileInfo.biography || '',
      followers: profileInfo.followers_count || 0,
      following: profileInfo.follows_count || 0,
      posts: profileInfo.media_count || 0,
      isVerified: false, // Graph API doesn't provide verification status
      isBusinessAccount: true, // Graph API only works with business accounts
      website: profileInfo.website || '',
      hasStory: storiesList.length > 0,
      storiesList: storiesList,
      storiesArePlaceholder: false,
      highlights: highlights,
      highlightsArePlaceholder: false,
      postsList: postsList,
    };
    
    console.log(`Successfully fetched profile via Graph API: ${profile.username}`);
    console.log(`- Stories: ${storiesList.length}`);
    console.log(`- Highlights: ${highlights.length}`);
    console.log(`- Posts: ${postsList.length}`);
    
    return profile;
    
  } catch (error) {
    console.error('Error fetching Instagram profile via Graph API:', error);
    
    // Return a minimal profile with error indication
    return {
      username,
      fullName: '',
      profilePicUrl: '',
      bio: '',
      followers: 0,
      following: 0,
      posts: 0,
      isVerified: false,
      isBusinessAccount: false,
      website: '',
      hasStory: false,
      storiesList: [],
      storiesArePlaceholder: true,
      highlights: [],
      highlightsArePlaceholder: true,
      postsList: [],
    };
  }
}

/**
 * Test function to verify Graph API access
 */
export async function testGraphAPIAccess(): Promise<{
  success: boolean;
  instagramUserId?: string;
  storiesCount?: number;
  highlightsCount?: number;
  error?: string;
}> {
  try {
    console.log('Testing Instagram Graph API access...');
    
    const instagramUserId = await getInstagramBusinessId();
    console.log(`Instagram Business Account ID: ${instagramUserId}`);
    
    const stories = await fetchStories(instagramUserId);
    const media = await fetchMedia(instagramUserId, 10);
    const highlights = extractHighlightsFromMedia(media, '');
    
    return {
      success: true,
      instagramUserId,
      storiesCount: stories.length,
      highlightsCount: highlights.length,
    };
  } catch (error) {
    console.error('Graph API test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}