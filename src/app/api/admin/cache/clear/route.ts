import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '../../../../../lib/admin-auth';
import { supabase } from '../../../../../lib/supabase';

// Middleware to check authentication
async function authenticate(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value;
  
  if (!sessionToken) {
    return { authenticated: false, user: null };
  }

  const user = await adminAuthService.validateSession(sessionToken);
  return { authenticated: !!user, user };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { authenticated, user } = await authenticate(request);
    
    if (!authenticated || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cacheType } = body;

    let clearedCount = 0;
    let message = '';

    switch (cacheType) {
      case 'all':
        // Clear all cache tables
        const { count: apiCacheCount } = await supabase
          .from('api_cache')
          .delete()
          .neq('key', 'dummy'); // Delete all rows
        
        // Note: In a real implementation, you'd also clear memory cache
        clearedCount = apiCacheCount || 0;
        message = `Cleared ${clearedCount} cache entries from database`;
        break;

      case 'expired':
        // Clear only expired cache entries
        const now = new Date().toISOString();
        const { count: expiredCount } = await supabase
          .from('api_cache')
          .delete()
          .lt('expires_at', now);
        
        clearedCount = expiredCount || 0;
        message = `Cleared ${clearedCount} expired cache entries`;
        break;

      case 'profiles':
        // Clear profile-related cache
        const { count: profileCount } = await supabase
          .from('api_cache')
          .delete()
          .like('key', 'profile:%');
        
        clearedCount = profileCount || 0;
        message = `Cleared ${clearedCount} profile cache entries`;
        break;

      case 'media':
        // Clear media-related cache
        const { count: mediaCount } = await supabase
          .from('api_cache')
          .delete()
          .like('key', 'media:%');
        
        clearedCount = mediaCount || 0;
        message = `Cleared ${clearedCount} media cache entries`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid cache type' },
          { status: 400 }
        );
    }

    // Log the cache clearance action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: 'CLEAR_CACHE',
      resource_type: 'cache',
      details: { cacheType, clearedCount, message }
    });

    return NextResponse.json({
      success: true,
      message,
      clearedCount
    });
  } catch (error) {
    console.error('Cache clearance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { authenticated, user } = await authenticate(request);
    
    if (!authenticated || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cache statistics
    const now = new Date().toISOString();
    
    // Total cache entries
    const { count: totalCount } = await supabase
      .from('api_cache')
      .select('*', { count: 'exact', head: true });

    // Expired cache entries
    const { count: expiredCount } = await supabase
      .from('api_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now);

    // Profile cache entries
    const { count: profileCount } = await supabase
      .from('api_cache')
      .select('*', { count: 'exact', head: true })
      .like('key', 'profile:%');

    // Media cache entries
    const { count: mediaCount } = await supabase
      .from('api_cache')
      .select('*', { count: 'exact', head: true })
      .like('key', 'media:%');

    // Get oldest and newest cache entries
    const { data: oldestEntry } = await supabase
      .from('api_cache')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1);

    const { data: newestEntry } = await supabase
      .from('api_cache')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCount || 0,
        expired: expiredCount || 0,
        profiles: profileCount || 0,
        media: mediaCount || 0,
        oldest: oldestEntry?.[0]?.created_at || null,
        newest: newestEntry?.[0]?.created_at || null
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}