import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/cms';
import { supabase } from '@/lib/supabase';

// GET - Fetch SEO settings
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
    
    // Fetch SEO settings
    const { data: seoSettings, error: seoError } = await supabase
      .from('seo_settings')
      .select('*')
      .limit(1)
      .single();

    if (seoError && seoError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching SEO settings:', seoError);
      return NextResponse.json(
        { error: 'Database error', message: seoError.message },
        { status: 500 }
      );
    }

    // Fetch integrations
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .limit(1)
      .single();

    if (intError && intError.code !== 'PGRST116') {
      console.error('Error fetching integrations:', intError);
    }

    // Fetch robots settings
    const { data: robotsSettings, error: robotsError } = await supabase
      .from('robots_settings')
      .select('*')
      .limit(1)
      .single();

    if (robotsError && robotsError.code !== 'PGRST116') {
      console.error('Error fetching robots settings:', robotsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        seo: seoSettings || null,
        integrations: integrations || null,
        robots: robotsSettings || null,
      }
    });
  } catch (error) {
    console.error('Unexpected error in SEO settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST/PUT - Update SEO settings
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
    const { seo, integrations, robots } = body;
    
    if (!seo && !integrations && !robots) {
      return NextResponse.json(
        { error: 'Bad request', message: 'No data provided for update' },
        { status: 400 }
      );
    }
    const updates: any[] = [];
    const errors: any[] = [];

    // Update SEO settings
    if (seo) {
      const { error: seoError } = await supabase
        .from('seo_settings')
        .upsert(seo, { onConflict: 'id' });

      if (seoError) {
        errors.push({ table: 'seo_settings', error: seoError.message });
      } else {
        updates.push('seo_settings');
      }
    }

    // Update integrations
    if (integrations) {
      const { error: intError } = await supabase
        .from('integrations')
        .upsert(integrations, { onConflict: 'id' });

      if (intError) {
        errors.push({ table: 'integrations', error: intError.message });
      } else {
        updates.push('integrations');
      }
    }

    // Update robots settings
    if (robots) {
      const { error: robotsError } = await supabase
        .from('robots_settings')
        .upsert(robots, { onConflict: 'id' });

      if (robotsError) {
        errors.push({ table: 'robots_settings', error: robotsError.message });
      } else {
        updates.push('robots_settings');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some updates failed',
        updates,
        errors
      }, { status: 207 }); // 207 Multi-Status
    }

    // Log the update
    await supabase.from('seo_audit_logs').insert({
      user_id: user.id,
      action: 'update',
      entity_type: 'seo_settings',
      old_values: null,
      new_values: { seo, integrations, robots },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'SEO settings updated successfully',
      updates
    });
  } catch (error) {
    console.error('Unexpected error in SEO settings update API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}