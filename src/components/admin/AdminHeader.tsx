'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from './AdminAuthProvider';
import { Bell, Search } from 'lucide-react';
import { useState } from 'react';

export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (pathname === '/admin/login') return null;

  // Build breadcrumb from pathname
  const segments = pathname?.split('/').filter(Boolean).slice(1) || []; // remove 'admin'
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/admin/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      {/* Left: Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <a href="/admin/dashboard" style={{
          fontSize: 13, color: '#64748b', textDecoration: 'none',
        }}>Dashboard</a>
        {breadcrumbs.filter(b => b.label.toLowerCase() !== 'dashboard').map((b) => (
          <span key={b.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#cbd5e1', fontSize: 12 }}>/</span>
            {b.isLast ? (
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{b.label}</span>
            ) : (
              <a href={b.href} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{b.label}</a>
            )}
          </span>
        ))}
      </nav>

      {/* Right: Search, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              width: 220, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8,
              background: '#f8fafc', outline: 'none', color: '#1e293b',
            }}
          />
        </div>

        {/* Notifications */}
        <button style={{
          position: 'relative', padding: 8, background: 'none', border: 'none',
          cursor: 'pointer', color: '#475569', borderRadius: 8, display: 'flex',
        }}>
          <Bell size={20} />
        </button>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{user?.name || 'Admin'}</p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}