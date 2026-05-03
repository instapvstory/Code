import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of reserved paths that should NOT be treated as usernames
const RESERVED_PATHS = [
  'admin',
  'login',
  'dashboard',
  'posts',
  'categories',
  'tags',
  'media',
  'users',
  'settings',
  'api',
  'blog',
  'about',
  'contact',
  'disclaimer',
  'features',
  'privacy',
  'terms',
  'favicon.ico',
  '_next',
  'public',
  'static',
  'robots.txt',
  'sitemap.xml'
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract the first segment of the path
  const firstSegment = pathname.split('/')[1];
  
  // If the first segment is a reserved path, let it continue normally
  if (RESERVED_PATHS.includes(firstSegment)) {
    return NextResponse.next();
  }

  // For all other paths, they will be handled by the [username] route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};