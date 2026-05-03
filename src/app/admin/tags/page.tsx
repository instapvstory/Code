'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';

interface TagItem {
  id: string;
  name: string;
  slug: string;
  post_count: number;
  created_at: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTags(); }, []);

  const fetchTags = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/tags');
    if (res.ok) {
      const data = await res.json();
      setTags(data.tags || []);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    setSaving(true);
    await fetch('/api/admin/tags', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim() }),
    });
    setNewTagName('');
    setSaving(false);
    fetchTags();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    await fetch('/api/admin/tags', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchTags();
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} tags?`)) return;
    for (const id of selected) {
      await fetch('/api/admin/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
    }
    setSelected([]);
    fetchTags();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Tags</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{tags.length} tags</p>
        </div>
        {selected.length > 0 && (
          <button onClick={handleBulkDelete} style={{
            padding: '9px 16px', background: '#fee2e2', color: '#dc2626',
            border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Delete {selected.length} Selected</button>
        )}
      </div>

      {/* Create form */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Add New Tag</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Tag name (e.g. instagram, privacy)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 14, outline: 'none', background: '#f8fafc',
            }}
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newTagName.trim()}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          ><Plus size={15} /> {saving ? 'Adding...' : 'Add Tag'}</button>
        </div>
      </div>

      {/* Tags grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
      ) : tags.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Tag size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8' }}>No tags yet. Add your first tag above.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 16px', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.length === tags.length && tags.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? tags.map(t => t.id) : [])}
                  />
                </th>
                {['Name', 'Slug', 'Posts', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(tag.id)}
                      onChange={(e) => setSelected(e.target.checked
                        ? [...selected, tag.id]
                        : selected.filter(id => id !== tag.id))}
                    />
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                      background: '#ede9fe', color: '#6d28d9', borderRadius: 999,
                      fontSize: 13, fontWeight: 600,
                    }}>
                      <Tag size={11} /> {tag.name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{tag.slug}</td>
                  <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#475569' }}>{tag.post_count}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <button onClick={() => handleDelete(tag.id)} style={{
                      padding: 6, background: 'none', border: 'none', cursor: 'pointer',
                      color: '#ef4444', display: 'flex', borderRadius: 6,
                    }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}