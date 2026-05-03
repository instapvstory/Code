import { Profile, Post, Highlight } from '@/components/viewer/ProfileView/ProfileView';
import { scrapeInstagramProfile } from './instagram-scraper-fixed';
import { getInstagramProfileGraphAPI } from './instagram-graph-api';

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Module-level cache for the Business ID — avoids 1-3 serial API calls on every request
let cachedCallerId: string | null = null;
let callerIdCachedAt: number = 0;
const CALLER_ID_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours


/**
 * Generates placeholder stories and highlights from video posts (reels) in the profile.
 * Selects random videos from the latest posts, ensuring no overlap between stories and highlights.
 */
/**
 * Generates placeholder stories and highlights from the latest posts in the profile.
 * Selects 3-4 random posts to populate stories and highlights sections.
 */
function generatePlaceholdersFromPosts(
  postsList: Post[],
  username: string,
  profilePicUrl: string
): { storiesList: Post[], highlights: Highlight[], hasStory: boolean } {
  
  if (!postsList || postsList.length === 0) {
    return { storiesList: [], highlights: [], hasStory: false };
  }
  
  // Prefer video posts for a more dynamic feel, but allow all types
  const videoPosts = postsList.filter(post => post.isVideo);
  const otherPosts = postsList.filter(post => !post.isVideo);
  
  // Combine them, putting videos first to prioritize them if available
  const prioritizedPosts = [...videoPosts, ...otherPosts];
  
  // Select 3 to 4 random posts from the latest available
  // We'll take from the first 12 posts to keep them "recent"
  const recentPool = prioritizedPosts.slice(0, 12);
  const selectedCount = Math.floor(Math.random() * 2) + 3; // 3 or 4
  // Sort by engagement to pick the most interesting posts for stories/highlights
  const sortedPool = [...recentPool].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
  const selectedPosts = sortedPool.slice(0, Math.min(selectedCount, sortedPool.length));
  
  // Distribute selected posts between stories and highlights
  // The user specifically asked for 1 or 2 highlights. We'll aim for exactly 2.
  // Ensure we always have at least 1 highlight if there are posts
  let highlightCount = 0;
  if (selectedPosts.length >= 2) {
    // If we have 2+ posts, generate 2 highlights
    highlightCount = Math.min(2, selectedPosts.length);
  } else if (selectedPosts.length === 1) {
    // If we only have 1 post, generate 1 highlight
    highlightCount = 1;
  }
  
  // If highlightCount is 0 (shouldn't happen if selectedPosts.length > 0), default to 1
  if (highlightCount === 0 && selectedPosts.length > 0) {
    highlightCount = 1;
  }
  
  const highlightItems = selectedPosts.slice(0, highlightCount);
  const storyItems = selectedPosts.slice(highlightCount);
  
  const storiesList: Post[] = storyItems.map((post, index) => ({
    ...post,
    id: `story_${username}_${Date.now()}_${index}`,
    likes: 0,
    comments: 0,
  }));
  
  const highlights: Highlight[] = highlightItems.map((post, index) => {
    const highlightTitles = [
      'Moments', 'Vibes', 'Daily', 'Highlights', 'Featured', 
      'Latest', 'Memories', 'Archive', 'Favorites', 'Life'
    ];
    const randomTitle = highlightTitles[Math.floor(Math.random() * highlightTitles.length)];
    
    return {
      id: `highlight_${username}_${Date.now()}_${index}`,
      title: randomTitle,
      coverUrl: (post.thumbUrl && !/\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(post.thumbUrl)) ? post.thumbUrl : profilePicUrl,
      caption: post.caption || `Captured ${randomTitle.toLowerCase()} from my posts.`,
      mediaUrl: post.mediaUrl || post.thumbUrl,
      mediaCount: Math.floor(Math.random() * 3) + 1, // 1-3 items
      createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
  
  const hasStory = storiesList.length > 0;
  
  console.log(`Generated ${storiesList.length} stories and ${highlights.length} highlights from ${postsList.length} posts for ${username}`);
  
  return { storiesList, highlights, hasStory };
}


/**
 * Fetches the Instagram Business Account ID associated with the provided access token.
 */
async function getMyBusinessId(): Promise<string> {
  // First attempt: Check via Pages (/me/accounts)
  let response = await fetch(`${BASE_URL}/me/accounts?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`);
  let data = await response.json();
  
  if (data.data && data.data.length > 0) {
    const igAccount = data.data.find((acc: any) => acc.instagram_business_account);
    if (igAccount?.instagram_business_account) {
      return igAccount.instagram_business_account.id;
    }
  }

  // Second attempt: Check direct context (/me)
  response = await fetch(`${BASE_URL}/me?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`);
  data = await response.json();
  
  if (data.instagram_business_account) {
    return data.instagram_business_account.id;
  }

  // Third attempt: Extract target ID directly from token debugging (fixes OAuthException #100 on /me)
  response = await fetch(`${BASE_URL}/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`);
  data = await response.json();
  
  const scopes = data.data?.granular_scopes;
  if (scopes) {
    const basicScope = scopes.find((s: any) => s.scope === 'instagram_basic' || s.scope === 'instagram_manage_insights');
    if (basicScope && basicScope.target_ids && basicScope.target_ids.length > 0) {
      return basicScope.target_ids[0];
    }
  }

  // All failed - report details
  const errorMsg = data.error 
    ? `API Error: ${data.error.message} (Type: ${data.error.type})`
    : `Could not find an Instagram Business account linked to this token. /me returned: ${JSON.stringify(data)}`;
    
  throw new Error(errorMsg);
}

/**
 * Fetches basic profile information from the public Instagram page as a fallback.
 * This is used for Personal accounts that the Graph API cannot access.
 */
async function getPublicProfileFallback(username: string): Promise<Profile> {
  console.log(`Attempting public fallback for ${username}...`);
  const url = `https://www.instagram.com/${username}/`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Public page returned ${response.status}`);
    }

    const html = await response.text();

    // extract og:image
    const imageMatch = html.match(/<meta [^>]*property="og:image" [^>]*content="([^"]+)"/i) ||
                       html.match(/<meta [^>]*content="([^"]+)" [^>]*property="og:image"/i);
    const profilePicUrl = imageMatch ? imageMatch[1].replace(/&amp;/g, '&') : '';

    // extract og:title
    const titleMatch = html.match(/<meta [^>]*property="og:title" [^>]*content="([^"]+)"/i) ||
                       html.match(/<meta [^>]*content="([^"]+)" [^>]*property="og:title"/i);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#064;/g, '@') : username;
    
    // Title is usually "Name (@username) • Instagram photos and videos"
    const fullName = title.split(' (')[0] || username;

    // extract og:description
    const descMatch = html.match(/<meta [^>]*property="og:description" [^>]*content="([^"]+)"/i) ||
                       html.match(/<meta [^>]*content="([^"]+)" [^>]*property="og:description"/i);
    const description = descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&#064;/g, '@') : '';
    
    // Description: "84K Followers, 200 Following, 1,469 Posts - ..."
    const statsMatch = description.match(/([\d.,]+[KMB]?) Followers, ([\d.,]+[KMB]?) Following, ([\d.,]+[KMB]?) Posts/i);
    
    const parseStat = (s: string) => {
      if (!s) return 0;
      let cleaned = s.replace(/,/g, '');
      let val = parseFloat(cleaned);
      if (cleaned.endsWith('K')) val *= 1000;
      if (cleaned.endsWith('M')) val *= 1000000;
      return Math.floor(val);
    };

    const followers = statsMatch ? parseStat(statsMatch[1]) : 0;
    const following = statsMatch ? parseStat(statsMatch[2]) : 0;
    const posts = statsMatch ? parseStat(statsMatch[3]) : 0;
    
    // The bio is sometimes after " - " but often overwritten by "See Instagram photos..."
    let bio = '';
    if (description.includes(' - ')) {
      const parts = description.split(' - ');
      if (parts.length > 1 && !parts[1].startsWith('See Instagram photos')) {
        bio = parts[1];
      }
    }

    // Try to extract media data from script tags
    let postsList: Post[] = [];
    try {
      // Look for window._sharedData or additionalData
      // Use [\s\S]* instead of .* with s flag for cross-line matching
      const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({[\s\S]*?});/);
      console.log(`Shared data match found: ${!!sharedDataMatch}`);
      if (sharedDataMatch) {
        console.log('Shared data length:', sharedDataMatch[1].length);
        try {
          const sharedData = JSON.parse(sharedDataMatch[1]);
          const user = sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;
          console.log('User found in sharedData:', !!user);
          if (user && user.edge_owner_to_timeline_media?.edges) {
            console.log('Edges found:', user.edge_owner_to_timeline_media.edges.length);
            const edges = user.edge_owner_to_timeline_media.edges.slice(0, 12); // Get first 12 posts
            postsList = edges.map((edge: any, index: number) => {
              const node = edge.node;
              return {
                id: `fallback_${username}_${index}`,
                thumbUrl: node.display_url || node.thumbnail_src || profilePicUrl,
                likes: node.edge_liked_by?.count || 0,
                comments: node.edge_media_to_comment?.count || 0,
                isVideo: node.is_video || false,
                isSidecar: node.__typename === 'GraphSidecar',
                mediaUrl: node.display_url || node.thumbnail_src || '',
                caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
              };
            });
          }
        } catch (e) {
          console.log('Failed to parse sharedData JSON:', e);
        }
      }
      
      // Alternative: Look for additionalData
      if (postsList.length === 0) {
        const additionalDataMatch = html.match(/window\.additionalData\s*=\s*({[\s\S]*?});/);
        console.log(`Additional data match found: ${!!additionalDataMatch}`);
        if (additionalDataMatch) {
          try {
            const additionalData = JSON.parse(additionalDataMatch[1]);
            const items = additionalData?.graphql?.user?.edge_owner_to_timeline_media?.edges;
            if (items && items.length > 0) {
              postsList = items.slice(0, 12).map((edge: any, index: number) => {
                const node = edge.node;
                return {
                  id: `fallback_${username}_${index}`,
                  thumbUrl: node.display_url || node.thumbnail_src || profilePicUrl,
                  likes: node.edge_liked_by?.count || 0,
                  comments: node.edge_media_to_comment?.count || 0,
                  isVideo: node.is_video || false,
                  isSidecar: node.__typename === 'GraphSidecar',
                  mediaUrl: node.display_url || node.thumbnail_src || '',
                  caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
                };
              });
            }
          } catch (e) {
            console.log('Failed to parse additionalData:', e);
          }
        }
      }
      
      // Alternative: Look for any script with media data
      if (postsList.length === 0) {
        // Try to find any JSON-LD or script with media
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatches) {
          console.log(`Found ${scriptMatches.length} script tags`);
          for (const script of scriptMatches.slice(0, 10)) {
            if (script.includes('edge_owner_to_timeline_media') || script.includes('display_url')) {
              console.log('Found script with media data');
              // Try to extract JSON from script
              const jsonMatch = script.match(/{[\s\S]*}/);
              if (jsonMatch) {
                try {
                  const data = JSON.parse(jsonMatch[0]);
                  // Try to find media data in nested structure
                  const findMedia = (obj: any): any[] => {
                    if (Array.isArray(obj)) {
                      for (const item of obj) {
                        const result = findMedia(item);
                        if (result.length > 0) return result;
                      }
                    } else if (obj && typeof obj === 'object') {
                      if (obj.edges && Array.isArray(obj.edges) && obj.edges[0]?.node?.display_url) {
                        return obj.edges;
                      }
                      for (const key in obj) {
                        const result = findMedia(obj[key]);
                        if (result.length > 0) return result;
                      }
                    }
                    return [];
                  };
                  
                  const mediaEdges = findMedia(data);
                  if (mediaEdges.length > 0) {
                    postsList = mediaEdges.slice(0, 12).map((edge: any, index: number) => {
                      const node = edge.node;
                      return {
                        id: `fallback_${username}_${index}`,
                        thumbUrl: node.display_url || node.thumbnail_src || profilePicUrl,
                        likes: node.edge_liked_by?.count || 0,
                        comments: node.edge_media_to_comment?.count || 0,
                        isVideo: node.is_video || false,
                        isSidecar: node.__typename === 'GraphSidecar',
                        mediaUrl: node.display_url || node.thumbnail_src || '',
                        caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
                      };
                    });
                    break;
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('Could not extract media data from HTML:', error);
    }
    console.log(`Extracted ${postsList.length} posts from HTML`);
    
    // If no posts were extracted, generate placeholder posts for better UX
    if (postsList.length === 0 && posts > 0) {
      console.log(`Generating ${Math.min(posts, 12)} placeholder posts for better UX`);
      postsList = Array.from({ length: Math.min(posts, 12) }, (_, index) => ({
        id: `placeholder_${username}_${index}`,
        thumbUrl: profilePicUrl,
        likes: Math.floor(Math.random() * 1000) + 50,
        comments: Math.floor(Math.random() * 100) + 5,
        isVideo: index % 4 === 0, // Every 4th post is a video
        isSidecar: index % 6 === 0, // Every 6th post is a sidecar
        mediaUrl: profilePicUrl,
        caption: index % 3 === 0 ? `Check out my latest post! #${username}` : '',
      }));
    }

    // Try to extract real stories and highlights from HTML
    let realStories: Post[] = [];
    let realHighlights: Highlight[] = [];

    try {
      // Look for edge_story_media or edge_highlight_reels in script tags
      const storyMatches = html.match(/"edge_story_media":\s*({[\s\S]*?})\s*,\s*"edge_owner_to_timeline_media"/);
      if (storyMatches) {
        try {
          const storyData = JSON.parse(storyMatches[1]);
          if (storyData.edges && storyData.edges.length > 0) {
            console.log(`Found ${storyData.edges.length} real stories in HTML`);
            realStories = storyData.edges.map((edge: any, index: number) => ({
              id: edge.node.id || `real_story_${index}`,
              thumbUrl: edge.node.display_url || edge.node.thumbnail_src || profilePicUrl,
              likes: 0,
              comments: 0,
              isVideo: edge.node.is_video || false,
              isSidecar: false,
              mediaUrl: edge.node.display_url || edge.node.thumbnail_src || '',
              caption: edge.node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
            }));
          }
        } catch (e) {
          console.log('Failed to parse real stories from HTML');
        }
      }

      const highlightMatches = html.match(/"edge_highlight_reels":\s*({[\s\S]*?})\s*,\s*"edge_owner_to_timeline_media"/);
      if (highlightMatches) {
        try {
          const highlightData = JSON.parse(highlightMatches[1]);
          if (highlightData.edges && highlightData.edges.length > 0) {
            console.log(`Found ${highlightData.edges.length} real highlights in HTML`);
            realHighlights = highlightData.edges.map((edge: any, index: number) => ({
              id: edge.node.id || `real_highlight_${index}`,
              title: edge.node.title || 'Highlight',
              coverUrl: edge.node.cover_media?.thumbnail_src || edge.node.cover_media?.display_url || profilePicUrl,
              caption: edge.node.title || '',
              mediaUrl: edge.node.cover_media?.display_url || '',
              mediaCount: edge.node.media_count || 1,
              createdAt: edge.node.created_at ? new Date(edge.node.created_at * 1000).toISOString() : new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.log('Failed to parse real highlights from HTML');
        }
      }
    } catch (error) {
      console.log('Error during real stories/highlights extraction:', error);
    }

    // Generate placeholder stories and highlights from posts
    let storiesList: Post[] = [];
    let highlights: Highlight[] = [];
    let hasStory = false;
    
    if (postsList.length > 0) {
      const placeholders = generatePlaceholdersFromPosts(postsList, username, profilePicUrl);
      
      // Mix real stories with placeholders
      // We take up to 2 real stories if available, otherwise use placeholders
      storiesList = realStories.length > 0 
        ? [...realStories.slice(0, 2), ...placeholders.storiesList.slice(0, Math.max(0, 2 - realStories.length))]
        : placeholders.storiesList;
        
      // Mix real highlights with placeholders
      highlights = realHighlights.length > 0
        ? [...realHighlights.slice(0, 2), ...placeholders.highlights.slice(0, Math.max(0, 2 - realHighlights.length))]
        : placeholders.highlights;
        
      hasStory = storiesList.length > 0;
    }

    return {
      username,
      fullName,
      bio,
      profilePicUrl,
      posts,
      followers,
      following,
      isVerified: html.includes('Verified') || title.includes('Verified'),
      isBusinessAccount: false,
      hasStory: hasStory,
      highlights: highlights,
      postsList,
      storiesList: storiesList,
      // Mark as placeholder data
      storiesArePlaceholder: storiesList.length > 0,
      highlightsArePlaceholder: highlights.length > 0,
    };
  } catch (error) {
    console.error(`Fallback failed for ${username}:`, error);
    throw error;
  }
}

/**
 * Fetches a profile's information using Business Discovery and Graph API for stories/highlights.
 */
export async function getInstagramProfile(username: string): Promise<Profile> {
  if (!ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is not configured.');
  }

  let callerId: string;
  try {
    const now = Date.now();
    if (cachedCallerId && (now - callerIdCachedAt) < CALLER_ID_CACHE_TTL_MS) {
      callerId = cachedCallerId;
      console.log('Using cached Business ID:', callerId);
    } else {
      callerId = await getMyBusinessId();
      cachedCallerId = callerId;
      callerIdCachedAt = now;
      console.log('Fetched and cached new Business ID:', callerId);
    }
  } catch (error: any) {
    console.error('Failed to get Business ID:', error);
    throw new Error(`Authentication Error: ${error.message}`);
  }
  
  const fields = `business_discovery.username(${username}){id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count,media.limit(50){id,media_url,like_count,comments_count,media_type,thumbnail_url,caption,timestamp}}`;
  
  const url = `${BASE_URL}/${callerId}?fields=${fields}&access_token=${ACCESS_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    console.error('Instagram API Error details:', {
      error: data.error,
      url,
      username,
      callerId
    });

    // Special handling for Personal accounts (Code 110/Subcode 2207013)
    if (data.error.code === 110 || data.error.message?.includes('Cannot find User')) {
      try {
        console.log(`Graph API failed for ${username}, trying enhanced scraper...`);
        return await scrapeInstagramProfile(username);
      } catch (fallbackError) {
        console.error('Enhanced scraper also failed:', fallbackError);
        // If enhanced scraper fails, try the basic public fallback
        try {
          return await getPublicProfileFallback(username);
        } catch (basicFallbackError) {
          // If all fallbacks fail, throw a specific targeted error
          const err = new Error(`PERSONAL_ACCOUNT: ${data.error.message}`);
          (err as any).code = 110;
          throw err;
        }
      }
    }

    throw new Error(`Instagram API Error: ${data.error.message}`);
  }

  const discovery = data.business_discovery;
  
  // Map the response to our Profile interface — sorted newest first by timestamp
  const rawMedia: any[] = discovery.media?.data || [];
  // Sort by timestamp descending (newest first)
  rawMedia.sort((a: any, b: any) => {
    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tB - tA;
  });

  const postsList: Post[] = rawMedia.map((m: any) => ({
    id: m.id,
    thumbUrl: m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url,
    likes: m.like_count || 0,
    comments: m.comments_count || 0,
    isVideo: m.media_type === 'VIDEO',
    isSidecar: m.media_type === 'CAROUSEL_ALBUM',
    mediaUrl: m.media_url,
    caption: m.caption,
  }));

  // Try to fetch stories and highlights from Graph API
  let storiesList: any[] = [];
  let highlights: any[] = [];
  let hasStory = false;
  
  try {
    const graphProfile = await getInstagramProfileGraphAPI(username);
    storiesList = graphProfile.storiesList || [];
    highlights = graphProfile.highlights || [];
    hasStory = graphProfile.hasStory || false;
    
    // If Graph API returns empty arrays, generate placeholders from video posts
    if ((storiesList.length === 0 || highlights.length === 0) && postsList.length > 0) {
      console.log(`Graph API returned empty stories/highlights for ${username}, generating placeholders from video posts`);
      const placeholders = generatePlaceholdersFromPosts(postsList, username, discovery.profile_picture_url);
      
      // Only use placeholders if we don't have real data
      if (storiesList.length === 0) {
        storiesList = placeholders.storiesList;
        hasStory = placeholders.hasStory;
      }
      if (highlights.length === 0) {
        highlights = placeholders.highlights;
      }
    }
  } catch (graphError) {
    console.warn(`Graph API stories/highlights fetch failed for ${username}:`, graphError);
    // Generate placeholders from video posts as fallback
    if (postsList.length > 0) {
      console.log(`Generating placeholder stories/highlights from video posts for ${username}`);
      const placeholders = generatePlaceholdersFromPosts(postsList, username, discovery.profile_picture_url);
      storiesList = placeholders.storiesList;
      highlights = placeholders.highlights;
      hasStory = placeholders.hasStory;
    }
  }

  // Determine if stories/highlights are placeholders
  const storiesArePlaceholder = storiesList.length > 0 && storiesList.some(s => s.id.includes('story_'));
  const highlightsArePlaceholder = highlights.length > 0 && highlights.some(h => h.id.includes('highlight_'));

  return {
    username: discovery.username,
    fullName: discovery.name || discovery.username,
    bio: discovery.biography || '',
    website: discovery.website,
    isVerified: false,
    isBusinessAccount: true,
    profilePicUrl: discovery.profile_picture_url,
    posts: discovery.media_count,
    followers: discovery.followers_count,
    following: discovery.follows_count,
    hasStory: hasStory,
    highlights: highlights,
    postsList: postsList,
    storiesList: storiesList,
    // Mark as placeholder data if generated from video posts
    storiesArePlaceholder,
    highlightsArePlaceholder,
  };
}
