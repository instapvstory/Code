import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getPosts, createPost, bulkDeletePosts, bulkUpdatePostStatus } from '@/lib/cms';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  const result = await getPosts({ status, search, page, limit });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Bulk operations
  if (body.action === 'bulk_delete') {
    const ok = await bulkDeletePosts(body.ids);
    return NextResponse.json({ success: ok });
  }
  if (body.action === 'bulk_status') {
    const ok = await bulkUpdatePostStatus(body.ids, body.status);
    return NextResponse.json({ success: ok });
  }

  // Create post
  const result = await createPost({ ...body, author_id: user.id });
  return NextResponse.json(result);
}
