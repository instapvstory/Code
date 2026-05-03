'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, X, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  post_count: number;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories || []);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditId(null);
    setFormName('');
    setFormDesc('');
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormDesc(cat.description || '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    if (editId) {
      await fetch('/api/admin/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: editId, data: { name: formName, description: formDesc } }),
      });
    } else {
      await fetch('/api/admin/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, description: formDesc }),
      });
    }
    setSaving(false);
    setShowForm(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await fetch('/api/admin/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    fetchCategories();
  };

  const handleToggle = async (cat: Category) => {
    await fetch('/api/admin/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: cat.id, data: { is_active: !cat.is_active } }),
    });
    fetchCategories();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Categories</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{categories.length} categories</p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}><Plus size={16} /> New Category</button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20,
          boxShadow: '0 4px 12px rgba(99,102,241,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              {editId ? 'Edit Category' : 'New Category'}
            </h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Category name"
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Description</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Optional description"
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 8,
              fontSize: 13, cursor: 'pointer', color: '#64748b',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !formName.trim()} style={{
              padding: '8px 18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Check size={14} /> {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <FolderOpen size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', margin: 0 }}>No categories yet. Create your first one.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Name', 'Slug', 'Description', 'Posts', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                    {cat.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                    {cat.slug}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#475569' }}>
                    {cat.post_count}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleToggle(cat)} style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: cat.is_active ? '#dcfce7' : '#f1f5f9',
                      color: cat.is_active ? '#166534' : '#475569',
                      border: 'none', cursor: 'pointer',
                    }}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(cat)} style={{
                        padding: 6, background: 'none', border: 'none', cursor: 'pointer',
                        color: '#6366f1', display: 'flex', borderRadius: 6,
                      }}><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(cat.id)} style={{
                        padding: 6, background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', display: 'flex', borderRadius: 6,
                      }}><Trash2 size={15} /></button>
                    </div>
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