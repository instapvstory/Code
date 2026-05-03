// Security monitoring and status API endpoint
// Provides visibility into security events, blocked IPs, and system health

import { NextRequest, NextResponse } from 'next/server';
import { securityService } from '@/lib/security';
import { rateLimiter } from '@/lib/rate-limit';

// Admin API key for authentication (in production, use proper authentication)
const ADMIN_API_KEY = process.env.SECURITY_ADMIN_API_KEY || 'dev-admin-key-123';

// Helper to authenticate admin requests
function authenticateAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  return token === ADMIN_API_KEY;
}

export async function GET(request: NextRequest) {
  // Authenticate admin request
  if (!authenticateAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Get security statistics
    const securityStats = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
      security: {
        // In a real implementation, you would collect these from your security service
        blockedIPsCount: securityService.getBlockedIPs().length,
        // Add more security metrics here
      },
      rateLimiting: {
        // Rate limiting statistics would come from your rate limiter
        activeWindows: 'N/A', // This would require exposing internal state
      },
      recommendations: [
        'Enable Cloudflare Turnstile for bot protection',
        'Implement proper authentication for admin endpoints',
        'Set up security monitoring alerts',
        'Regularly review blocked IPs',
      ],
    };
    
    return NextResponse.json({
      status: 'operational',
      data: securityStats,
      message: 'Security monitoring active',
    });
    
  } catch (error) {
    console.error('Security status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to manage security settings (block/unblock IPs, etc.)
export async function POST(request: NextRequest) {
  // Authenticate admin request
  if (!authenticateAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { action, ip, durationMinutes, reason } = body;
    
    if (!action || !ip) {
      return NextResponse.json(
        { error: 'Missing required parameters: action and ip' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action.toLowerCase()) {
      case 'block':
        securityService.blockIP(ip, durationMinutes || 60);
        result = { message: `IP ${ip} blocked for ${durationMinutes || 60} minutes`, reason };
        break;
        
      case 'unblock':
        securityService.unblockIP(ip);
        result = { message: `IP ${ip} unblocked`, reason };
        break;
        
      case 'status':
        const stats = securityService.getSecurityStats(ip);
        result = { message: `Security status for IP ${ip}`, stats };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: block, unblock, or status' },
          { status: 400 }
        );
    }
    
    // Log the admin action
    console.log(`[SECURITY ADMIN] ${action.toUpperCase()} - IP: ${ip} - Reason: ${reason || 'No reason provided'}`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
    
  } catch (error) {
    console.error('Security admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}