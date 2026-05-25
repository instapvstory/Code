'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/admin/AdminAuthProvider';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      router.push('/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{
          background: '#ffffff', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Lock size={28} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Admin Dashboard</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Sign in to manage your content</p>
          </div>

          {/* Form */}
          <div style={{ padding: 32 }}>
            {error && (
              <div style={{
                marginBottom: 20, padding: 14, background: '#fef2f2',
                border: '1px solid #fee2e2', borderRadius: 10,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: '#b91c1c', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pvstoryviewer.com"
                    required
                    disabled={loading}
                    style={{
                      width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                      border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none',
                      background: loading ? '#f9fafb' : '#fff', color: '#1f2937',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    style={{
                      width: '100%', paddingLeft: 40, paddingRight: 44, paddingTop: 12, paddingBottom: 12,
                      border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none',
                      background: loading ? '#f9fafb' : '#fff', color: '#1f2937',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                      display: 'flex', padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px 20px',
                  background: loading
                    ? '#a5b4fc'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Signing in...' : 'Sign in to Dashboard'}
              </button>
            </form>

            {/* Demo credentials */}
            <div style={{
              marginTop: 28, padding: 16, background: '#f8fafc',
              borderRadius: 10, border: '1px solid #e2e8f0',
            }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Demo Credentials
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px' }}>
                <strong>Email:</strong> admin@pvstoryviewer.com
              </p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                <strong>Password:</strong> admin123
              </p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 24 }}>
          © {new Date().getFullYear()} PvStoryViewer CMS
        </p>
      </div>
    </div>
  );
}