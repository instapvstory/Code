# Blog CMS Admin Dashboard - Security & User Management Plan

## Overview
This document outlines the security architecture and user management system for the Blog CMS Admin Dashboard, focusing on Supabase authentication, Row Level Security (RLS), and best practices for a secure MVP.

## Security Architecture

### 1. Authentication System (Supabase Auth)

#### Authentication Flow
```
User → Login Page → Supabase Auth → JWT Token → Protected Routes
```

#### Implementation Components
```typescript
// Authentication service using Supabase
class AuthService {
  private supabase: SupabaseClient;
  
  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw new AuthError(error.message);
    
    return {
      user: data.user,
      session: data.session
    };
  }
  
  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }
  
  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }
  
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }
}
```

#### Password Policy
- Minimum 8 characters
- Require at least one uppercase letter
- Require at least one number
- Require at least one special character
- Password hashing via Supabase (bcrypt)

### 2. Row Level Security (RLS) Policies

#### Database Schema with RLS
```sql
-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Posts table policies
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Public read access for published posts
CREATE POLICY "Public can view published posts" ON posts
  FOR SELECT USING (status = 'published');
```

#### User Roles System
```sql
-- User roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'author',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Role-based permissions
CREATE TYPE permission_type AS ENUM (
  'create_post',
  'edit_post',
  'delete_post',
  'publish_post',
  'manage_categories',
  'manage_tags',
  'upload_media',
  'manage_users'
);

-- Default roles
INSERT INTO user_roles (user_id, role, permissions) VALUES
  (admin_user_id, 'admin', '{"all": true}'),
  (editor_user_id, 'editor', '{"create_post": true, "edit_post": true, "publish_post": true}'),
  (author_user_id, 'author', '{"create_post": true, "edit_post": true}');
```

### 3. Frontend Security Middleware

#### Route Protection Middleware
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
```

#### Authentication Context Provider
```typescript
// AuthContext.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const value = {
    user,
    loading,
    login: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    },
    logout: async () => {
      await supabase.auth.signOut();
    }
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. User Management System

#### User Model
```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'author';
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

interface UserPermissions {
  can_create_post: boolean;
  can_edit_post: boolean;
  can_delete_post: boolean;
  can_publish_post: boolean;
  can_manage_categories: boolean;
  can_manage_tags: boolean;
  can_upload_media: boolean;
  can_manage_users: boolean;
}
```

#### User Management Components

##### Users List Component
```typescript
const UsersTable: React.FC = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers()
  });
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? 'success' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.last_login_at 
                  ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                  : 'Never'
                }
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

##### User Form Component
```typescript
const UserForm: React.FC<UserFormProps> = ({ user, onSubmit }) => {
  const form = useForm<UserFormData>({
    defaultValues: user || {
      name: '',
      email: '',
      role: 'author',
      is_active: true
    }
  });
  
  const handleSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      toast.success(user ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
      toast.error('Failed to save user');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Active user</FormLabel>
            </FormItem>
          )}
        />
        
        <Button type="submit">
          {user ? 'Update User' : 'Create User'}
        </Button>
      </form>
    </Form>
  );
};
```

### 5. Security Best Practices

#### Input Validation & Sanitization
```typescript
class InputValidator {
  static validatePostInput(data: PostInput): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    } else if (data.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must be less than 255 characters' });
    }
    
    // Slug validation
    if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      errors.push({ field: 'slug', message: 'Slug must be lowercase with hyphens' });
    }
    
    // Content sanitization
    if (data.content) {
      data.content = this.sanitizeContent(data.content);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: data
    };
  }
  
  private static sanitizeContent(content: any): any {
    // Remove script tags and other dangerous HTML
    // Implement DOMPurify or similar
    return content;
  }
}
```

#### Rate Limiting
```typescript
class RateLimiter {
  private limits: Map<string, RequestCount> = new Map();
  
  async checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const requestCount = this.limits.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > requestCount.resetTime) {
      // Reset window
      requestCount.count = 1;
      requestCount.resetTime = now + windowMs;
    } else if (requestCount.count >= limit) {
      return false; // Limit exceeded
    } else {
      requestCount.count++;
    }
    
    this.limits.set(key, requestCount);
    return true;
  }
}

// Apply rate limiting to API routes
export async function rateLimitMiddleware(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000
): Promise<NextResponse | null> {
  const ip = request.ip || 'unknown';
  const key = `rate-limit:${ip}:${request.nextUrl.pathname}`;
  
  const allowed = await rateLimiter.checkLimit(key, limit, windowMs);
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  
  return null;
}
```

#### CSRF Protection
```typescript
// Generate CSRF token
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate CSRF token
function validateCsrfToken(token: string, sessionToken: string): boolean {
  const expected = this.generateTokenFromSession(sessionToken);
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected)
  );
}

// Apply to forms
const CsrfForm: React.FC = () => {
  const [csrfToken, setCsrfToken] = useState('');
  
  useEffect(() => {
    // Fetch CSRF token from server
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.token));
  }, []);
  
  return (
    <form>
      <input type="hidden" name="csrf_token" value={csrfToken} />
      {/* Form fields */}
    </form>
  );
};
```

### 6. Audit Logging

#### Audit Log System
```typescript
interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

class AuditLogger {
  async log(
    user: User,
    action: string,
    resource: { type: string; id: string },
    details: Record<string, any> = {}
  ): Promise<void> {
    const log: Omit<AuditLog, 'id' | 'created_at'> = {
      user_id: user.id,
      action,
      resource_type: resource.type,
      resource_id: resource.id,
      details,
      ip_address: this.getClientIp(),
      user_agent: this.getUserAgent()
    };
    
    await supabase.from('audit_logs').insert(log);
  }
  
  private getClientIp(): string {
    // Extract from request headers
    return 'unknown';
  }
  
  private getUserAgent(): string {
    // Extract from request headers
    return 'unknown';
  }
}

// Usage
const auditLogger = new AuditLogger();

// Log user actions
await auditLogger.log(
  user,
  'post_created',
  { type: 'post', id: postId },
  { title: postTitle, status: 'draft' }
);
```

### 7. Session Management

#### Session Configuration
```typescript
// Supabase client configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(key);
        }
      }
    }
  }
);
```

#### Session Timeout
```typescript
class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  startSessionTimeout(): void {
    this.clearSessionTimeout();
    
    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.SESSION_TIMEOUT);
    
    // Reset timeout on user activity
    document.addEventListener('mousemove', this.resetSessionTimeout.bind(this));
    document.addEventListener('keypress', this.resetSessionTimeout.bind(this));
  }
  
  private resetSessionTimeout(): void {
    this.clearSessionTimeout();
    this.startSessionTimeout();
  }
  
  private clearSessionTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  private async handleSessionTimeout(): Promise<void> {
    await supabase.auth.signOut();
    window.location.href = '/login?session=expired';
  }
}
```

### 8. Security Headers

#### Next.js Configuration
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"
  }
];

const nextConfig = {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  }
};
```

### 9. Password Reset Flow

#### Password Reset Implementation
```typescript
class PasswordResetService {
  async requestReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    });
    
    if (error) throw error;
  }
  
  async resetPassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  }
  
  async validateResetToken(): Promise<boolean> {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return false;
    }
    
    return true;
  }
}
```

### 10. Implementation Timeline

#### Week 1: Authentication Foundation
- Set up Supabase authentication
- Implement login/logout flows
- Create protected routes middleware
- Set up session management

#### Week 2: User Management
- Create user profiles table
- Implement role-based permissions
- Build users management UI
- Add user creation/editing forms

#### Week 3: Security Enhancements
- Implement RLS policies
- Add input validation
- Set up rate limiting
- Configure security headers

#### Week 4: Audit & Monitoring
- Implement audit logging
- Add session timeout
- Create security dashboard
- Set up error monitoring

### 11. Testing Strategy

#### Security Tests
```typescript
describe('Security Tests', () => {
  test('prevents unauthorized access', async () => {
    const response = await fetch('/api/admin/posts');
    expect(response.status).toBe(401);
  });
  
  test('validates user input', async () => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: '' })
    });
    expect(response.status).toBe(400);
  });
  
  test('enforces rate limits', async () => {
    const requests = Array(101).fill(null).map(() =>
      fetch('/api/login', { method: 'POST' })
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 12. Compliance & Best Practices

#### GDPR Compliance
- User data encryption
- Right to be forgotten implementation
- Data export functionality
- Privacy policy integration

#### Security Auditing
- Regular dependency updates
- Security vulnerability scanning
- Penetration testing
- Code review for security issues

#### Monitoring & Alerts
- Suspicious activity detection
- Failed login attempts tracking
- Security incident reporting
- Regular security audits

## Conclusion
This security and user management plan provides a comprehensive framework for building a secure Blog CMS Admin Dashboard. By implementing these measures, we ensure that the application is protected against common security threats while providing a robust user management system that scales with the application's needs.