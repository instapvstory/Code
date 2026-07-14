'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import styles from './ProfileView.module.css';
import PostsGrid from '../PostsGrid/PostsGrid';

// Lazy-load the modal — it is never needed on initial paint
const MediaModal = dynamic(() => import('../MediaModal/MediaModal'), { ssr: false });

interface Profile {
  username: string;
  fullName: string;
  bio: string;
  website?: string;
  category?: string;
  isVerified: boolean;
  isBusinessAccount: boolean;
  profilePicUrl: string;
  posts: number;
  followers: number;
  following: number;
  hasStory: boolean;
  highlights: Highlight[];
  postsList: Post[];
  storiesList: Post[];
  // Metadata for placeholder data
  storiesArePlaceholder?: boolean;
  highlightsArePlaceholder?: boolean;
}

interface Highlight {
  id: string;
  title: string;
  coverUrl: string;
  caption?: string;
  mediaUrl?: string;
  mediaCount?: number;
  createdAt?: string;
}

interface Post {
  id: string;
  thumbUrl: string;
  likes: number;
  comments: number;
  isVideo: boolean;
  isSidecar: boolean;
  mediaUrl?: string;
  caption?: string;
  isReel?: boolean;
  timestamp?: string;
}

const formatCount = (n: number): string => {
  return n.toLocaleString();
};

type ContentTab = 'story' | 'highlights';
type MainTab = 'profile' | 'posts' | 'followers' | 'follows';

interface ProfileViewProps {
  profile: Profile;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const ProfileView = ({ profile, activeTab, onTabChange }: ProfileViewProps) => {
  const [contentTab, setContentTab] = useState<ContentTab>('story');
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  const highlightToPost = (h: Highlight): Post => ({
    id: h.id,
    thumbUrl: h.coverUrl,
    likes: 0,
    comments: 0,
    isVideo: h.mediaUrl ? /\.(mp4|mov|avi|webm|mkv)$/i.test(h.mediaUrl) : false,
    isSidecar: false,
    mediaUrl: h.mediaUrl || h.coverUrl,
    caption: h.caption,
  });

  const handleHighlightClick = (h: Highlight) => {
    setSelectedHighlight(h);
  };

  const closeModal = () => {
    setSelectedHighlight(null);
  };

  return (
    <div className={styles.wrapper}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrap}>
          <div className={profile.hasStory ? styles.avatarRing : ''}>
            <Image
              src={profile.profilePicUrl}
              alt={profile.fullName}
              width={180}
              height={180}
              className={styles.avatar}
              priority
              unoptimized={profile.profilePicUrl.startsWith('/api/proxy-image')}
            />
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{formatCount(profile.posts)}</span>
            <span className={styles.statLabel}>Posts</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{formatCount(profile.followers)}</span>
            <span className={styles.statLabel}>Followers</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{formatCount(profile.following)}</span>
            <span className={styles.statLabel}>Follows</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className={styles.bioSection}>
        <div className={styles.usernameRow}>
          <span className={styles.username}>{profile.username}</span>
          <button className={styles.copyBtn} title="Copy username">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
        <div className={styles.fullName}>
          {profile.fullName}
          {profile.isVerified && (
            <svg className={styles.verified} width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
        </div>
        {profile.category && <div className={styles.category}>{profile.category}</div>}
        <p className={styles.bio}>{profile.bio}</p>

        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className={styles.website}>
            {profile.website}
            <button className={styles.copyBtn} title="Copy link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </a>
        )}
        {profile.isBusinessAccount && (
          <div className={styles.businessBadge}>
            Business Account <span>✓</span>
          </div>
        )}
        {selectedHighlight && (
          <MediaModal
            post={highlightToPost(selectedHighlight)}
            onClose={closeModal}
          />
        )}
      </div>

      {/* Story / Highlights tab */}
      <div className={styles.contentTabs}>
        <button
          className={`${styles.contentTab} ${contentTab === 'story' ? styles.contentTabActive : ''}`}
          onClick={() => setContentTab('story')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          Story
        </button>
        <button
          className={`${styles.contentTab} ${contentTab === 'highlights' ? styles.contentTabActive : ''}`}
          onClick={() => setContentTab('highlights')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
          </svg>
          Highlights
        </button>
      </div>

      {/* Content area */}
      {contentTab === 'story' ? (
        profile.storiesList && profile.storiesList.length > 0 ? (
          <PostsGrid posts={profile.storiesList} isStoryView={true} />
        ) : (
          <div className={styles.noContent}>This user has no story.</div>
        )
      ) : (
        <div className={styles.highlightsGrid}>
          {profile.highlights.length === 0 ? (
            <div className={styles.noContent}>No highlights available.</div>
          ) : (
            profile.highlights.map(h => (
              <div
                key={h.id}
                className={styles.highlightItem}
                onClick={() => handleHighlightClick(h)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleHighlightClick(h)}
              >
                <Image src={h.coverUrl} alt={h.title} width={70} height={70} className={styles.highlightCover} unoptimized={h.coverUrl.startsWith('/api/proxy-image')} />
                <div className={styles.highlightInfo}>
                  <span className={styles.highlightTitle}>{h.title}</span>
                  {h.mediaCount && h.mediaCount > 1 && (
                    <span className={styles.highlightCount}>{h.mediaCount} items</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
export type { Profile, MainTab, Highlight, Post };
