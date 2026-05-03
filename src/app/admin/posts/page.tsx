'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Edit, Trash2, Eye, Calendar, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
  reading_time: number;
  author?: { name: string };
  categories?: { name: string; slug: string }[];
  tags?: { name: string; slug: string }[];
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15;

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedStatus, searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(postsPerPage),
    });
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (searchQuery) params.set('search', searchQuery);

    const res = await fetch(`/api/admin/posts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    if (res.ok) fetchPosts();
  };

  const handleBulkDelete = async () => {
    if (!selectedPosts.length || !confirm(`Delete ${selectedPosts.length} posts?`)) return;
    await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_delete', ids: selectedPosts }),
    });
    setSelectedPosts([]);
    fetchPosts();
  };

  const handleBulkPublish = async () => {
    if (!selectedPosts.length) return;
    await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_status', ids: selectedPosts, status: 'published' }),
    });
    setSelectedPosts([]);
    fetchPosts();
  };

  const totalPages = Math.ceil(total / postsPerPage);
  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      published: { bg: '#dcfce7', color: '#166534' },
      draft: { bg: '#fef3c7', color: '#92400e' },
      scheduled: { bg: '#dbeafe', color: '#1e40af' },
      archived: { bg: '#f1f5f9', color: '#475569' },
    };
    const s = styles[status] || styles.draft;
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, background: s.bg, color: s.color,
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Posts</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Manage your blog posts ({total} total)</p>
        </div>
        <Link href="/admin/posts/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
        }}>
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="search"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none',
              background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 13, background: '#f8fafc', color: '#1e293b', outline: 'none',
          }}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedPosts.length > 0 && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
          padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
            {selectedPosts.length} selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleBulkPublish} style={{
              padding: '6px 14px', background: '#10b981', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Publish</button>
            <button onClick={handleBulkDelete} style={{
              padding: '6px 14px', background: '#ef4444', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Delete</button>
            <button onClick={() => setSelectedPosts([])} style={{
              padding: '6px 14px', background: '#64748b', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Clear</button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
              borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px',
            }} />
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <FileText size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 12px' }}>No posts found</p>
            <Link href="/admin/posts/new" style={{
              color: '#6366f1', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>Create your first post →</Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 16px', width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === posts.length && posts.length > 0}
                        onChange={(e) => {
                          setSelectedPosts(e.target.checked ? posts.map(p => p.id) : []);
                        }}
                      />
                    </th>
                    {['Title', 'Author', 'Status', 'Views', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={(e) => {
                            setSelectedPosts(e.target.checked
                              ? [...selectedPosts, post.id]
                              : selectedPosts.filter(id => id !== post.id));
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/admin/posts/${post.id}/edit`} style={{
                          fontSize: 14, fontWeight: 600, color: '#1e293b', textDecoration: 'none',
                        }}>
                          {post.title}
                        </Link>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                          /{post.slug}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {post.tags.slice(0, 3).map(t => (
                              <span key={t.slug} style={{
                                padding: '1px 6px', background: '#f1f5f9', borderRadius: 4,
                                fontSize: 10, color: '#64748b',
                              }}>{t.name}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                        {post.author?.name || 'Admin'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{statusBadge(post.status)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                        {(post.view_count || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            style={{
                              padding: 6, borderRadius: 6, color: '#6366f1', display: 'flex',
                              background: 'transparent', textDecoration: 'none',
                            }}
                            title="Edit"
                          ><Edit size={16} /></Link>
                          {post.status === 'published' && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              style={{
                                padding: 6, borderRadius: 6, color: '#10b981', display: 'flex',
                                background: 'transparent', textDecoration: 'none',
                              }}
                              title="View"
                            ><Eye size={16} /></Link>
                          )}
                          <button
                            onClick={() => handleDelete(post.id)}
                            style={{
                              padding: 6, borderRadius: 6, color: '#ef4444', display: 'flex',
                              background: 'transparent', border: 'none', cursor: 'pointer',
                            }}
                            title="Delete"
                          ><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '12px 16px', borderTop: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Page {currentPage} of {totalPages} ({total} posts)
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
                      background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1, display: 'flex',
                    }}
                  ><ChevronLeft size={16} /></button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
                      background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1, display: 'flex',
                    }}
                  ><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}