'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/admin/AdminAuthProvider';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit, Trash2, Eye, DollarSign, BarChart3, Calendar,
  ChevronLeft, ChevronRight, Search, Filter, Download
} from 'lucide-react';

interface Ad {
  id: string;
  name: string;
  ad_type: string;
  position: string;
  content: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  target_url: string | null;
  image_url: string | null;
  dimensions: string | null;
  created_at: string;
  stats: {
    total_clicks: number;
    total_impressions: number;
    ctr: string;
  };
}

export default function AdsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const limit = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAds();
    }
  }, [user, currentPage, selectedType, selectedStatus]);

  const fetchAds = async () => {
    try {
      setLoadingData(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/admin/ads?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAds(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      setMessage({ type: 'error', text: 'Failed to load ads' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateAd = () => {
    setShowCreateModal(true);
  };

  const handleEditAd = (ad: Ad) => {
    // Navigate to edit page or show edit modal
    setSelectedAd(ad);
    setShowCreateModal(true);
  };

  const handleDeleteAd = (ad: Ad) => {
    setSelectedAd(ad);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAd) return;
    
    try {
      const response = await fetch(`/api/admin/ads/${selectedAd.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Ad deleted successfully' });
        fetchAds();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete ad' });
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      setMessage({ type: 'error', text: 'Failed to delete ad' });
    } finally {
      setShowDeleteModal(false);
      setSelectedAd(null);
    }
  };

  const toggleAdStatus = async (ad: Ad) => {
    try {
      const response = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !ad.is_active }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `Ad ${!ad.is_active ? 'activated' : 'paused'} successfully` });
        fetchAds();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update ad status' });
      }
    } catch (error) {
      console.error('Error updating ad status:', error);
      setMessage({ type: 'error', text: 'Failed to update ad status' });
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedAdIds.length === filteredAds.length && filteredAds.length > 0) {
      setSelectedAdIds([]);
    } else {
      setSelectedAdIds(filteredAds.map(ad => ad.id));
    }
  };

  const handleToggleSelectAd = (id: string) => {
    setSelectedAdIds(prev => 
      prev.includes(id) 
        ? prev.filter(adId => adId !== id) 
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedAdIds.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/admin/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedAdIds }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `${selectedAdIds.length} ads deleted successfully` });
        setSelectedAdIds([]);
        fetchAds();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete ads' });
      }
    } catch (error) {
      console.error('Error bulk deleting ads:', error);
      setMessage({ type: 'error', text: 'Failed to delete ads' });
    } finally {
      setShowBulkDeleteModal(false);
      setLoadingData(false);
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'paused') => {
    if (selectedAdIds.length === 0) return;
    
    try {
      setLoadingData(true);
      const response = await fetch('/api/admin/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedAdIds, status }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `${selectedAdIds.length} ads updated successfully` });
        fetchAds();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update ads' });
      }
    } catch (error) {
      console.error('Error bulk updating ads:', error);
      setMessage({ type: 'error', text: 'Failed to update ads' });
    } finally {
      setLoadingData(false);
    }
  };

  const filteredAds = ads.filter(ad => {
    if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(total / limit);

  if (loading || loadingData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#64748b' }}>Loading ads...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>Ad Management</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Manage advertisements and track performance metrics
          </p>
        </div>
        <button
          onClick={handleCreateAd}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Plus size={20} />
          Create New Ad
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

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search ads by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white',
              }}
            >
              <option value="all">All Types</option>
              <option value="banner">Banner</option>
              <option value="sidebar">Sidebar</option>
              <option value="inline">Inline</option>
              <option value="popup">Popup</option>
              <option value="native">Native</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white',
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            
            <button
              style={{
                padding: '0.75rem 1rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Filter size={16} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAdIds.length > 0 && (
        <div style={{
          background: '#eff6ff',
          borderRadius: '0.75rem',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #bfdbfe',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
              {selectedAdIds.length} ads selected
            </span>
            <div style={{ width: '1px', height: '1.5rem', background: '#bfdbfe' }}></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleBulkStatusChange('active')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#16a34a',
                  border: '1px solid #bcf0da',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                ▶️ Activate
              </button>
              <button
                onClick={() => handleBulkStatusChange('paused')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                ⏸️ Pause
              </button>
            </div>
          </div>
          <button
            onClick={handleBulkDelete}
            style={{
              padding: '0.5rem 1.25rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: '#dbeafe', borderRadius: '0.5rem' }}>
              <DollarSign size={20} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Ads</div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e293b' }}>{total}</div>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '0.5rem' }}>
              <Eye size={20} color="#16a34a" />
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Active Ads</div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#16a34a' }}>
            {ads.filter(ad => ad.is_active).length}
          </div>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
              <BarChart3 size={20} color="#d97706" />
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Avg CTR</div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#d97706' }}>
            {ads.length > 0 
              ? (ads.reduce((sum, ad) => sum + parseFloat(ad.stats.ctr), 0) / ads.length).toFixed(2) + '%'
              : '0%'
            }
          </div>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: '#f3e8ff', borderRadius: '0.5rem' }}>
              <Calendar size={20} color="#9333ea" />
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Expiring Soon</div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#9333ea' }}>
            {ads.filter(ad => {
              if (!ad.end_date) return false;
              const endDate = new Date(ad.end_date);
              const today = new Date();
              const diffTime = endDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays > 0;
            }).length}
          </div>
        </div>
      </div>

      {/* Ads Table */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedAdIds.length === filteredAds.length && filteredAds.length > 0}
                    onChange={handleToggleSelectAll}
                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Ad</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Type & Position</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Performance</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Dates</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No ads found</div>
                    <div style={{ fontSize: '0.875rem' }}>Create your first ad to get started</div>
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr key={ad.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedAdIds.includes(ad.id) ? '#f8faff' : 'transparent' }}>
                    <td style={{ padding: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedAdIds.includes(ad.id)}
                        onChange={() => handleToggleSelectAd(ad.id)}
                        style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: '#3b82f6' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {ad.image_url ? (
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '0.375rem',
                            overflow: 'hidden',
                            background: '#f1f5f9',
                          }}>
                            <img
                              src={ad.image_url}
                              alt={ad.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '0.375rem',
                            background: '#e0f2fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <DollarSign size={24} color="#0ea5e9" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>{ad.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {ad.target_url ? new URL(ad.target_url).hostname : 'No URL'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{ad.ad_type}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{ad.position}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: ad.is_active ? '#d1fae5' : '#fef3c7',
                        color: ad.is_active ? '#065f46' : '#92400e',
                      }}>
                        {ad.is_active ? 'Active' : 'Paused'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Clicks:</div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>{ad.stats.total_clicks}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Impressions:</div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>{ad.stats.total_impressions}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CTR:</div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>{ad.stats.ctr}%</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Start: {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : 'Not set'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          End: {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : 'Not set'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditAd(ad)}
                          style={{
                            padding: '0.5rem',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                          }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleAdStatus(ad)}
                          style={{
                            padding: '0.5rem',
                            background: ad.is_active ? '#fef3c7' : '#d1fae5',
                            color: ad.is_active ? '#92400e' : '#065f46',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                          }}
                          title={ad.is_active ? 'Pause' : 'Activate'}
                        >
                          {ad.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad)}
                          style={{
                            padding: '0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} ads
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === 1 ? '#f1f5f9' : 'white',
                color: currentPage === 1 ? '#94a3b8' : '#475569',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: currentPage === pageNum ? '#3b82f6' : 'white',
                      color: currentPage === pageNum ? 'white' : '#475569',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontWeight: currentPage === pageNum ? '600' : '400',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === totalPages ? '#f1f5f9' : 'white',
                color: currentPage === totalPages ? '#94a3b8' : '#475569',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>Bulk Delete Ads</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Are you sure you want to delete {selectedAdIds.length} selected ads? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowBulkDeleteModal(false)}
                style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmBulkDelete}
                style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAd && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>Delete Ad</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Are you sure you want to delete "{selectedAd.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => { setShowDeleteModal(false); setSelectedAd(null); }}
                style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Ad Modal */}
      {showCreateModal && (
        <CreateAdModal
          ad={selectedAd}
          onClose={() => { setShowCreateModal(false); setSelectedAd(null); }}
          onSaved={() => { setShowCreateModal(false); setSelectedAd(null); fetchAds(); setMessage({ type: 'success', text: selectedAd ? 'Ad updated!' : 'Ad created!' }); }}
        />
      )}
    </div>
  );
}

/* ── Create / Edit modal ── */
function CreateAdModal({ ad, onClose, onSaved }: { ad: Ad | null; onClose: () => void; onSaved: () => void; }) {
  const isEdit = !!ad;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: ad?.name || '',
    type: ad?.ad_type || 'adsense',
    placement: ad?.position || 'before_content',
    code: ad?.content || '',
    status: ad?.is_active ? 'active' : 'paused',
    start_date: ad?.start_date ? ad.start_date.slice(0, 10) : '',
    end_date: ad?.end_date ? ad.end_date.slice(0, 10) : '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) { setError('Name and Ad Code are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name,
        type: form.type,
        placement: form.placement,
        code: form.code,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      let res;
      if (isEdit && ad) {
        res = await fetch(`/api/admin/ads/${ad.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/admin/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (data.success) { onSaved(); } else { setError(data.message || data.error || 'Failed to save ad.'); }
    } catch (err) { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #d1d5db',
    borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '0.875rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Modal Header */}
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            {isEdit ? 'Edit Ad' : 'Create New Ad'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}

          {/* Ad Name */}
          <div>
            <label style={labelStyle}>Ad Name *</label>
            <input style={inputStyle} type="text" placeholder="e.g. Homepage Banner AdSense" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          {/* Type + Placement row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Ad Network / Type *</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="adsense">Google AdSense</option>
                <option value="custom">Custom HTML</option>
                <option value="script">JavaScript Script</option>
                <option value="banner">Banner Image</option>
                <option value="native">Native Ad</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Placement / Position *</label>
              <select style={inputStyle} value={form.placement} onChange={e => set('placement', e.target.value)}>
                <option value="before_content">Before Content</option>
                <option value="after_content">After Content</option>
                <option value="below_search">Below Hero Search</option>
                <option value="result_left">Result Page Left</option>
                <option value="result_right">Result Page Right</option>
                <option value="homepage_after_features">Home After Features</option>
                <option value="homepage_after_blog">Home After Blog</option>
                <option value="sidebar">Sidebar</option>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="between_blocks">Between Blocks</option>
                <option value="after_p1">After Paragraph 1</option>
                <option value="after_p3">After Paragraph 3</option>
                <option value="after_p5">After Paragraph 5</option>
              </select>
            </div>
          </div>

          {/* Ad Code */}
          <div>
            <label style={labelStyle}>Ad Code / Script *</label>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem', marginTop: 0 }}>
              Paste your AdSense code, custom HTML, or ad network script here.
            </p>
            <textarea
              style={{ ...inputStyle, minHeight: '140px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
              placeholder={`<!-- Google AdSense Example -->\n<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"\n  data-ad-slot="XXXXXXXXXX"\n  data-ad-format="auto"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
              value={form.code}
              onChange={e => set('code', e.target.value)}
              required
            />
          </div>

          {/* Status + Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input style={inputStyle} type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>

          {/* Tip box */}
          <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: '0.8rem', color: '#1d4ed8', margin: 0, fontWeight: '600', marginBottom: '0.25rem' }}>💡 Supported Ad Networks</p>
            <p style={{ fontSize: '0.75rem', color: '#3b82f6', margin: 0 }}>
              Google AdSense · Media.net · Ezoic · PropellerAds · Adsterra · Any custom HTML/JS ad code
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '0.75rem 1.75rem', background: saving ? '#93c5fd' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
              {saving ? 'Saving…' : isEdit ? 'Update Ad' : 'Create Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}