import { NextRequest, NextResponse } from 'next/server';
import { adminAuthService } from '../../../../lib/admin-auth';
import { supabase } from '../../../../lib/supabase';
import bcrypt from 'bcryptjs';

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

    // Only super admins can view all users
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all admin users
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, is_active, last_login_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch admin users:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    // Only super admins can create users
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name || null,
        role,
        is_active: true
      })
      .select('id, email, name, role, is_active, created_at')
      .single();

    if (error) {
      console.error('Failed to create admin user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Log the action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: 'CREATE_ADMIN_USER',
      resource_type: 'admin_user',
      resource_id: newUser.id,
      details: { email, name, role }
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create admin user error:', error);
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

    // Only super admins can update users
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, email, name, role, is_active, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    // If password is provided, hash it
    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, role, is_active, last_login_at, created_at')
      .single();

    if (error) {
      console.error('Failed to update admin user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log the action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: 'UPDATE_ADMIN_USER',
      resource_type: 'admin_user',
      resource_id: id,
      details: { ...updateData, password_updated: !!password }
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update admin user error:', error);
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

    // Only super admins can delete users
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete admin user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Also delete user's sessions
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('user_id', id);

    // Log the action
    await adminAuthService.logAudit({
      user_id: user.id,
      action: 'DELETE_ADMIN_USER',
      resource_type: 'admin_user',
      resource_id: id
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}