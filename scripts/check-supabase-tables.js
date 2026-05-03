// Script to check what tables exist in Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const supabaseUrl = 'https://lmhlyoeuduketjclrwws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaGx5b2V1ZHVrZXRqY2xyd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDc0NTYsImV4cCI6MjA5MTkyMzQ1Nn0.iVVbBXfXP59YBsTlnA5as54SJALmLrifefFqkywboKg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking Supabase tables...\n');
  
  try {
    // Try to query each table to see if it exists
    const tables = [
      'profiles',
      'media',
      'stories',
      'highlights',
      'api_cache',
      'posts',
      'categories',
      'tags',
      'users',
      'admin_users'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
          .limit(1);
        
        if (error) {
          console.log(`❌ Table "${table}" does not exist or error: ${error.message}`);
        } else {
          console.log(`✅ Table "${table}" exists`);
        }
      } catch (err) {
        console.log(`❌ Table "${table}" error: ${err.message}`);
      }
    }
    
    // Also try to get table list from information_schema
    console.log('\n📊 Getting table count from profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profilesError) {
      console.log(`   Profiles error: ${profilesError.message}`);
    } else {
      console.log(`   Profiles count: ${profiles.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the function
checkTables();