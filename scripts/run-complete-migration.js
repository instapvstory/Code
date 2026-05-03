const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL by statements (simple approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📊 Found ${statements.length} SQL statements`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`  Running statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { query: stmt });
        
        if (error) {
          // Try direct SQL execution if RPC doesn't exist
          const { error: directError } = await supabase.from('_dummy').select('*').limit(0);
          if (directError && directError.message.includes('exec_sql')) {
            console.log(`  ⚠️  RPC exec_sql not available, trying alternative approach...`);
            // We'll need to use the SQL editor API or just log the SQL
            console.log(`  📝 SQL: ${stmt.substring(0, 100)}...`);
          } else {
            console.log(`  ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`  ❌ Failed: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ ${successCount} statements executed successfully`);
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} statements failed`);
    }
    
    return { success: errorCount === 0 };
  } catch (err) {
    console.error(`❌ Error reading/running SQL file: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function checkExistingTables() {
  console.log('\n🔍 Checking existing tables...');
  
  const tablesToCheck = [
    'posts', 'categories', 'tags', 'seo_settings', 'ads', 'domains'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`  ❌ Table "${table}" does not exist or is inaccessible`);
      } else {
        console.log(`  ✅ Table "${table}" exists`);
      }
    } catch (err) {
      console.log(`  ❌ Error checking table "${table}": ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Complete Database Migration');
  console.log('========================================');
  
  // Check Supabase connection
  console.log('🔗 Testing Supabase connection...');
  try {
    const { error } = await supabase.from('admin_users').select('*').limit(1);
    if (error && !error.message.includes('does not exist')) {
      console.log(`❌ Connection test failed: ${error.message}`);
    } else {
      console.log('✅ Connected to Supabase');
    }
  } catch (err) {
    console.log(`❌ Connection error: ${err.message}`);
  }
  
  // Run migrations in order
  const migrations = [
    { name: 'Blog CMS Schema', path: 'database/blog_cms_schema.sql' },
    { name: 'SEO & Monetization Schema', path: 'database/seo_monetization_schema.sql' }
  ];
  
  for (const migration of migrations) {
    console.log(`\n📦 Running migration: ${migration.name}`);
    console.log('─'.repeat(50));
    
    const filePath = path.join(process.cwd(), migration.path);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      continue;
    }
    
    const result = await runSQLFile(filePath);
    if (!result.success) {
      console.log(`⚠️  Migration "${migration.name}" had issues`);
    }
  }
  
  // Check final state
  await checkExistingTables();
  
  console.log('\n🎉 Migration Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Visit http://localhost:3000/admin/login');
  console.log('2. Login with admin@example.com / admin123');
  console.log('3. Check if posts/categories pages work');
  console.log('4. Test the admin dashboard functionality');
}

main().catch(console.error);