import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/cms';
import { supabase } from '@/lib/supabase';

// GET - Fetch all ads
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Build query with filters
    let query = supabase
      .from('ads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Fetch ads with pagination
    const { data: ads, error: adsError, count } = await query;

    if (adsError) {
      console.error('Error fetching ads:', adsError);
      return NextResponse.json(
        { success: false, error: 'Database error', message: adsError.message },
        { status: 500 }
      );
    }

    // Fetch ad stats
    const { data: stats, error: statsError } = await supabase
      .from('ad_stats')
      .select('*')
      .in('ad_id', ads.map(ad => ad.id));

    // Combine ads with their stats
    const adsWithStats = ads.map(ad => {
      const adStats = stats?.filter(stat => stat.ad_id === ad.id) || [];
      const totalClicks = adStats.reduce((sum, stat) => sum + (stat.clicks || 0), 0);
      const totalImpressions = adStats.reduce((sum, stat) => sum + (stat.impressions || 0), 0);
      
      // Map database fields to frontend fields
      return {
        id: ad.id,
        name: ad.name,
        ad_type: ad.type, // Map type -> ad_type
        position: ad.placement, // Map placement -> position
        content: ad.code, // Map code -> content
        is_active: ad.status === 'active', // Map status -> is_active
        start_date: ad.start_date,
        end_date: ad.end_date,
        target_url: null, // Not in new schema
        image_url: null, // Not in new schema
        dimensions: null, // Not in new schema
        created_at: ad.created_at,
        stats: {
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00',
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: adsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error) {
    console.error('Unexpected error in ads API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST - Create new ad
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      placement,
      code,
      status,
      start_date,
      end_date,
      target_devices,
      target_categories,
      target_tags,
      priority,
      max_impressions,
      max_clicks
    } = body;

    // Validate required fields
    if (!name || !type || !placement || !code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create ad
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        name,
        type,
        placement,
        code,
        status: status || 'active',
        target_devices: target_devices || 'all',
        target_categories: target_categories || [],
        target_tags: target_tags || [],
        priority: priority || 1,
        start_date: start_date || null,
        end_date: end_date || null,
        max_impressions: max_impressions || null,
        max_clicks: max_clicks || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ad:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('ad_stats').insert({
      ad_id: ad.id,
      date: new Date().toISOString().split('T')[0],
      clicks: 0,
      impressions: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Ad created successfully',
      data: ad
    });
  } catch (error) {
    console.error('Unexpected error in ad creation API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete ads
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });
    }

    // Delete ad stats first
    await supabase.from('ad_stats').delete().in('ad_id', ids);

    // Delete ads
    const { error } = await supabase.from('ads').delete().in('id', ids);

    if (error) {
      console.error('Error bulk deleting ads:', error);
      return NextResponse.json({ success: false, error: 'Database error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `${ids.length} ads deleted successfully` });
  } catch (error) {
    console.error('Unexpected error in bulk ad deletion API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Bulk update ads (status)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ads')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      console.error('Error bulk updating ads:', error);
      return NextResponse.json({ success: false, error: 'Database error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `${ids.length} ads updated successfully` });
  } catch (error) {
    console.error('Unexpected error in bulk ad update API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}