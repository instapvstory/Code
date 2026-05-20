import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasInstagramToken: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    tokenPrefix: process.env.INSTAGRAM_ACCESS_TOKEN ? process.env.INSTAGRAM_ACCESS_TOKEN.substring(0, 5) + '...' : 'null',
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    urlValue: process.env.SUPABASE_URL || 'null',
    hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    allKeys: Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('NODE_'))
  });
}
