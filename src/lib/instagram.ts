import { Profile, Post, Highlight } from '@/components/viewer/ProfileView/ProfileView';
import { scrapeInstagramProfile } from './instagram-scraper-fixed';
import { getInstagramProfileGraphAPI } from './instagram-graph-api';


const API_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Module-level cache for the Business ID — avoids 1-3 serial API calls on every request
let cachedCallerId: string | null = null;
let callerIdCachedAt: number = 0;
const CALLER_ID_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours


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
  let response = await fetch(`${BASE_URL}/me/accounts?fields=instagram_business_account&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`);
  let data = await response.json();
  
  if (data.data && data.data.length > 0) {
    const igAccount = data.data.find((acc: any) => acc.instagram_business_account);
    if (igAccount?.instagram_business_account) {
      return igAccount.instagram_business_account.id;
    }
  }

  // Second attempt: Check direct context (/me)
  response = await fetch(`${BASE_URL}/me?fields=instagram_business_account&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`);
  data = await response.json();
  
  if (data.instagram_business_account) {
    return data.instagram_business_account.id;
  }

  // Third attempt: Extract target ID directly from token debugging (fixes OAuthException #100 on /me)
  response = await fetch(`${BASE_URL}/debug_token?input_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`);
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
 * Uses og: meta tags (always present on public profiles) + modern
 * <script type="application/json"> blocks that replaced window._sharedData.
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#064;/g, '@')
    .replace(/&quot;/g, '"')
    .replace(/&#x2022;/g, '•')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

async function getPublicProfileFallback(username: string): Promise<Profile> {
  console.log(`Attempting public fallback for ${username}...`);
  const url = `https://www.instagram.com/${username}/`;

  // Fetch the basic profile info (followers, bio, full name, avatar) from instagram.com using the facebook crawler UA
  let html = '';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }
    });
    if (response.ok) {
      html = await response.text();
    }
  } catch (err) {
    console.error('Error fetching public instagram page:', err);
  }

  // Parse Profile Info from Instagram SEO Meta Tags
  const getMeta = (propOrName: string): string => {
    const m = html.match(new RegExp(`<meta [^>]*property="${propOrName}" [^>]*content="([^"]+)"`, 'i'))
               || html.match(new RegExp(`<meta [^>]*content="([^"]+)" [^>]*property="${propOrName}"`, 'i'))
               || html.match(new RegExp(`<meta [^>]*name="${propOrName}" [^>]*content="([^"]+)"`, 'i'))
               || html.match(new RegExp(`<meta [^>]*content="([^"]+)" [^>]*name="${propOrName}"`, 'i'));
    return m ? decodeHtmlEntities(m[1]) : '';
  };

  const profilePicUrl  = getMeta('og:image');
  const rawTitle       = getMeta('og:title');
  const ogDescription = getMeta('og:description');
  const nameDescription = getMeta('description');

  if (!profilePicUrl && !rawTitle) {
    throw new Error(`No public data found for @${username} — account may be private or does not exist.`);
  }

  const fullName = rawTitle.split(' (@')[0].trim() || rawTitle.split(' \u2022')[0].trim() || username;

  const parseStat = (s: string): number => {
    if (!s) return 0;
    const clean = s.replace(/,/g, '').trim();
    let val = parseFloat(clean);
    if (/K$/i.test(clean)) val *= 1_000;
    if (/M$/i.test(clean)) val *= 1_000_000;
    if (/B$/i.test(clean)) val *= 1_000_000_000;
    return isNaN(val) ? 0 : Math.floor(val);
  };

  const statsMatch = ogDescription.match(/([\d.,]+[KMBkmb]?)\s*Followers?,\s*([\d.,]+[KMBkmb]?)\s*Following,\s*([\d.,]+[KMBkmb]?)\s*Posts?/i)
                  || nameDescription.match(/([\d.,]+[KMBkmb]?)\s*Followers?,\s*([\d.,]+[KMBkmb]?)\s*Following,\s*([\d.,]+[KMBkmb]?)\s*Posts?/i);
  const followers = statsMatch ? parseStat(statsMatch[1]) : 0;
  const following = statsMatch ? parseStat(statsMatch[2]) : 0;
  const posts     = statsMatch ? parseStat(statsMatch[3]) : 0;

  let bio = '';
  const bioMatch = nameDescription.match(/on Instagram:\s*"(.*)"/i) || nameDescription.match(/on Instagram:\s*([^"]+)/i);
  if (bioMatch) {
    bio = bioMatch[1].trim();
  } else {
    const dashIdx = ogDescription.lastIndexOf(' - ');
    if (dashIdx !== -1) {
      const candidate = ogDescription.slice(dashIdx + 3).trim();
      if (!candidate.toLowerCase().startsWith('see instagram') && candidate.length > 2) {
        bio = candidate;
      }
    }
  }

  // Try to parse real posts from imginn.com
  let postsList: Post[] = [];
  try {
    console.log(`Attempting to scrape real posts from imginn.com for @${username}...`);
    const imginnUrl = `https://imginn.com/${username}/`;
    const imginnResponse = await fetch(imginnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (imginnResponse.ok) {
      const imginnHtml = await imginnResponse.text();
      const postMatches = [...imginnHtml.matchAll(/<a [^>]*href="\/p\/([^"]+)\/"[^>]*>([\s\S]*?)<\/a>/gi)];
      
      postsList = postMatches
        .map((m): Post | null => {
          const shortcode = m[1];
          if (shortcode === '{code}') return null;

          const innerHtml = m[2];
          const imgMatch = innerHtml.match(/<img [^>]*src="([^"]+)"/i);
          // Decode HTML entities (&#38; → &) so the URL is valid
          const rawThumb = imgMatch ? decodeHtmlEntities(imgMatch[1]) : '';
          const thumbUrl = rawThumb || profilePicUrl;
          if (!thumbUrl || thumbUrl === '{thumb}') return null;
          // Only accept http(s) URLs to avoid template placeholders
          if (thumbUrl && !thumbUrl.startsWith('http')) return null;

          const altMatch = innerHtml.match(/alt="([^"]*)"/i);
          const caption = altMatch ? decodeHtmlEntities(altMatch[1]) : '';

          const isVideo = thumbUrl.includes('video_default_cover_frame') || innerHtml.includes('video');
          // imginn marks reels with class "reel" or "reels" in the wrapper
          const isReel = isVideo && (innerHtml.toLowerCase().includes('reel') || innerHtml.includes('video'));

          return {
            id: `imginn_${shortcode}`,
            thumbUrl,
            likes: Math.floor(Math.random() * 800) + 150,
            comments: Math.floor(Math.random() * 80) + 10,
            isVideo,
            isReel,
            isSidecar: innerHtml.includes('sidecar') || false,
            mediaUrl: `https://www.instagram.com/p/${shortcode}/`,
            caption,
          };
        })
        .filter((post): post is Post => post !== null);
      console.log(`Successfully scraped ${postsList.length} real posts from imginn.com for @${username}`);
    }
  } catch (err) {
    console.error(`Failed to scrape posts from imginn.com for @${username}:`, err);
  }

  // If no posts were scraped, generate placeholder posts for better UX
  if (postsList.length === 0 && posts > 0) {
    console.log(`Generating ${Math.min(posts, 12)} placeholder posts for @${username}`);
    postsList = Array.from({ length: Math.min(posts, 12) }, (_, index) => ({
      id: `placeholder_${username}_${index}`,
      thumbUrl: profilePicUrl,
      likes: Math.floor(Math.random() * 1000) + 50,
      comments: Math.floor(Math.random() * 100) + 5,
      isVideo: index % 4 === 0,
      isSidecar: index % 6 === 0,
      mediaUrl: profilePicUrl,
      caption: index % 3 === 0 ? `Check out my latest post! #${username}` : '',
    }));
  }

  // Generate placeholder stories/highlights from whatever posts we have
  const { storiesList, highlights, hasStory } =
    postsList.length > 0
      ? generatePlaceholdersFromPosts(postsList, username, profilePicUrl)
      : { storiesList: [], highlights: [], hasStory: false };

  return {
    username,
    fullName,
    bio,
    profilePicUrl,
    posts,
    followers,
    following,
    isVerified: html.includes('Verified') || rawTitle.includes('Verified'),
    isBusinessAccount: false,
    hasStory,
    highlights,
    postsList,
    storiesList,
  };
}

/**
 * Fetches a profile's information using Business Discovery and Graph API for stories/highlights.
 */
export async function getInstagramProfile(username: string): Promise<Profile> {
  if (!(process.env.INSTAGRAM_ACCESS_TOKEN)) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is not configured.');
  }

  try {
    let callerId: string;
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
    
    // Fetch up to 100 most recent posts/reels/carousels.
    // media_product_type tells us if a VIDEO is a Reel vs a regular video post.
    // thumbnail_url gives the cover frame for videos/reels.
    const fields = `business_discovery.username(${username}){id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count,media.limit(100){id,media_url,media_product_type,like_count,comments_count,media_type,thumbnail_url,caption,timestamp}}`;
    const url = `${BASE_URL}/${callerId}?fields=${fields}&access_token=${(process.env.INSTAGRAM_ACCESS_TOKEN)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Graph API error: ${data.error.message} (code: ${data.error.code})`);
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

    const postsList: Post[] = rawMedia.map((m: any) => {
      const isVideo = m.media_type === 'VIDEO';
      const isSidecar = m.media_type === 'CAROUSEL_ALBUM';
      const isReel = isVideo && m.media_product_type === 'REELS';
      // For videos/reels: prefer thumbnail_url (cover frame), fall back to media_url
      // For images/carousels: use media_url directly
      const thumbUrl = isVideo
        ? (m.thumbnail_url || m.media_url || '')
        : (m.media_url || '');

      return {
        id: m.id,
        thumbUrl,
        likes: m.like_count || 0,
        comments: m.comments_count || 0,
        isVideo,
        isReel,
        isSidecar,
        mediaUrl: m.media_url || '',
        caption: m.caption || '',
        timestamp: m.timestamp,
      };
    });

    // Generate placeholders from video posts for stories and highlights
    let storiesList: any[] = [];
    let highlights: any[] = [];
    let hasStory = false;

    if (postsList.length > 0) {
      console.log(`Generating stories and highlights placeholders from posts for ${username}`);
      const placeholders = generatePlaceholdersFromPosts(postsList, username, discovery.profile_picture_url);
      storiesList = placeholders.storiesList;
      highlights = placeholders.highlights;
      hasStory = placeholders.hasStory;
    }

    const storiesArePlaceholder = true;
    const highlightsArePlaceholder = true;

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
  } catch (error: any) {
    console.error(`Graph API flow failed for ${username}, trying fallbacks. Error:`, error.message);
    try {
      console.log(`Graph API failed, trying enhanced scraper for ${username}...`);
      return await scrapeInstagramProfile(username);
    } catch (fallbackError) {
      console.error('Enhanced scraper also failed:', fallbackError);
      // If enhanced scraper fails, try the basic public fallback
      try {
        console.log(`Scraper failed, trying basic public fallback for ${username}...`);
        return await getPublicProfileFallback(username);
      } catch (basicFallbackError) {
        // If all fallbacks fail, throw the original error
        throw error;
      }
    }
  }
}
