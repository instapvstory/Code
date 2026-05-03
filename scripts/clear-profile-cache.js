const { CacheService } = require('../src/lib/cache');

async function clearProfileCache(username) {
  console.log(`Clearing cache for ${username}...`);
  
  try {
    const cacheService = new CacheService();
    await cacheService.clearProfileCache(username);
    console.log(`✅ Cache cleared for ${username}`);
  } catch (error) {
    console.error(`❌ Error clearing cache for ${username}:`, error);
  }
}

// Get username from command line argument
const username = process.argv[2];
if (!username) {
  console.error('Usage: node scripts/clear-profile-cache.js <username>');
  console.error('Example: node scripts/clear-profile-cache.js neeshatjahanoishee');
  process.exit(1);
}

clearProfileCache(username);