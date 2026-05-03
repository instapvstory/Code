import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTags, createTag, deleteTag } from '@/lib/cms';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tags = await getTags();
  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.action === 'delete') {
    const ok = await deleteTag(body.id);
    return NextResponse.json({ success: ok });
  }

  const result = await createTag(body.name);
  return NextResponse.json(result);
}
