import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/cms';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const result = await adminLogin(email, password);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: result.user });

    // Set httpOnly cookie with the session token
    response.cookies.set('admin_session', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}