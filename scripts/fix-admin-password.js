const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminPassword() {
  console.log('=== Fixing Admin Password ===');
  
  // Generate correct bcrypt hash for 'admin123'
  const password = 'admin123';
  const saltRounds = 10;
  
  console.log('Generating bcrypt hash for password:', password);
  const correctHash = await bcrypt.hash(password, saltRounds);
  console.log('Correct bcrypt hash:', correctHash);
  
  // Check current hash in database
  console.log('\nChecking current admin user...');
  const { data: adminUser, error: fetchError } = await supabase
    .from('admin_users')
    .select('id, email, password_hash')
    .eq('email', 'admin@example.com')
    .single();
  
  if (fetchError) {
    console.error('Error fetching admin user:', fetchError.message);
    return false;
  }
  
  console.log('Current password hash:', adminUser.password_hash);
  console.log('Hash length:', adminUser.password_hash.length);
  
  // Test if current hash works
  const isValid = await bcrypt.compare(password, adminUser.password_hash);
  console.log('Current hash valid for "admin123":', isValid);
  
  if (!isValid) {
    console.log('\nUpdating to correct bcrypt hash...');
    
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: correctHash })
      .eq('id', adminUser.id);
    
    if (updateError) {
      console.error('Error updating password:', updateError.message);
      return false;
    }
    
    console.log('✅ Password updated successfully!');
    
    // Verify the update
    const { data: updatedUser, error: verifyError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', adminUser.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError.message);
      return false;
    }
    
    const isNowValid = await bcrypt.compare(password, updatedUser.password_hash);
    console.log('New hash valid for "admin123":', isNowValid);
    
    if (isNowValid) {
      console.log('✅ Password fix complete!');
      return true;
    } else {
      console.log('❌ Password still not valid after update');
      return false;
    }
  } else {
    console.log('✅ Current password hash is already valid');
    return true;
  }
}

async function testLogin() {
  console.log('\n=== Testing Login ===');
  
  const password = 'admin123';
  
  // Get the admin user
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('password_hash')
    .eq('email', 'admin@example.com')
    .single();
  
  if (error) {
    console.error('Error fetching admin user:', error.message);
    return false;
  }
  
  const isValid = await bcrypt.compare(password, adminUser.password_hash);
  console.log('Password "admin123" matches hash:', isValid);
  
  if (isValid) {
    console.log('✅ Login should work with: admin@example.com / admin123');
  } else {
    console.log('❌ Login will fail - password hash mismatch');
  }
  
  return isValid;
}

async function main() {
  console.log('Admin Password Fix Script');
  console.log('==========================');
  
  const fixed = await fixAdminPassword();
  
  if (fixed) {
    console.log('\n✅ Password is now correctly set.');
    console.log('\nYou can now login with:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\nTest the login at: http://localhost:3000/admin/login');
  } else {
    console.log('\n❌ Failed to fix password.');
    console.log('\nManual fix required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run this SQL:');
    console.log(`
      UPDATE admin_users 
      SET password_hash = '$2a$10$X5z7Q8rS1Vq2w3y4z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V'
      WHERE email = 'admin@example.com';
    `);
    console.log('   (But this is the wrong hash - need correct bcrypt hash)');
  }
  
  // Test login
  await testLogin();
}

main().catch(console.error);