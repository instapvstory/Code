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

    // Parse query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const ip = url.searchParams.get('ip');

    // Build query
    let query = supabase
      .from('security_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (ip) {
      query = query.eq('ip', ip);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Failed to fetch security logs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch security logs' },
        { status: 500 }
      );
    }

    // Get summary statistics (using separate queries)
    const { data: allLogs } = await supabase
      .from('security_logs')
      .select('type, ip')
      .limit(1000); // Limit for performance

    // Calculate summary manually
    const summaryMap = new Map<string, number>();
    const ipMap = new Map<string, number>();
    
    allLogs?.forEach((log: any) => {
      // Count by type
      summaryMap.set(log.type, (summaryMap.get(log.type) || 0) + 1);
      
      // Count by IP
      if (log.ip) {
        ipMap.set(log.ip, (ipMap.get(log.ip) || 0) + 1);
      }
    });

    const summary = Array.from(summaryMap.entries()).map(([type, count]) => ({ type, count }));
    const topIps = Array.from(ipMap.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      summary: summary || [],
      topIps: topIps || []
    });
  } catch (error) {
    console.error('Security logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { authenticated, user } = await authenticate(request);
    
    if (!authenticated || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super admins can delete security logs
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const olderThan = url.searchParams.get('olderThan');

    let query = supabase.from('security_logs').delete();

    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
      query = query.lt('created_at', cutoffDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      console.error('Failed to delete security logs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete security logs' },
        { status: 500 }
      );
    }

    // Log the action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: 'DELETE_SECURITY_LOGS',
      details: { olderThan, deletedCount: count }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${count || 0} security logs`,
      deletedCount: count || 0
    });
  } catch (error) {
    console.error('Delete security logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}