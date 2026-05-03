'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AdminAuthProvider';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Image,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PenSquare,
  Search,
  DollarSign,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Posts', href: '/admin/posts', icon: FileText },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Tags', href: '/admin/tags', icon: Tag },
  { name: 'Media', href: '/admin/media', icon: Image },
  { name: 'SEO', href: '/admin/seo', icon: Search },
  { name: 'Ads', href: '/admin/ads', icon: DollarSign },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/admin/login') return null;

  return (
    <aside
      style={{
        width: collapsed ? 72 : 260,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 12,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
              <img src="/logo.png" alt="CMS Logo" width="30" height="30" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', letterSpacing: -0.3 }}>CMS</span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logo.png" alt="CMS Logo" width="30" height="30" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6,
            padding: 4, cursor: 'pointer', color: '#94a3b8', display: 'flex',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.5))'
                  : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{user?.name || 'Admin'}</p>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                padding: 6, borderRadius: 6, display: 'flex',
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                padding: 4, display: 'flex',
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}