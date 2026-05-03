import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSettings, updateSetting } from '@/lib/cms';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { key, value } = await request.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

  const ok = await updateSetting(key, value);
  return NextResponse.json({ success: ok });
}
