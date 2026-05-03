'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

interface Setting { key: string; value: any; description: string | null; }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings || []);
      const map: Record<string, string> = {};
      (data.settings || []).forEach((s: Setting) => {
        map[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
      });
      setValues(map);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    for (const key of Object.keys(values)) {
      await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] }),
      });
    }
    setSaving(false);
    showToast('success', 'Settings saved!');
  };

  const readableKey = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: toast.type === 'success' ? '#166534' : '#991b1b' }}>{toast.msg}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Settings</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Configure your CMS settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading settings...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {settings.map((setting, i) => (
            <div key={setting.key} style={{
              padding: 20, borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                  {readableKey(setting.key)}
                </p>
                {setting.description && (
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{setting.description}</p>
                )}
                <code style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{setting.key}</code>
              </div>
              <div>
                {setting.key === 'maintenance_mode' ? (
                  <select
                    value={values[setting.key] ?? 'false'}
                    onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                      fontSize: 13, outline: 'none', background: '#f8fafc',
                    }}
                  >
                    <option value="false">Disabled</option>
                    <option value="true">Enabled</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={values[setting.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                      fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}