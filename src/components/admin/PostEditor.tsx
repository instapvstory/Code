'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Save, Eye, X, Upload, Plus, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false });
const SeoAnalysisPanel = dynamic(() => import('@/components/admin/SeoAnalysisPanel'), { ssr: false });

interface Category { id: string; name: string; }
interface Tag { id: string; name: string; }

interface PostEditorProps {
  postId?: string;
}

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const isEditing = !!postId;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState<any>({});
  const [contentHtml, setContentHtml] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [status, setStatus] = useState('draft');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSeoAnalysis, setShowSeoAnalysis] = useState(false);

  useEffect(() => {
    fetchMeta();
    if (isEditing) fetchPost();
  }, [postId]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMeta = async () => {
    const [catRes, tagRes] = await Promise.all([
      fetch('/api/admin/categories'),
      fetch('/api/admin/tags'),
    ]);
    if (catRes.ok) {
      const d = await catRes.json();
      setCategories(d.categories || []);
    }
    if (tagRes.ok) {
      const d = await tagRes.json();
      setTags(d.tags || []);
    }
  };

  const fetchPost = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/posts/${postId}`);
    if (res.ok) {
      const post = await res.json();
      setTitle(post.title || '');
      setExcerpt(post.excerpt || '');
      setContent(post.content || {});
      setContentHtml(post.content_html || '');
      setFeaturedImage(post.featured_image || '');
      setStatus(post.status || 'draft');
      setMetaTitle(post.meta_title || '');
      setMetaDescription(post.meta_description || '');
      setSelectedCategoryIds(post.category_ids || []);
      setSelectedTagIds(post.tag_ids || []);
    }
    setLoading(false);
  };

  const handleSave = async (overrideStatus?: string) => {
    if (!title.trim()) {
      showToast('error', 'Title is required');
      return;
    }
    setSaving(true);
    const body = {
      title,
      excerpt,
      content,
      content_html: contentHtml,
      featured_image: featuredImage || null,
      status: overrideStatus || status,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      category_ids: selectedCategoryIds,
      tag_ids: selectedTagIds,
    };

    const res = isEditing
      ? await fetch(`/api/admin/posts/${postId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/admin/posts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    const data = await res.json();
    if (data.success) {
      showToast('success', isEditing ? 'Post updated!' : 'Post created!');
      if (!isEditing && data.post?.id) {
        setTimeout(() => router.push(`/admin/posts/${data.post.id}/edit`), 1000);
      }
    } else {
      showToast('error', data.error || 'Save failed');
    }
    setSaving(false);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch('/api/admin/tags', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.tag) {
        setTags(prev => [...prev, data.tag]);
        setSelectedTagIds(prev => [...prev, data.tag.id]);
      }
    }
    setNewTagName('');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div>
          <div style={{
            width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={18} color="#16a34a" />
            : <AlertCircle size={18} color="#dc2626" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: toast.type === 'success' ? '#166534' : '#991b1b' }}>
            {toast.message}
          </span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {isEditing ? 'Edit Post' : 'New Post'}
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowSeoAnalysis(!showSeoAnalysis)}
            style={{
              padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
              background: showSeoAnalysis ? '#7c3aed' : 'white',
              color: showSeoAnalysis ? 'white' : '#475569',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', fontWeight: 500, fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            <BarChart3 size={16} />
            {showSeoAnalysis ? 'Hide SEO Analysis' : 'Show SEO Analysis'}
          </button>
          <button
            onClick={() => router.back()}
            style={{
              padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
              background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          ><X size={15} /> Cancel</button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            style={{
              padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: 8,
              background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          ><Save size={15} /> Save Draft</button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            style={{
              padding: '9px 18px', border: 'none', borderRadius: 8,
              background: saving ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          ><Eye size={15} /> {saving ? 'Saving...' : 'Publish'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Left: Main Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <input
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%', fontSize: 24, fontWeight: 700, border: 'none', outline: 'none',
                color: '#1e293b', background: 'transparent', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Editor */}
          <div>
            <TipTapEditor
              content={content}
              onChange={(json, html) => { setContent(json); setContentHtml(html); }}
            />
          </div>

          {/* Excerpt */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
              Excerpt
            </label>
            <textarea
              placeholder="Short description shown in blog listings..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, resize: 'vertical', outline: 'none', color: '#1e293b',
                background: '#f8fafc', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* SEO */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 14px' }}>
              SEO Optimization
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
                Meta Title
              </label>
              <input
                type="text"
                placeholder="SEO title (defaults to post title)"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={60}
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{metaTitle.length}/60</p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
                Meta Description
              </label>
              <textarea
                placeholder="SEO description for search engines..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, resize: 'none', outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{metaDescription.length}/160</p>
            </div>
          </div>

          {/* SEO Analysis Panel */}
          {showSeoAnalysis && (
            <div style={{ marginTop: 16 }}>
              <SeoAnalysisPanel
                postId={postId}
                title={title}
                content={contentHtml}
                metaDescription={metaDescription}
                slug={title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}
                onAnalysisUpdate={(analysis) => {
                  console.log('SEO Analysis Updated:', analysis);
                }}
              />
            </div>
          )}
        </div>

        {/* Right: Sidebar Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Publish Settings */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Publish Settings</h3>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Featured Image */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Featured Image</h3>
            {featuredImage && (
              <div style={{ marginBottom: 10, position: 'relative' }}>
                <img
                  src={featuredImage}
                  alt="Featured"
                  style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }}
                />
                <button
                  onClick={() => setFeaturedImage('')}
                  style={{
                    position: 'absolute', top: 6, right: 6, background: '#fff',
                    border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer',
                    display: 'flex',
                  }}
                ><X size={14} color="#ef4444" /></button>
              </div>
            )}
            {/* Upload from PC */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 12px', border: '2px dashed #c7d2fe', borderRadius: 8,
              background: '#f5f3ff', cursor: imageUploading ? 'wait' : 'pointer',
              color: '#6366f1', fontSize: 13, fontWeight: 600, marginBottom: 8,
              transition: 'all 0.15s',
            }}>
              <Upload size={15} />
              {imageUploading ? 'Uploading...' : 'Upload from PC'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={imageUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/admin/media', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.success && data.media?.url) {
                      setFeaturedImage(data.media.url);
                    } else {
                      alert(data.error || 'Upload failed. Please try a URL instead.');
                    }
                  } catch {
                    alert('Upload failed. Please try a URL instead.');
                  } finally {
                    setImageUploading(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
            {/* Or paste URL */}
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '0 0 6px' }}>— or paste image URL —</p>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 12, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
              }}
            />
          </div>


          {/* Categories */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categories.map((cat) => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  {cat.name}
                </label>
              ))}
              {categories.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>No categories yet.</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Tags</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                      background: isSelected ? '#ede9fe' : '#f8fafc',
                      color: isSelected ? '#6366f1' : '#64748b',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
                style={{
                  flex: 1, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
                  fontSize: 12, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  padding: '7px 10px', background: '#6366f1', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex',
                }}
              ><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
