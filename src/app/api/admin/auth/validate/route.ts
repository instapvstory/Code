import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/cms';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}