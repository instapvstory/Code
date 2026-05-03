import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service_role key
// This bypasses RLS and should only be used in API routes / server components
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
