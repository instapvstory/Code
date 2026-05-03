'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/admin/AdminAuthProvider';
import { useRouter } from 'next/navigation';

interface SEOSettings {
  id?: string;
  site_name: string;
  default_meta_title: string;
  default_meta_description: string;
  default_og_image: string;
  robots_index: boolean;
  robots_follow: boolean;
  twitter_card_type: string;
  facebook_app_id: string;
  twitter_site_handle: string;
}

interface Integrations {
  id?: string;
  google_verification_code: string;
  gsc_property_url: string;
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
  custom_head_html: string;
  custom_body_html: string;
}

interface RobotsSettings {
  id?: string;
  disallow_paths: string[];
  allow_paths: string[];
  sitemap_url: string;
  custom_rules: string;
}

export default function SEOPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [seo, setSeo] = useState<SEOSettings>({
    site_name: '',
    default_meta_title: '',
    default_meta_description: '',
    default_og_image: '',
    robots_index: true,
    robots_follow: true,
    twitter_card_type: 'summary_large_image',
    facebook_app_id: '',
    twitter_site_handle: '',
  });
  
  const [integrations, setIntegrations] = useState<Integrations>({
    google_verification_code: '',
    gsc_property_url: '',
    google_analytics_id: '',
    google_tag_manager_id: '',
    facebook_pixel_id: '',
    custom_head_html: '',
    custom_body_html: '',
  });
  
  const [robots, setRobots] = useState<RobotsSettings>({
    disallow_paths: ['/admin', '/api', '/private'],
    allow_paths: ['/', '/blog', '/about'],
    sitemap_url: '/sitemap.xml',
    custom_rules: '',
  });
  
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchSEOSettings();
    }
  }, [user]);

  const fetchSEOSettings = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/admin/seo/settings');
      const data = await response.json();
      
      if (data.success) {
        if (data.data.seo) setSeo(data.data.seo);
        if (data.data.integrations) setIntegrations(data.data.integrations);
        if (data.data.robots) setRobots(data.data.robots);
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      setMessage({ type: 'error', text: 'Failed to load SEO settings' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/admin/seo/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seo, integrations, robots }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'SEO settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save SEO settings' });
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      setMessage({ type: 'error', text: 'Failed to save SEO settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeoChange = (field: keyof SEOSettings, value: any) => {
    setSeo(prev => ({ ...prev, [field]: value }));
  };

  const handleIntegrationsChange = (field: keyof Integrations, value: string) => {
    setIntegrations(prev => ({ ...prev, [field]: value }));
  };

  const handleRobotsChange = (field: keyof RobotsSettings, value: any) => {
    setRobots(prev => ({ ...prev, [field]: value }));
  };

  const addDisallowPath = () => {
    const newPath = prompt('Enter path to disallow (e.g., /private):');
    if (newPath && !robots.disallow_paths.includes(newPath)) {
      setRobots(prev => ({
        ...prev,
        disallow_paths: [...prev.disallow_paths, newPath]
      }));
    }
  };

  const removeDisallowPath = (index: number) => {
    setRobots(prev => ({
      ...prev,
      disallow_paths: prev.disallow_paths.filter((_, i) => i !== index)
    }));
  };

  if (loading || loadingData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#64748b' }}>Loading SEO settings...</div>
      </div>
    );
  }

  return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>SEO & Analytics Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            borderRadius: '0.5rem',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Basic SEO Settings */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Basic SEO Settings
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Site Name
                </label>
                <input
                  type="text"
                  value={seo.site_name}
                  onChange={(e) => handleSeoChange('site_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  placeholder="My Blog"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Default Meta Title
                </label>
                <input
                  type="text"
                  value={seo.default_meta_title}
                  onChange={(e) => handleSeoChange('default_meta_title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  placeholder="Welcome to My Blog"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Default Meta Description
                </label>
                <textarea
                  value={seo.default_meta_description}
                  onChange={(e) => handleSeoChange('default_meta_description', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                  placeholder="A modern blog platform with great content"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={seo.robots_index}
                      onChange={(e) => handleSeoChange('robots_index', e.target.checked)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span style={{ fontWeight: '500', color: '#475569' }}>Allow Indexing</span>
                  </label>
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={seo.robots_follow}
                      onChange={(e) => handleSeoChange('robots_follow', e.target.checked)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span style={{ fontWeight: '500', color: '#475569' }}>Allow Following</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics & Integrations */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Analytics & Integrations
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={integrations.google_analytics_id}
                  onChange={(e) => handleIntegrationsChange('google_analytics_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  placeholder="UA-XXXXXXXXX-X"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  value={integrations.google_tag_manager_id}
                  onChange={(e) => handleIntegrationsChange('google_tag_manager_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={integrations.facebook_pixel_id}
                  onChange={(e) => handleIntegrationsChange('facebook_pixel_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  placeholder="XXXXXXXXXXXXXXX"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Google Verification Code
                </label>
                <input
                  type="text"
                  value={integrations.google_verification_code}
                  onChange={(e) => handleIntegrationsChange('google_verification_code', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                  placeholder="google-site-verification=XXXXXXXX"
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                Custom Head HTML (for tracking scripts)
              </label>
              <textarea
                value={integrations.custom_head_html}
                onChange={(e) => handleIntegrationsChange('custom_head_html', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
                placeholder="<!-- Paste tracking scripts here -->"
              />
            </div>
          </div>

          {/* Robots.txt Settings */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Robots.txt Configuration
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: '500', color: '#475569' }}>Disallowed Paths</label>
                <button
                  onClick={addDisallowPath}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  + Add Path
                </button>
              </div>
              
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                padding: '1rem',
                minHeight: '100px',
              }}>
                {robots.disallow_paths.length === 0 ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                    No disallowed paths configured
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {robots.disallow_paths.map((path, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.25rem',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', color: '#475569' }}>{path}</span>
                        <button
                          onClick={() => removeDisallowPath(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                Sitemap URL
              </label>
              <input
                type="text"
                value={robots.sitemap_url}
                onChange={(e) => handleRobotsChange('sitemap_url', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
                placeholder="/sitemap.xml"
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                Custom Robots.txt Rules
              </label>
              <textarea
                value={robots.custom_rules}
                onChange={(e) => handleRobotsChange('custom_rules', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                }}
                placeholder="User-agent: *\nAllow: /"
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '1rem 2rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving All Settings...' : 'Save All SEO Settings'}
          </button>
        </div>
      </div>
    );
  }