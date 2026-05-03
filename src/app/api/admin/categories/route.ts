import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/cms';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await getCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (body.action === 'delete') {
    const ok = await deleteCategory(body.id);
    return NextResponse.json({ success: ok });
  }
  if (body.action === 'update') {
    const ok = await updateCategory(body.id, body.data);
    return NextResponse.json({ success: ok });
  }

  const result = await createCategory(body);
  return NextResponse.json(result);
}
