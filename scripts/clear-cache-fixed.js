// Fixed script to clear all profiles cache
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const supabaseUrl = 'https://lmhlyoeuduketjclrwws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaGx5b2V1ZHVrZXRqY2xyd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDc0NTYsImV4cCI6MjA5MTkyMzQ1Nn0.iVVbBXfXP59YBsTlnA5as54SJALmLrifefFqkywboKg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllProfilesCache() {
  console.log('🚀 Clearing all profiles cache...\n');
  
  try {
    // 1. First, get all profile usernames
    console.log('1. Getting all profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('username');
    
    if (profilesError) {
      console.error('   ❌ Error getting profiles:', profilesError.message);
      return;
    }
    
    console.log(`   Found ${profiles.length} profiles to clear`);
    
    // 2. Mark all profiles as stale by setting last_fetched to very old date
    console.log('\n2. Marking all profiles cache as stale...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ last_fetched: '2000-01-01T00:00:00Z' })
      .neq('username', ''); // Update all rows where username is not empty
    
    if (updateError) {
      console.error('   ❌ Error updating profiles:', updateError.message);
    } else {
      console.log(`   ✅ Marked ${profiles.length} profiles cache entries as stale`);
    }
    
    // 3. Delete all media cache entries
    console.log('\n3. Clearing media cache...');
    const { error: mediaError, count: mediaCount } = await supabase
      .from('media')
      .delete()
      .neq('id', '0');
    
    if (mediaError) {
      console.error('   ❌ Error clearing media cache:', mediaError.message);
    } else {
      console.log(`   ✅ Cleared media cache entries`);
    }
    
    // 4. Delete all stories cache entries
    console.log('\n4. Clearing stories cache...');
    const { error: storiesError, count: storiesCount } = await supabase
      .from('stories')
      .delete()
      .neq('id', '0');
    
    if (storiesError) {
      console.error('   ❌ Error clearing stories cache:', storiesError.message);
    } else {
      console.log(`   ✅ Cleared stories cache entries`);
    }
    
    // 5. Delete all highlights cache entries
    console.log('\n5. Clearing highlights cache...');
    const { error: highlightsError, count: highlightsCount } = await supabase
      .from('highlights')
      .delete()
      .neq('id', '0');
    
    if (highlightsError) {
      console.error('   ❌ Error clearing highlights cache:', highlightsError.message);
    } else {
      console.log(`   ✅ Cleared highlights cache entries`);
    }
    
    // 6. Clear API cache table
    console.log('\n6. Clearing API cache...');
    const { error: apiCacheError, count: apiCacheCount } = await supabase
      .from('api_cache')
      .delete()
      .neq('id', '0');
    
    if (apiCacheError) {
      console.log('   ℹ️  API cache table may not exist or already empty');
    } else {
      console.log(`   ✅ Cleared API cache entries`);
    }
    
    console.log('\n🎉 Cache clearing process completed!');
    console.log('\nNext steps:');
    console.log('1. The next time a profile is requested, it will be freshly fetched from Instagram');
    console.log('2. Memory cache will be cleared when the server restarts');
    console.log('3. You can test by visiting: http://localhost:3000/api/profiles/neeshatjahanoishee');
    
    // Show current cache status
    console.log('\n📊 Current cache status:');
    console.log(`   - Profiles marked as stale: ${profiles.length}`);
    console.log('   - Media, stories, highlights, and API cache cleared');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Run the function
clearAllProfilesCache();