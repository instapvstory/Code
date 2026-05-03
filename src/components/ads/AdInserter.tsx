'use client';

import { useEffect, useState } from 'react';

interface AdInserterProps {
  placement: string;
  categoryId?: string;
  tagIds?: string[];
  device?: 'all' | 'desktop' | 'mobile' | 'tablet';
  className?: string;
  fallbackContent?: React.ReactNode;
}

interface AdData {
  id: string;
  name: string;
  type: 'adsense' | 'custom' | 'html' | 'script';
  placement: string;
  code: string;
  status: 'active' | 'inactive' | 'testing';
  target_devices: string;
  target_categories: string[];
  target_tags: string[];
  priority: number;
}

export default function AdInserter({
  placement,
  categoryId,
  tagIds = [],
  device = 'all',
  className = '',
  fallbackContent = null
}: AdInserterProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAd() {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          placement,
          device,
          status: 'active',
          limit: '1'
        });

        if (categoryId) {
          params.append('category', categoryId);
        }

        if (tagIds.length > 0) {
          params.append('tags', tagIds.join(','));
        }

        const response = await fetch(`/api/ads?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ad: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          setAd(data.data[0]);
        } else {
          setAd(null);
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAd(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAd();
  }, [placement, categoryId, tagIds.join(','), device]);

  // Track ad view
  useEffect(() => {
    if (ad?.id) {
      // Track ad view asynchronously
      fetch(`/api/ads`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adId: ad.id })
      }).catch(console.error);
    }
  }, [ad?.id]);

  if (loading) {
    return (
      <div className={`ad-inserter loading ${className}`}>
        <div className="ad-placeholder">
          <div className="ad-loading-spinner"></div>
          <span className="ad-loading-text">Loading ad...</span>
        </div>
        <style jsx>{`
          .ad-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100px;
            background: #f8fafc;
            border: 1px dashed #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          .ad-loading-spinner {
            width: 24px;
            height: 24px;
            border: 2px solid #e2e8f0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 8px;
          }
          .ad-loading-text {
            font-size: 12px;
            color: #64748b;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    console.warn(`Ad inserter error for placement "${placement}":`, error);
  }

  if (!ad) {
    return fallbackContent ? <>{fallbackContent}</> : null;
  }

  // Render ad based on type
  const renderAd = () => {
    switch (ad.type) {
      case 'adsense':
        return (
          <div className="ad-unit adsense">
            <div dangerouslySetInnerHTML={{ __html: ad.code }} />
            <div className="ad-label">Advertisement</div>
          </div>
        );

      case 'custom':
      case 'html':
        return (
          <div className="ad-unit custom">
            <div dangerouslySetInnerHTML={{ __html: ad.code }} />
          </div>
        );

      case 'script':
        return (
          <div className="ad-unit script">
            <div dangerouslySetInnerHTML={{ __html: ad.code }} />
          </div>
        );

      default:
        return (
          <div className="ad-unit unknown">
            <div className="ad-error">Unsupported ad type: {ad.type}</div>
          </div>
        );
    }
  };

  return (
    <div className={`ad-inserter ${className}`}>
      {renderAd()}
      <style jsx>{`
        .ad-inserter {
          margin: 20px 0;
          position: relative;
        }
        .ad-unit {
          position: relative;
          overflow: hidden;
        }
        .ad-unit.adsense {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .ad-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 8px;
          text-align: center;
        }
        .ad-unit.custom, .ad-unit.script {
          text-align: center;
        }
        .ad-error {
          padding: 20px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .ad-inserter {
            margin: 16px 0;
          }
          .ad-unit.adsense {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}