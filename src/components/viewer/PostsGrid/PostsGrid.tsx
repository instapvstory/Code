'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import styles from './PostsGrid.module.css';

// Lazy-load the modal — not needed on initial paint
const MediaModal = dynamic(() => import('../MediaModal/MediaModal'), { ssr: false });

interface Post {
  id: string;
  thumbUrl: string;
  likes: number;
  comments: number;
  isVideo: boolean;
  isSidecar: boolean;
  isReel?: boolean;
  mediaUrl?: string;
  caption?: string;
  timestamp?: string;
}

type PostTab = 'posts' | 'reels' | 'tagged';

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
};

const PostsGrid = ({ posts, username, isStoryView = false }: { posts: Post[]; username?: string; isStoryView?: boolean }) => {
  const [tab, setTab] = useState<PostTab>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // "Posts" = photos + carousels (not reels)
  // "Reels" = videos with isReel flag OR any video if no isReel info
  const allPosts = posts.filter(p => !p.isReel && !p.isVideo);
  const allReels = posts.filter(p => p.isReel || (p.isVideo && !p.isSidecar));
  // Also include carousel (sidecar) + non-reel videos in Posts tab
  const allFeedPosts = posts.filter(p => !p.isReel);

  const tabs: { key: PostTab; icon: string; label: string; count: number }[] = [
    { key: 'posts', icon: '⊞', label: 'Posts', count: allFeedPosts.length },
    { key: 'reels', icon: '▶', label: 'Reels', count: allReels.length },
    { key: 'tagged', icon: '🏷', label: 'Tagged', count: 0 },
  ];

  const filteredPosts = tab === 'posts' ? allFeedPosts
    : tab === 'reels' ? allReels
    : [];

  return (
    <div className={styles.wrapper}>
      {/* Sub-tabs - hidden in story view */}
      {!isStoryView && (
        <div className={styles.subTabs}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.subTab} ${tab === t.key ? styles.subTabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span>{t.icon}</span>
            {t.label}{t.count > 0 ? ` (${t.count})` : ''}
          </button>
        ))}
        <div className={styles.viewToggle}>
          <a
            href={`https://instagram.com/${username || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewBtn}
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Full
          </a>
        </div>
        </div>
      )}

      <div className={styles.gridContainer}>
        {filteredPosts.length === 0 ? (
          <div className={styles.noPosts}>No {isStoryView ? 'stories' : tab} found.</div>
        ) : (
          <div className={isStoryView ? styles.storyGrid : styles.grid}>
        {filteredPosts.map(post => (
          <div 
            key={post.id} 
            className={styles.postCard} 
            onClick={() => setSelectedPost(post)}
            onMouseEnter={(e) => {
              const video = e.currentTarget.querySelector('video');
              if (video) video.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              const video = e.currentTarget.querySelector('video');
              if (video) {
                video.pause();
                video.currentTime = 0;
              }
            }}
          >
            {/* Image / Video area */}
            <div className={styles.postImageWrap}>
              {/* Always show thumbnail image — videos play in the modal */}
              {post.thumbUrl ? (
                <Image
                  src={post.thumbUrl}
                  alt={post.caption ? post.caption.slice(0, 60) : 'post'}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1200px) 25vw, 300px"
                  className={styles.postImage}
                  unoptimized={post.thumbUrl.startsWith('/api/proxy-image')}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#444"><rect width="24" height="24" rx="4"/><circle cx="12" cy="9" r="3" fill="#666"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" fill="#666"/></svg>
                </div>
              )}

              {/* Overlay: likes + comments count */}
              <div className={styles.postOverlay}>
                <span className={styles.overlayStat}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {formatCount(post.likes)}
                </span>
                <span className={styles.overlayStatSep}>·</span>
                <span className={styles.overlayStatComments}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {formatCount(post.comments)}
                </span>
              </div>

              {/* Type badge — top-right corner */}
              {post.isSidecar && (
                <div className={styles.badge}>
                  {/* Carousel / multi-image icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V6z"/>
                  </svg>
                </div>
              )}
              {post.isReel && (
                <div className={styles.badge} title="Reel">
                  {/* Reels film-strip icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M18 3v2h-2V3H8v2H6V3H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2h-2zM6 7h2v2H6V7zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm10-8h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM12 7a3 3 0 110 6 3 3 0 010-6z"/>
                  </svg>
                </div>
              )}
              {post.isVideo && !post.isReel && !post.isSidecar && (
                <div className={styles.badge} title="Video">
                  {/* Play icon for regular videos */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
        </div>
        )}
      </div>
    
      {/* Media Modal */}
      {selectedPost && (
        <MediaModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};

export default PostsGrid;
export type { Post };
