import { NextRequest, NextResponse } from 'next/server';

/**
 * Meta/Facebook Security Endpoint
 * 
 * 1. GET  — Facebook webhook verification (hub.challenge handshake)
 * 2. POST — Receives deauthorization / data-deletion callbacks from Meta
 *           so we can be notified BEFORE the token is invalidated.
 * 
 * Configure this URL in your Facebook App dashboard under:
 *   Webhooks -> Add Callback URL -> https://pvstoryviewer.com/api/meta-security
 *   Verify Token: (set FACEBOOK_WEBHOOK_VERIFY_TOKEN in env)
 */

// GET - Facebook webhook verification handshake
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'pvstory-webhook-secure-2024';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Security] Webhook verified successfully');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Meta Security] Webhook verification failed - invalid verify token');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST - Handle Meta webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const timestamp = new Date().toISOString();

    const eventType = body?.object || body?.type || 'unknown';
    const entry = body?.entry?.[0];

    console.log('[Meta Security] ' + timestamp + ' - Received webhook event: ' + eventType);

    // Handle data deletion requests (required by Meta platform policy)
    if (body?.type === 'data_deletion' || body?.object === 'user') {
      console.warn('[Meta Security] DATA DELETION REQUEST received from Meta at ' + timestamp);
      return NextResponse.json({
        url: 'https://pvstoryviewer.com/data-deletion-status',
        confirmation_code: 'pvstory-del-' + Date.now(),
      });
    }

    // Handle permission revocation
    if (eventType === 'permissions' || body?.object === 'permissions') {
      console.error('[Meta Security] TOKEN REVOCATION ATTEMPT DETECTED - check your Facebook App settings!');
    }

    return NextResponse.json({ received: true, timestamp });
  } catch (error) {
    console.error('[Meta Security] Failed to process webhook:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
