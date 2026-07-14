'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './MediaModal.module.css';

interface Post {
  id: string;
  thumbUrl: string;
  likes: number;
  comments: number;
  isVideo: boolean;
  isReel?: boolean;
  isSidecar: boolean;
  mediaUrl?: string;
  caption?: string;
  timestamp?: string;
}

interface MediaModalProps {
  post: Post;
  onClose: () => void;
}

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
};

const renderCaption = (text: string) => {
  if (!text) return null;
  return text.split(/(\s+)/).map((part, i) => {
    if (part.startsWith('#') || part.startsWith('@')) {
      return <span key={i} style={{ color: '#a855f7', fontWeight: 600 }}>{part}</span>;
    }
    return part;
  });
};

const formatDate = (ts?: string) => {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return null;
  }
};

export default function MediaModal({ post, onClose }: MediaModalProps) {
  const [videoError, setVideoError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDownload = async () => {
    const url = post.mediaUrl || post.thumbUrl;
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = post.isVideo || post.isReel ? 'mp4' : 'jpg';
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pvstoryviewer-${post.id}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(post.mediaUrl || post.thumbUrl, '_blank');
    }
  };

  const mediaLabel = post.isReel ? 'Reel' : post.isVideo ? 'Video' : post.isSidecar ? 'Carousel' : 'Post';
  const showVideo = (post.isVideo || post.isReel) && post.mediaUrl && !videoError;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>✕</button>
      
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.mediaArea}>
          {showVideo ? (
            <video
              src={post.mediaUrl}
              className={styles.media}
              autoPlay
              controls
              playsInline
              onError={() => setVideoError(true)}
            />
          ) : (
            <div className={styles.imageWrap}>
              <Image
                src={post.thumbUrl || post.mediaUrl || ''}
                alt={post.caption ? post.caption.slice(0, 60) : 'post'}
                fill
                className={styles.media}
                unoptimized
              />
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          {/* Media type badge */}
          <div className={styles.mediaTypeBadge}>
            {post.isReel && <span className={styles.reelBadge}>🎬 Reel</span>}
            {post.isVideo && !post.isReel && <span className={styles.videoBadge}>▶ Video</span>}
            {post.isSidecar && <span className={styles.carouselBadge}>⊞ Carousel</span>}
            {!post.isVideo && !post.isSidecar && <span className={styles.photoBadge}>📷 Photo</span>}
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <div className={styles.statInfo}>
                <span className={styles.val}>{formatCount(post.likes)}</span>
                <span className={styles.lbl}>Likes</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <div className={styles.statInfo}>
                <span className={styles.val}>{formatCount(post.comments)}</span>
                <span className={styles.lbl}>Comments</span>
              </div>
            </div>
          </div>

          {post.timestamp && (
            <div className={styles.dateSection}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{formatDate(post.timestamp)}</span>
            </div>
          )}

          {post.caption && (
            <div className={styles.captionSection}>
              <h3 className={styles.captionTitle}>Caption</h3>
              <div className={styles.captionText}>{renderCaption(post.caption)}</div>
            </div>
          )}

          <div className={styles.downloadSection}>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download {mediaLabel}
            </button>

            <a
              href={`https://www.instagram.com/p/${post.id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewOnIgBtn}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View on Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
