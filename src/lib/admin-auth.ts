import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  user_id: string;
  token: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: AdminUser;
  session?: AdminSession;
  error?: string;
}

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

class AdminAuthService {
  private readonly SESSION_DURATION_DAYS = 7;
  private readonly SALT_ROUNDS = 10;

  // Login with email and password
  async login(credentials: LoginCredentials, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    try {
      // Get user by email
      const { data: user, error: userError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        await this.logAudit({
          action: 'LOGIN_FAILED',
          details: { email: credentials.email, reason: 'User not found or inactive' },
          ip_address: ipAddress,
          user_agent: userAgent
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValidPassword) {
        await this.logAudit({
          user_id: user.id,
          action: 'LOGIN_FAILED',
          details: { email: credentials.email, reason: 'Invalid password' },
          ip_address: ipAddress,
          user_agent: userAgent
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Create session token
      const sessionToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);

      // Create session in database
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          user_id: user.id,
          token: sessionToken,
          user_agent: userAgent,
          ip_address: ipAddress,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        await this.logAudit({
          user_id: user.id,
          action: 'LOGIN_FAILED',
          details: { email: credentials.email, reason: 'Session creation failed' },
          ip_address: ipAddress,
          user_agent: userAgent
        });
        return { success: false, error: 'Failed to create session' };
      }

      // Update last login time
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      // Log successful login
      await this.logAudit({
        user_id: user.id,
        action: 'LOGIN_SUCCESS',
        ip_address: ipAddress,
        user_agent: userAgent
      });

      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword as AdminUser,
        session: session as AdminSession
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Validate session token
  async validateSession(token: string): Promise<AdminUser | null> {
    try {
      // Get session with user
      const { data: sessionWithUser, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users (*)
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !sessionWithUser) {
        return null;
      }

      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = sessionWithUser.admin_users;

      return userWithoutPassword as AdminUser;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  // Logout (invalidate session)
  async logout(token: string, userId?: string): Promise<boolean> {
    try {
      // Delete session
      const { error } = await supabase
        .from('admin_sessions')
        .delete()
        .eq('token', token);

      if (error) {
        return false;
      }

      // Log logout action
      if (userId) {
        await this.logAudit({
          user_id: userId,
          action: 'LOGOUT'
        });
      }

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // Create audit log entry
  async logAudit(entry: AuditLogEntry): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent
        });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Failed to get dashboard stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return null;
    }
  }

  // Get recent audit logs
  async getRecentAuditLogs(limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin_users (email, name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get audit logs:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Audit logs error:', error);
      return [];
    }
  }

  // Get security logs
  async getSecurityLogs(limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get security logs:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Security logs error:', error);
      return [];
    }
  }

  // Get system configurations
  async getSystemConfigs() {
    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('*')
        .order('key');

      if (error) {
        console.error('Failed to get system configs:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('System configs error:', error);
      return [];
    }
  }

  // Update system configuration
  async updateSystemConfig(key: string, value: string, userId: string) {
    try {
      const { error } = await supabase
        .from('system_configs')
        .update({
          value,
          updated_by: userId
        })
        .eq('key', key);

      if (error) {
        console.error('Failed to update system config:', error);
        return false;
      }

      // Log the update
      await this.logAudit({
        user_id: userId,
        action: 'UPDATE_SYSTEM_CONFIG',
        resource_type: 'system_config',
        resource_id: key,
        details: { key, value }
      });

      return true;
    } catch (error) {
      console.error('Update system config error:', error);
      return false;
    }
  }

  // Create new admin user (super admin only)
  async createAdminUser(email: string, password: string, name: string, role: string, createdBy: string) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name,
          role,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create admin user:', error);
        return { success: false, error: error.message };
      }

      // Log the creation
      await this.logAudit({
        user_id: createdBy,
        action: 'CREATE_ADMIN_USER',
        resource_type: 'admin_user',
        resource_id: data.id,
        details: { email, name, role }
      });

      return { success: true, user: data };
    } catch (error) {
      console.error('Create admin user error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Get all admin users
  async getAdminUsers() {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, is_active, last_login_at, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get admin users:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Get admin users error:', error);
      return [];
    }
  }
}

export const adminAuthService = new AdminAuthService();