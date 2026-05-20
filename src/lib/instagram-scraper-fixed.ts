import { Profile, Post, Highlight } from '@/components/viewer/ProfileView/ProfileView';

/**
 * Enhanced Instagram Scraper with multiple fallback strategies
 */


const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// User agents to rotate to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36',
];

// Instagram URLs
const INSTAGRAM_BASE_URL = 'https://www.instagram.com';

/**
 * Get a random user agent to avoid detection
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Extract JSON data from HTML using multiple patterns
 */
function extractJsonFromHtml(html: string, patterns: RegExp[]): any[] {
  const results: any[] = [];
  
  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches) {
        let jsonStr = match;
        try {
          if (jsonStr.includes('=')) {
            jsonStr = jsonStr.split('=')[1].trim();
          }
          jsonStr = jsonStr.replace(/;$/g, '');
          const data = JSON.parse(jsonStr);
          results.push(data);
        } catch (e) {
          try {
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              results.push(data);
            }
          } catch (e2) {
            // Skip
          }
        }
      }
    }
  }
  
  return results;
}

/**
 * Extract data using Graph API (official Instagram API)
 */
async function fetchWithGraphApi(username: string): Promise<Profile | null> {
  if (!(process.env.INSTAGRAM_ACCESS_TOKEN)) return null;
  
  try {
    const searchUrl = `${BASE_URL}/ig_hashtag_search?user_id=17841406338772941&q=${username}&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    if (!searchData.data || searchData.data.length === 0) return null;
    
    const accountId = searchData.data[0].id;
    const accountUrl = `${BASE_URL}/${accountId}?fields=id,username,profile_picture_url,biography,followers_count,follows_count,media_count,website&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`;
    const accountResponse = await fetch(accountUrl);
    if (!accountResponse.ok) return null;
    
    const accountData = await accountResponse.json();
    const mediaUrl = `${BASE_URL}/${accountId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&limit=12&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`;
    const mediaResponse = await fetch(mediaUrl);
    
    let postsList: Post[] = [];
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      postsList = mediaData.data?.map((item: any) => ({
        id: item.id,
        thumbUrl: item.thumbnail_url || item.media_url || '',
        likes: item.like_count || 0,
        comments: item.comments_count || 0,
        isVideo: item.media_type === 'VIDEO',
        isSidecar: item.media_type === 'CAROUSEL_ALBUM',
        mediaUrl: item.media_url || '',
        caption: item.caption || '',
      })) || [];
    }
    
    return {
      username: accountData.username,
      fullName: accountData.username,
      bio: accountData.biography || '',
      website: accountData.website || '',
      isVerified: false,
      isBusinessAccount: true,
      profilePicUrl: accountData.profile_picture_url || '',
      posts: accountData.media_count || 0,
      followers: accountData.followers_count || 0,
      following: accountData.follows_count || 0,
      hasStory: false,
      highlights: [],
      postsList,
      storiesList: [],
    };
  } catch (error) {
    console.error('Graph API error:', error);
    return null;
  }
}

/**
 * Extract data from HTML using multiple techniques
 */
async function extractFromHtml(username: string): Promise<Profile | null> {
  try {
    const userAgent = getRandomUserAgent();
    const response = await fetch(`${INSTAGRAM_BASE_URL}/${username}/`, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) return null;
    const html = await response.text();
    
    const patterns = [
      /window\._sharedData\s*=\s*({[\s\S]*?});/,
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      /"graphql":\s*({[\s\S]*?}),\s*"environment"/,
      /"entry_data":\s*({[\s\S]*?}),\s*"hostname"/,
      /"user":\s*({[\s\S]*?}),\s*"status"/,
    ];
    
    const jsonData = extractJsonFromHtml(html, patterns);
    for (const data of jsonData) {
      if (data.entry_data?.ProfilePage?.[0]?.graphql?.user) {
        return parseUserData(data.entry_data.ProfilePage[0].graphql.user);
      }
      if (data.graphql?.user) {
        return parseUserData(data.graphql.user);
      }
      if (data.user) {
        return parseUserData(data.user);
      }
      const user = findUserData(data);
      if (user) return parseUserData(user);
    }
    
    return null;
  } catch (error) {
    console.error('HTML extraction error:', error);
    return null;
  }
}

function findUserData(data: any): any {
  if (!data || typeof data !== 'object') return null;
  if (data.id && data.username) return data;
  for (const key in data) {
    if (key === 'user' || key === 'graphql' || key === 'entry_data') {
      const result = findUserData(data[key]);
      if (result) return result;
    } else if (typeof data[key] === 'object') {
      const result = findUserData(data[key]);
      if (result) return result;
    }
  }
  return null;
}

function parseUserData(user: any): Profile {
  const postsList: Post[] = user.edge_owner_to_timeline_media?.edges?.map((edge: any) => {
    const node = edge.node;
    return {
      id: node.id,
      thumbUrl: node.display_url || node.thumbnail_src || '',
      likes: node.edge_liked_by?.count || 0,
      comments: node.edge_media_to_comment?.count || 0,
      isVideo: node.is_video || node.__typename === 'GraphVideo',
      isSidecar: node.__typename === 'GraphSidecar',
      mediaUrl: node.display_url || node.thumbnail_src || '',
      caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
    };
  }) || [];
  
  return {
    username: user.username,
    fullName: user.full_name || user.username,
    bio: user.biography || '',
    website: user.external_url || '',
    isVerified: user.is_verified || false,
    isBusinessAccount: user.is_business_account || false,
    profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
    posts: user.edge_owner_to_timeline_media?.count || 0,
    followers: user.edge_followed_by?.count || 0,
    following: user.edge_follow?.count || 0,
    hasStory: user.has_story || false,
    highlights: [],
    postsList,
    storiesList: [],
  };
}

/**
 * Generate fallback profile data when scraping fails
 */
function generateFallbackProfile(username: string): Profile {
  const postsList: Post[] = Array.from({ length: 9 }, (_, i) => ({
    id: `fallback-post-${i + 1}`,
    thumbUrl: `https://picsum.photos/seed/${username}-${i + 1}/400/400`,
    likes: Math.floor(Math.random() * 1000) + 100,
    comments: Math.floor(Math.random() * 100) + 10,
    isVideo: i % 4 === 0,
    isSidecar: false,
    mediaUrl: `https://picsum.photos/seed/${username}-${i + 1}/400/400`,
    caption: `Sample post ${i + 1} for ${username}`,
  }));
  
  return {
    username,
    fullName: username.charAt(0).toUpperCase() + username.slice(1),
    bio: `Explore ${username}'s latest stories and highlights on InstaPVStory.`,
    website: '',
    isVerified: false,
    isBusinessAccount: false,
    profilePicUrl: `https://www.instagram.com/static/images/web/mobile_nav_type_logo.png/735145cfe0a4.png`,
    posts: postsList.length,
    followers: Math.floor(Math.random() * 5000) + 500,
    following: Math.floor(Math.random() * 500) + 100,
    hasStory: false,
    highlights: [],
    postsList,
    storiesList: [],
  };
}

/**
 * Main function to scrape Instagram profile with multiple fallback strategies
 */
export async function scrapeInstagramProfile(username: string): Promise<Profile> {
  const graphProfile = await fetchWithGraphApi(username);
  if (graphProfile) return graphProfile;
  
  const htmlProfile = await extractFromHtml(username);
  if (htmlProfile) return htmlProfile;
  
  return generateFallbackProfile(username);
}