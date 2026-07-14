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

    // Get all system configurations
    const { data: configs, error } = await supabase
      .from('system_configs')
      .select('*')
      .order('key');

    if (error) {
      console.error('Failed to fetch system configs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system configurations' },
        { status: 500 }
      );
    }

    // Group configurations by category
    const groupedConfigs: Record<string, any[]> = {};
    configs?.forEach((config: any) => {
      const category = config.category || 'general';
      if (!groupedConfigs[category]) {
        groupedConfigs[category] = [];
      }
      groupedConfigs[category].push(config);
    });

    return NextResponse.json({
      success: true,
      configs: configs || [],
      groupedConfigs,
      categories: Object.keys(groupedConfigs)
    });
  } catch (error) {
    console.error('System config API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Check if configuration exists
    const { data: existingConfig } = await supabase
      .from('system_configs')
      .select('*')
      .eq('key', key)
      .single();

    let result;
    if (existingConfig) {
      // Update existing configuration
      result = await supabase
        .from('system_configs')
        .update({
          value,
          description: description || existingConfig.description,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);
    } else {
      // Create new configuration
      result = await supabase
        .from('system_configs')
        .insert({
          key,
          value,
          description: description || '',
          category: 'general',
          created_by: user.id,
          updated_by: user.id
        });
    }

    if (result.error) {
      console.error('Failed to update system config:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update system configuration' },
        { status: 500 }
      );
    }

    // Log the action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: existingConfig ? 'UPDATE_SYSTEM_CONFIG' : 'CREATE_SYSTEM_CONFIG',
      resource_type: 'system_config',
      resource_id: key,
      details: { key, value, previousValue: existingConfig?.value }
    });

    return NextResponse.json({
      success: true,
      message: existingConfig ? 'Configuration updated' : 'Configuration created',
      config: {
        key,
        value,
        description: description || existingConfig?.description || ''
      }
    });
  } catch (error) {
    console.error('Update system config error:', error);
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

    // Only super admins can delete configurations
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Configuration key is required' },
        { status: 400 }
      );
    }

    // Check if configuration exists
    const { data: existingConfig } = await supabase
      .from('system_configs')
      .select('*')
      .eq('key', key)
      .single();

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Delete configuration
    const { error } = await supabase
      .from('system_configs')
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Failed to delete system config:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete system configuration' },
        { status: 500 }
      );
    }

    // Log the action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: 'DELETE_SYSTEM_CONFIG',
      resource_type: 'system_config',
      resource_id: key,
      details: { key, previousValue: existingConfig.value }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete system config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}