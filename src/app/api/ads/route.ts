import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Define ad type interface
interface Ad {
  id: string;
  name: string;
  type: 'adsense' | 'custom' | 'html' | 'script';
  placement: string;
  code: string;
  status: 'active' | 'inactive' | 'testing';
  target_devices: string;
  target_categories: string[];
  target_tags: string[];
  priority: number;
  start_date: string | null;
  end_date: string | null;
  max_impressions: number | null;
  max_clicks: number | null;
  created_at: string;
  updated_at: string;
}

// GET - Fetch ads for public display with filtering
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get('placement');
    const device = searchParams.get('device') || 'all';
    const status = searchParams.get('status') || 'active';
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const limit = parseInt(searchParams.get('limit') || '1');
    
    // Build query
    let query = supabase
      .from('ads')
      .select('*')
      .eq('status', status)
      .lte('priority', 10)
      .order('priority', { ascending: false })
      .limit(limit);

    // Filter by placement
    if (placement) {
      query = query.eq('placement', placement);
    }

    // Filter by device targeting
    if (device !== 'all') {
      query = query.or(`target_devices.eq.all,target_devices.eq.${device}`);
    }

    // Filter by category (if category ID provided)
    if (category) {
      query = query.or(`target_categories.cs.{${category}},target_categories.is.null`);
    }

    // Filter by tags (if tag IDs provided)
    if (tags) {
      const tagArray = tags.split(',');
      const tagConditions = tagArray.map(tag => `target_tags.cs.{${tag}}`).join(',');
      query = query.or(`${tagConditions},target_tags.is.null`);
    }

    // Filter by date range (if applicable)
    const now = new Date().toISOString();
    query = query.or(`start_date.is.null,start_date.lte.${now}`);
    query = query.or(`end_date.is.null,end_date.gte.${now}`);

    // Execute query
    const { data: ads, error } = await query;

    if (error) {
      console.error('Error fetching ads:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Filter out ads that have reached their limits
    const filteredAds = (ads as Ad[]).filter(ad => {
      // Check max impressions
      if (ad.max_impressions) {
        // In a real implementation, you would check actual impression count from ad_stats
        // For now, we'll assume they haven't reached the limit
        return true;
      }
      
      // Check max clicks
      if (ad.max_clicks) {
        // In a real implementation, you would check actual click count from ad_stats
        return true;
      }
      
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filteredAds,
      count: filteredAds.length
    });

  } catch (error) {
    console.error('Unexpected error in ads API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Track ad view (for analytics)
export async function POST(request: NextRequest) {
  try {
    // Get ad ID from request body
    const body = await request.json().catch(() => ({}));
    const { adId } = body;

    if (!adId) {
      return NextResponse.json(
        { success: false, error: 'Missing adId' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if stats already exist for today
    const { data: existingStats } = await supabase
      .from('ad_stats')
      .select('*')
      .eq('ad_id', adId)
      .eq('date', today)
      .single();

    if (existingStats) {
      // Update existing stats
      const { error } = await supabase
        .from('ad_stats')
        .update({
          views: (existingStats.views || 0) + 1,
          impressions: (existingStats.impressions || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);

      if (error) {
        console.error('Error updating ad stats:', error);
      }
    } else {
      // Create new stats entry
      const { error } = await supabase
        .from('ad_stats')
        .insert({
          ad_id: adId,
          date: today,
          views: 1,
          impressions: 1,
          clicks: 0,
          revenue: 0
        });

      if (error) {
        console.error('Error creating ad stats:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ad view tracked'
    });

  } catch (error) {
    console.error('Error tracking ad view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track ad view' },
      { status: 500 }
    );
  }
}