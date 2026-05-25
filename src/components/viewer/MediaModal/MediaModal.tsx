'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import styles from './MediaModal.module.css';

interface Post {
  id: string;
  thumbUrl: string;
  likes: number;
  comments: number;
  isVideo: boolean;
  isSidecar: boolean;
  mediaUrl?: string;
  caption?: string;
}

interface MediaModalProps {
  post: Post;
  onClose: () => void;
}

const formatCount = (n: number): string => {
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

export default function MediaModal({ post, onClose }: MediaModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleDownload = async () => {
    const url = post.mediaUrl || post.thumbUrl;
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pvstoryviewer-${post.id}.${post.isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if blob fetch fails (e.g. CORS)
      window.open(url, '_blank');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>✕</button>
      
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.mediaArea}>
          {post.isVideo && post.mediaUrl ? (
            <video
              src={post.mediaUrl}
              className={styles.media}
              autoPlay
              controls
              playsInline
            />
          ) : (
            <div className={styles.imageWrap}>
              <Image
                src={post.mediaUrl || post.thumbUrl}
                alt="post"
                fill
                className={styles.media}
                unoptimized
              />
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
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
              Download {post.isVideo ? 'Reel' : 'Post'}
            </button>
          </div>
          
          <div className={styles.footer}>
            <p>ID: {post.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
