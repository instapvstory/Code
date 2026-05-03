import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cacheService } from '@/lib/cache';

export async function GET() {
  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        api: true,
        database: false,
        cache: false,
      },
      uptime: process.uptime(),
    };

    // Check Supabase database connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      healthChecks.services.database = !error;
      if (error) {
        console.error('Database health check failed:', error);
      }
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check cache service
    try {
      const cacheStats = await cacheService.getStats();
      // Cache is considered healthy if we can get stats
      healthChecks.services.cache = true;
    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    // Determine overall status
    const allHealthy = Object.values(healthChecks.services).every(Boolean);
    healthChecks.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(healthChecks, {
      status: allHealthy ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}