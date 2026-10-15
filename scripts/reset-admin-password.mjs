/**
 * One-time admin password reset script.
 * 
 * Usage:
 *   node scripts/reset-admin-password.mjs <email> <newPassword>
 * 
 * Example:
 *   node scripts/reset-admin-password.mjs admin@pvstoryviewer.com MyNewPass123!
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-admin-password.mjs <email> <newPassword>');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('❌  Password must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetPassword() {
  console.log(`\n🔍  Looking up user: ${email}`);

  const { data: user, error: userError } = await supabase
    .from('admin_users')
    .select('id, email, is_active')
    .eq('email', email.toLowerCase())
    .single();

  if (userError || !user) {
    console.error('❌  User not found:', userError?.message ?? 'No matching record');
    process.exit(1);
  }

  if (!user.is_active) {
    console.error('❌  User account is inactive.');
    process.exit(1);
  }

  console.log('🔐  Hashing new password...');
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('admin_users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌  Failed to update password:', updateError.message);
    process.exit(1);
  }

  // Invalidate all sessions
  await supabase.from('admin_sessions').delete().eq('user_id', user.id);

  console.log('✅  Password reset successfully!');
  console.log(`    Email:    ${email}`);
  console.log(`    Password: ${newPassword}`);
  console.log('\n🚀  You can now log in at /admin/login\n');
}

resetPassword().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
