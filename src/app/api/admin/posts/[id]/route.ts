import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getPostById, updatePost, deletePost } from '@/lib/cms';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(post);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const result = await updatePost(id, body);
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ok = await deletePost(id);
  return NextResponse.json({ success: ok });
}
