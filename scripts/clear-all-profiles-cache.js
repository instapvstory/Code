const { CacheService } = require('../src/lib/cache');
const { supabase } = require('../src/lib/supabase');

async function clearAllProfilesCache() {
  console.log('Clearing all profiles cache...');
  
  try {
    const cacheService = new CacheService();
    
    // 1. Clear all memory cache
    cacheService.clearMemoryCache();
    console.log('✅ Cleared all memory cache');
    
    // 2. Mark all database cache entries as stale by setting last_fetched to very old date
    const { error, count } = await supabase
      .from('profiles')
      .update({ last_fetched: '2000-01-01T00:00:00Z' });
    
    if (error) {
      console.error('❌ Error clearing database cache:', error);
    } else {
      console.log('✅ Marked all database cache entries as stale');
    }
    
    // 3. Also clear media cache by deleting all media entries
    const { error: mediaError, count: mediaCount } = await supabase
      .from('media')
      .delete()
      .neq('id', '0'); // Delete all media entries
    
    if (mediaError) {
      console.error('❌ Error clearing media cache:', mediaError);
    } else {
      console.log(`✅ Cleared ${mediaCount || 0} media cache entries`);
    }
    
    // 4. Clear stories and highlights cache
    const { error: storiesError } = await supabase
      .from('stories')
      .delete()
      .neq('id', '0');
    
    if (storiesError) {
      console.error('❌ Error clearing stories cache:', storiesError);
    } else {
      console.log('✅ Cleared stories cache');
    }
    
    const { error: highlightsError } = await supabase
      .from('highlights')
      .delete()
      .neq('id', '0');
    
    if (highlightsError) {
      console.error('❌ Error clearing highlights cache:', highlightsError);
    } else {
      console.log('✅ Cleared highlights cache');
    }
    
    console.log('\n🎉 All profiles cache cleared successfully!');
    console.log('Next time a profile is requested, it will be freshly fetched from Instagram.');
    
  } catch (error) {
    console.error('❌ Error clearing all profiles cache:', error);
  }
}

// Run the function
clearAllProfilesCache();