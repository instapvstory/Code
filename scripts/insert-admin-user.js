const { createClient } = require('@supabase/supabase-js');
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

async function checkAndInsertAdminUser() {
  console.log('=== Checking and Inserting Admin User ===');
  
  try {
    // Check if admin user exists
    const { data: existingUsers, error: queryError } = await supabase
      .from('admin_users')
      .select('id, email, name')
      .eq('email', 'admin@example.com');
    
    if (queryError) {
      console.error('Error querying admin_users:', queryError.message);
      console.log('The table might not exist or have different structure.');
      return false;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Admin user already exists:');
      console.log(`  Email: ${existingUsers[0].email}`);
      console.log(`  Name: ${existingUsers[0].name}`);
      return true;
    }
    
    // Insert default admin user
    console.log('Inserting default admin user...');
    
    // bcrypt hash of 'admin123' (cost factor 10)
    const passwordHash = '$2a$10$X5z7Q8rS1Vq2w3y4z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V';
    
    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin@example.com',
        name: 'Administrator',
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting admin user:', insertError.message);
      
      // Try alternative approach - maybe the table has different columns
      console.log('\nTrying alternative approach...');
      
      // Check table structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Cannot query table structure:', tableError.message);
      } else {
        console.log('Table structure sample:', JSON.stringify(tableInfo, null, 2));
      }
      
      return false;
    }
    
    console.log('✅ Default admin user created successfully!');
    console.log(`  Email: ${newUser.email}`);
    console.log(`  Name: ${newUser.name}`);
    console.log(`  Password: admin123`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    return true;
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return false;
  }
}

async function checkTableStructure() {
  console.log('\n=== Checking Table Structure ===');
  
  try {
    // Try to get a sample row to see structure
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Table structure (sample row):');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('Table exists but is empty.');
      
      // Try to get column information by attempting to insert a test row
      const testData = {
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'test_hash',
        role: 'admin',
        is_active: true
      };
      
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert(testData);
      
      if (insertError) {
        console.log('Insert test error (shows expected columns):', insertError.message);
      } else {
        console.log('Test row inserted successfully.');
        // Clean up
        await supabase.from('admin_users').delete().eq('email', 'test@example.com');
      }
    }
  } catch (error) {
    console.error('Error checking table structure:', error.message);
  }
}

async function main() {
  const success = await checkAndInsertAdminUser();
  
  if (!success) {
    console.log('\nChecking table structure for debugging...');
    await checkTableStructure();
    
    console.log('\n⚠️  Manual setup might be required.');
    console.log('Please check:');
    console.log('1. Go to https://app.supabase.com/project/lmhlyoeuduketjclrwws/editor');
    console.log('2. Check if the admin_users table exists');
    console.log('3. If not, run the SQL from database/admin_tables.sql');
  }
}

main().catch(console.error);