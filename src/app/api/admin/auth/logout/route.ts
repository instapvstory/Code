import { NextRequest, NextResponse } from 'next/server';
import { adminLogout } from '@/lib/cms';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (token) {
      await adminLogout(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_session');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}