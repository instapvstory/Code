'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              Reset Admin Password
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Enter your admin email and a new password
            </p>
          </div>

          <div style={{ padding: 32 }}>
            {/* Success State */}
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#f0fdf4', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <CheckCircle size={36} color="#16a34a" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
                  Password Updated!
                </h2>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                  Your password has been reset successfully. All previous sessions have been invalidated.
                </p>
                <button
                  onClick={() => router.push('/admin/login')}
                  style={{
                    width: '100%', padding: '13px 20px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                {/* Error Alert */}
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
                      Admin Email
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

                  {/* New Password */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        minLength={8}
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

                  {/* Confirm Password */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        disabled={loading}
                        style={{
                          width: '100%', paddingLeft: 40, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                          border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? '#fca5a5' : '#d1d5db'}`,
                          borderRadius: 10, fontSize: 14, outline: 'none',
                          background: loading ? '#f9fafb' : '#fff', color: '#1f2937',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4, marginBottom: 0 }}>
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '13px 20px',
                      background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', border: 'none', borderRadius: 10,
                      fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </form>

                {/* Back to login */}
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <a
                    href="/admin/login"
                    style={{
                      fontSize: 13, color: '#6b7280', textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <ArrowLeft size={14} />
                    Back to Login
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 24 }}>
          © {new Date().getFullYear()} PvStoryViewer CMS
        </p>
      </div>
    </div>
  );
}
