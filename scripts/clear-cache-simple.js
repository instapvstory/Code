const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearProfileCache(username) {
  console.log(`Clearing cache for ${username}...`);
  
  try {
    // Update last_fetched to a very old date to mark as stale
    const { error } = await supabase
      .from('profiles')
      .update({ last_fetched: '2000-01-01T00:00:00Z' })
      .eq('username', username.toLowerCase());
    
    if (error) {
      console.error('Error updating profile:', error);
    } else {
      console.log(`✅ Database cache marked as stale for ${username}`);
    }
    
    // Also delete from media table if exists
    const { error: mediaError } = await supabase
      .from('media')
      .delete()
      .eq('profile_id', `ig_${username.toLowerCase()}`);
    
    if (mediaError && !mediaError.message.includes('does not exist')) {
      console.error('Error deleting media:', mediaError);
    } else {
      console.log(`✅ Media cache cleared for ${username}`);
    }
    
    console.log(`🎯 Cache cleared for ${username}. Next request will fetch fresh data.`);
    
  } catch (error) {
    console.error(`❌ Error clearing cache for ${username}:`, error);
  }
}

// Get username from command line argument
const username = process.argv[2];
if (!username) {
  console.error('Usage: node scripts/clear-cache-simple.js <username>');
  console.error('Example: node scripts/clear-cache-simple.js neeshatjahanoishee');
  process.exit(1);
}

clearProfileCache(username);