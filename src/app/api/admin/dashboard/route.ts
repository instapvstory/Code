import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getDashboardStats, getRecentPosts } from '@/lib/cms';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [stats, recentPosts] = await Promise.all([
    getDashboardStats(),
    getRecentPosts(5),
  ]);

  return NextResponse.json({ stats, recentPosts });
}
