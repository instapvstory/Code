'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, FolderOpen, Tag, Users, Eye, TrendingUp,
  Clock, ArrowUp, Edit, CheckCircle, PenSquare,
} from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  totalTags: number;
  totalUsers: number;
  totalViews: number;
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
  reading_time: number;
  author_name: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentPosts(data.recentPosts || []);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { title: 'Total Posts', value: stats.totalPosts, icon: FileText, color: '#6366f1' },
    { title: 'Published', value: stats.publishedPosts, icon: CheckCircle, color: '#10b981' },
    { title: 'Drafts', value: stats.draftPosts, icon: Edit, color: '#f59e0b' },
    { title: 'Categories', value: stats.totalCategories, icon: FolderOpen, color: '#3b82f6' },
    { title: 'Tags', value: stats.totalTags, icon: Tag, color: '#8b5cf6' },
    { title: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: '#ec4899' },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Welcome back! Here&apos;s your content overview.</p>
        </div>
        <Link
          href="/admin/posts/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <PenSquare size={16} /> New Post
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} style={{
              background: '#fff', borderRadius: 12, padding: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px', fontWeight: 500 }}>{stat.title}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', margin: 0 }}>{stat.value}</p>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${stat.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Posts */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Recent Posts</h2>
          <Link href="/admin/posts" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
            View all →
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 12px' }}>No posts yet</p>
            <Link
              href="/admin/posts/new"
              style={{
                color: '#6366f1', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              Create your first post →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Title', 'Author', 'Status', 'Views', 'Date'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => (
                <tr key={post.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/admin/posts/${post.id}/edit`} style={{
                      fontSize: 14, fontWeight: 600, color: '#1e293b', textDecoration: 'none',
                    }}>
                      {post.title}
                    </Link>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{post.reading_time} min read</p>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{post.author_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                      background: post.status === 'published' ? '#dcfce7' : post.status === 'draft' ? '#fef3c7' : '#dbeafe',
                      color: post.status === 'published' ? '#166534' : post.status === 'draft' ? '#92400e' : '#1e40af',
                    }}>
                      {post.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                    {(post.view_count || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
                    {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}