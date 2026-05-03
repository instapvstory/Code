// Simple script to clear all profiles cache using direct Supabase SQL
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllProfilesCache() {
  console.log('🚀 Clearing all profiles cache...\n');
  
  try {
    // 1. Mark all profiles as stale by setting last_fetched to very old date
    console.log('1. Marking all profiles cache as stale...');
    const { error: profilesError, count: profilesCount } = await supabase
      .from('profiles')
      .update({ last_fetched: '2000-01-01T00:00:00Z' });
    
    if (profilesError) {
      console.error('   ❌ Error updating profiles:', profilesError.message);
    } else {
      console.log(`   ✅ Marked all profiles cache entries as stale`);
    }
    
    // 2. Delete all media cache entries
    console.log('\n2. Clearing media cache...');
    const { error: mediaError, count: mediaCount } = await supabase
      .from('media')
      .delete()
      .neq('id', '0');
    
    if (mediaError) {
      console.error('   ❌ Error clearing media cache:', mediaError.message);
    } else {
      console.log(`   ✅ Cleared ${mediaCount || 0} media cache entries`);
    }
    
    // 3. Delete all stories cache entries
    console.log('\n3. Clearing stories cache...');
    const { error: storiesError, count: storiesCount } = await supabase
      .from('stories')
      .delete()
      .neq('id', '0');
    
    if (storiesError) {
      console.error('   ❌ Error clearing stories cache:', storiesError.message);
    } else {
      console.log(`   ✅ Cleared ${storiesCount || 0} stories cache entries`);
    }
    
    // 4. Delete all highlights cache entries
    console.log('\n4. Clearing highlights cache...');
    const { error: highlightsError, count: highlightsCount } = await supabase
      .from('highlights')
      .delete()
      .neq('id', '0');
    
    if (highlightsError) {
      console.error('   ❌ Error clearing highlights cache:', highlightsError.message);
    } else {
      console.log(`   ✅ Cleared ${highlightsCount || 0} highlights cache entries`);
    }
    
    // 5. Clear API cache table if it exists
    console.log('\n5. Clearing API cache...');
    const { error: apiCacheError, count: apiCacheCount } = await supabase
      .from('api_cache')
      .delete()
      .neq('id', '0');
    
    if (apiCacheError) {
      console.log('   ℹ️  API cache table may not exist or already empty');
    } else {
      console.log(`   ✅ Cleared ${apiCacheCount || 0} API cache entries`);
    }
    
    console.log('\n🎉 All cache cleared successfully!');
    console.log('\nNext steps:');
    console.log('1. The next time a profile is requested, it will be freshly fetched from Instagram');
    console.log('2. Memory cache will be cleared when the server restarts');
    console.log('3. You can test by visiting: http://localhost:3000/api/profiles/neeshatjahanoishee?nocache=true');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Run the function
clearAllProfilesCache();