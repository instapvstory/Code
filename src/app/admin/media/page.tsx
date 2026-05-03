'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, File, Grid, List, X } from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  url: string;
  alt_text: string | null;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchMedia(); }, [page, typeFilter]);

  const fetchMedia = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (typeFilter !== 'all') params.set('type', typeFilter);
    const res = await fetch(`/api/admin/media?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMedia(data.media || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch('/api/admin/media', { method: 'POST', body: formData });
    }
    setUploading(false);
    fetchMedia();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    await fetch('/api/admin/media', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setPreview(null);
    fetchMedia();
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} files?`)) return;
    for (const id of selected) {
      await fetch('/api/admin/media', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    }
    setSelected([]);
    fetchMedia();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Media Library</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{total} files</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx"
          style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {/* Drop Zone + Filters */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`,
          borderRadius: 12, padding: '20px', textAlign: 'center',
          background: dragOver ? '#ede9fe' : '#f8fafc', marginBottom: 20,
          transition: 'all 0.2s',
        }}
      >
        <Upload size={24} color={dragOver ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, color: dragOver ? '#6366f1' : '#64748b', margin: 0, fontWeight: dragOver ? 600 : 400 }}>
          {dragOver ? 'Drop files here' : 'Drag & drop files here, or click upload above'}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        padding: '12px 16px', marginBottom: 16,
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#f8fafc' }}
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button onClick={() => setViewMode('grid')} style={{
            padding: 8, background: viewMode === 'grid' ? '#ede9fe' : 'transparent',
            border: 'none', borderRadius: 6, cursor: 'pointer', color: viewMode === 'grid' ? '#6366f1' : '#64748b', display: 'flex',
          }}><Grid size={16} /></button>
          <button onClick={() => setViewMode('list')} style={{
            padding: 8, background: viewMode === 'list' ? '#ede9fe' : 'transparent',
            border: 'none', borderRadius: 6, cursor: 'pointer', color: viewMode === 'list' ? '#6366f1' : '#64748b', display: 'flex',
          }}><List size={16} /></button>
        </div>

        {selected.length > 0 && (
          <button onClick={handleBulkDelete} style={{
            padding: '7px 14px', background: '#fee2e2', color: '#dc2626',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Delete {selected.length}</button>
        )}
      </div>

      {/* Media Grid / List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading media...</div>
      ) : media.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <ImageIcon size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8' }}>No media files yet. Upload your first file.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {media.map((item) => (
            <div
              key={item.id}
              onClick={() => setPreview(item)}
              style={{
                background: '#fff', borderRadius: 10, border: `2px solid ${selected.includes(item.id) ? '#6366f1' : '#e2e8f0'}`,
                overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ position: 'relative', height: 120, background: '#f1f5f9' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(e) => { e.stopPropagation(); setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id)); }}
                  style={{ position: 'absolute', top: 8, left: 8, zIndex: 1, accentColor: '#6366f1' }}
                  onClick={(e) => e.stopPropagation()}
                />
                {item.file_type === 'image' ? (
                  <img src={item.url} alt={item.alt_text || item.original_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <File size={32} color="#94a3b8" />
                  </div>
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{ fontSize: 11, color: '#1e293b', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.original_name}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>{formatBytes(item.file_size)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px', width: 40 }}><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? media.map(m => m.id) : [])} /></th>
                {['Preview', 'Name', 'Type', 'Size', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {media.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}><input type="checkbox" checked={selected.includes(item.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))} /></td>
                  <td style={{ padding: '10px 16px' }}>
                    {item.file_type === 'image' ? (
                      <img src={item.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <File size={22} color="#94a3b8" />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#1e293b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.original_name}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b' }}>{item.file_type}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b' }}>{formatBytes(item.file_size)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', borderRadius: 6 }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', maxWidth: 600, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {preview.file_type === 'image' && (
              <img src={preview.url} alt={preview.original_name}
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#f1f5f9' }} />
            )}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{preview.original_name}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{formatBytes(preview.file_size)} · {preview.mime_type}</p>
                </div>
                <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => copyUrl(preview.url)} style={{
                  flex: 1, padding: '9px 14px', background: '#ede9fe', color: '#7c3aed',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Copy URL</button>
                <button onClick={() => { handleDelete(preview.id); setPreview(null); }} style={{
                  padding: '9px 14px', background: '#fee2e2', color: '#dc2626',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}