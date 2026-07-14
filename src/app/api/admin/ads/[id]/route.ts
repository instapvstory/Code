import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/cms';
import { supabase } from '@/lib/supabase';

// GET - Fetch single ad
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Await params in Next.js 15
    const { id } = await params;

    const { data: ad, error } = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching ad:', error);
      return NextResponse.json(
        { success: false, error: 'Ad not found', message: error.message },
        { status: 404 }
      );
    }

    // Fetch ad stats
    const { data: stats, error: statsError } = await supabase
      .from('ad_stats')
      .select('*')
      .eq('ad_id', id);

    const totalClicks = stats?.reduce((sum: number, stat: any) => sum + (stat.clicks || 0), 0) || 0;
    const totalImpressions = stats?.reduce((sum: number, stat: any) => sum + (stat.impressions || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        ...ad,
        stats: {
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00',
        }
      }
    });
  } catch (error) {
    console.error('Unexpected error in ad API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH - Update ad
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Await params in Next.js 15
    const { id } = await params;

    const body = await request.json();
    const {
      name,
      ad_type,
      type,
      position,
      placement,
      content,
      code,
      is_active,
      status,
      start_date,
      end_date,
      target_url,
      image_url,
      dimensions
    } = body;

    // Check if ad exists
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching ad:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Ad not found', message: fetchError.message },
        { status: 404 }
      );
    }

    // Map frontend fields to database fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    
    // Support both ad_type (old/frontend mapping) and type (direct/consistent)
    if (type !== undefined) updateData.type = type;
    else if (ad_type !== undefined) updateData.type = ad_type;
    
    // Support both position (old/frontend mapping) and placement (direct/consistent)
    if (placement !== undefined) updateData.placement = placement;
    else if (position !== undefined) updateData.placement = position;
    
    // Support both content (old/frontend mapping) and code (direct/consistent)
    if (code !== undefined) updateData.code = code;
    else if (content !== undefined) updateData.code = content;

    if (status !== undefined) updateData.status = status;
    else if (is_active !== undefined) updateData.status = is_active ? 'active' : 'inactive'; // Map is_active -> status
    
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    // target_url, image_url, dimensions are not in new schema, ignore them

    // Update ad
    const { data: ad, error } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ad:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Map database fields to frontend fields for response
    const mappedAd = {
      id: ad.id,
      name: ad.name,
      ad_type: ad.type,
      position: ad.placement,
      content: ad.code,
      is_active: ad.status === 'active',
      start_date: ad.start_date,
      end_date: ad.end_date,
      target_url: null,
      image_url: null,
      dimensions: null,
      created_at: ad.created_at,
    };

    return NextResponse.json({
      success: true,
      message: 'Ad updated successfully',
      data: mappedAd
    });
  } catch (error) {
    console.error('Unexpected error in ad update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Delete ad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Await params in Next.js 15
    const { id } = await params;

    // Delete ad stats first (foreign key constraint)
    const { error: statsError } = await supabase
      .from('ad_stats')
      .delete()
      .eq('ad_id', id);

    if (statsError) {
      console.error('Error deleting ad stats:', statsError);
      // Continue with ad deletion anyway
    }

    // Delete ad
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ad:', error);
      return NextResponse.json(
        { success: false, error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in ad deletion API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}