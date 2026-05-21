import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!token || !secret) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });

    const data = await res.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, errors: data['error-codes'] }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
