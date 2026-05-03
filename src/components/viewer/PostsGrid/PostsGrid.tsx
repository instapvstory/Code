'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './PostsGrid.module.css';
import MediaModal from '../MediaModal/MediaModal';

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

type PostTab = 'posts' | 'reels' | 'tagged' | 'reposts';

const formatCount = (n: number): string => {
  return n.toLocaleString();
};

const PostsGrid = ({ posts, username, isStoryView = false }: { posts: Post[]; username?: string; isStoryView?: boolean }) => {
  const [tab, setTab] = useState<PostTab>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const allPosts = posts.filter(p => !p.isVideo);
  const allReels = posts.filter(p => p.isVideo);

  const tabs: { key: PostTab; icon: string; label: string; count: number }[] = [
    { key: 'posts', icon: '⊞', label: 'Posts', count: allPosts.length },
    { key: 'reels', icon: '▶', label: 'Reels', count: allReels.length },
    { key: 'tagged', icon: '🏷', label: 'Tagged', count: 0 },
  ];

  const filteredPosts = tab === 'posts' ? allPosts
    : tab === 'reels' ? allReels
    : []; // tagged empty by default

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
              {post.isVideo && post.mediaUrl ? (
                <video
                  src={post.mediaUrl}
                  className={styles.postImage}
                  muted
                  loop
                  playsInline
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <Image
                  src={post.thumbUrl}
                  alt="post"
                  fill
                  className={styles.postImage}
                  unoptimized
                />
              )}
              {/* Type badge */}
              {post.isSidecar && (
                <div className={styles.badge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1h-2a1 1 0 01-1-1V6z"/>
                  </svg>
                </div>
              )}
              {post.isVideo && !post.isSidecar && (
                <div className={styles.badge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                  </svg>
                </div>
              )}
              {/* Hover overlay */}
              <div className={styles.overlay}>
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  {formatCount(post.likes)}
                </span>
                <span className={styles.stat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  {formatCount(post.comments)}
                </span>
              </div>
            </div>

            {/* Stats bar below the image */}
            <div className={styles.statsBar}>
              <span className={styles.statItem}>
                {/* Filled heart — same style as reference image */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#f43f5e">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {formatCount(post.likes)}
              </span>
              <span className={styles.statItem}>
                {/* Outlined speech bubble — same style as reference image */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {formatCount(post.comments)}
              </span>
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
