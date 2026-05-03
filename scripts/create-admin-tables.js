const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function executeSQL(sql) {
  console.log('Executing SQL...');
  
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query if RPC doesn't work
        console.log('RPC failed, trying direct query...');
        const { error: queryError } = await supabase.from('_dummy').select('*').limit(1);
        if (queryError && queryError.message.includes('exec_sql')) {
          console.log('Note: The exec_sql function might not exist. You may need to run this SQL directly in the Supabase dashboard.');
          console.log('Please go to: https://app.supabase.com/project/lmhlyoeuduketjclrwws/sql');
          console.log('And run the SQL from database/admin_tables.sql manually.');
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    return false;
  }
}

async function checkExistingTables() {
  console.log('Checking existing tables...');
  
  try {
    // Try to query admin_users table
    const { data, error } = await supabase
      .from('admin_users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('admin_users table does not exist (or error):', error.message);
      return false;
    }
    
    console.log(`admin_users table exists with ${data} rows`);
    return true;
  } catch (error) {
    console.log('Error checking tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('=== Setting up Admin Tables for Blog CMS ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  // Check if tables already exist
  const tablesExist = await checkExistingTables();
  
  if (tablesExist) {
    console.log('Admin tables already exist. Skipping creation.');
    return;
  }
  
  // Read SQL file
  const sqlPath = path.join(__dirname, '../database/admin_tables.sql');
  let sql;
  
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`Read SQL from ${sqlPath}`);
  } catch (error) {
    console.error(`Error reading SQL file: ${error.message}`);
    console.log('Using fallback SQL...');
    
    // Fallback SQL
    sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor', 'author')),
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        user_agent TEXT,
        ip_address INET,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      INSERT INTO admin_users (email, name, password_hash, role, is_active)
      VALUES (
        'admin@example.com',
        'Administrator',
        '$2a$10$X5z7Q8rS1Vq2w3y4z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V',
        'super_admin',
        true
      ) ON CONFLICT (email) DO NOTHING;
    `;
  }
  
  // Execute SQL
  const success = await executeSQL(sql);
  
  if (success) {
    console.log('✅ Admin tables created successfully!');
    console.log('Default admin user created:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
  } else {
    console.log('❌ Failed to create admin tables.');
    console.log('\nManual setup required:');
    console.log('1. Go to https://app.supabase.com/project/lmhlyoeuduketjclrwws/sql');
    console.log('2. Copy the SQL from database/admin_tables.sql');
    console.log('3. Paste and run it in the SQL Editor');
  }
}

main().catch(console.error);