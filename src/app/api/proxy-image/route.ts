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
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      // If upstream fails (e.g. status 403), redirect directly to raw URL as fallback
      return NextResponse.redirect(rawUrl, { status: 302 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[proxy-image] fetch failed:', err.message);
    return NextResponse.redirect(rawUrl, { status: 302 });
  }
}
