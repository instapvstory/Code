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
                  sizes="(max-width: 640px) 33vw, (max-width: 1200px) 25vw, 300px"
                  className={styles.postImage}
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
