import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Check the user exists and is active
    const { data: user, error: userError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      // Return generic message to avoid email enumeration
      return NextResponse.json({
        success: true,
        message: 'If that email exists, the password has been updated.',
      });
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This account is inactive. Contact a super admin.' },
        { status: 403 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // Invalidate all existing sessions for this user
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. All existing sessions have been invalidated.',
    });
  } catch (err) {
    console.error('Reset password route error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
