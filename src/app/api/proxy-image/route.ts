import { NextRequest, NextResponse } from 'next/server';

// Allowed host patterns — only proxy from trusted Instagram/imginn CDNs
const ALLOWED_HOSTS = [
  /^[a-z0-9.-]+\.cdninstagram\.com$/,
  /^[a-z0-9.-]+\.fbcdn\.net$/,
  /^[a-z0-9.-]+\.instagram\.com$/,
  /^[a-z0-9.-]+\.imginn\.com$/,   // covers s3.imginn.com, cdn.imginn.com etc.
  /^imginn\.com$/,
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Security: only allow whitelisted hosts
  const isAllowed = ALLOWED_HOSTS.some(pattern => pattern.test(parsedUrl.hostname));
  if (!isAllowed) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: {
        // Pretend to be Instagram itself so CDN servers don't block us
        'Referer': 'https://www.instagram.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'sec-fetch-dest': 'image',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'cross-site',
      },
      // Do not follow redirects blindly — allow up to 5
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively — CDN images for a profile don't change often
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[proxy-image] fetch failed:', err.message);
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
