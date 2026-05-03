import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '../../../../../lib/admin-auth';

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

    // Get dashboard stats
    const stats = await adminAuthService.getDashboardStats();
    const recentAuditLogs = await adminAuthService.getRecentAuditLogs(10);
    const recentSecurityLogs = await adminAuthService.getSecurityLogs(10);

    return NextResponse.json({
      success: true,
      stats,
      recentAuditLogs,
      recentSecurityLogs,
      user
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}