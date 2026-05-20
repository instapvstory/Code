import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service_role key
// This bypasses RLS and should only be used in API routes / server components



let _supabaseAdmin: any; export const supabaseAdmin = new Proxy({}, { get(target, prop) { if (!_supabaseAdmin) { _supabaseAdmin = createClient(process.env.SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'); } return _supabaseAdmin[prop]; } }) as any;
