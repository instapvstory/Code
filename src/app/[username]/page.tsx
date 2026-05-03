'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import SkeletonLoader from '@/components/viewer/SkeletonLoader/SkeletonLoader';
import ProfileView from '@/components/viewer/ProfileView/ProfileView';
import type { Profile, MainTab } from '@/components/viewer/ProfileView/ProfileView';
import MiniProfile from '@/components/viewer/MiniProfile/MiniProfile';
import PostsGrid from '@/components/viewer/PostsGrid/PostsGrid';
import UserList, { UserItem } from '@/components/viewer/UserList';

import Hero from '@/components/layout/Hero/Hero';
import MarketingSections from '@/components/layout/MarketingSections/MarketingSections';
import AdSlot from '@/components/ads/AdSlot';


/* ──────────────────────────────────────── */
const generateMockUsers = (count: number): UserItem[] => {
  const firstNames = ['alex', 'sarah', 'mike', 'emma', 'david', 'lisa', 'tom', 'anna', 'john', 'maria'];
  const lastNames = ['smith', 'jones', 'brown', 'davis', 'wilson', 'taylor', 'clark', 'white', 'moore', 'king'];
  
  return Array.from({ length: count }, (_, i) => {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const num = Math.floor(Math.random() * 9999);
    const username = `${fn}${ln}${num}`;
    const fullName = `${fn.charAt(0).toUpperCase()}${fn.slice(1)} ${ln.charAt(0).toUpperCase()}${ln.slice(1)}`;
    
    return {
      id: `u-${i}-${Math.random()}`,
      username,
      fullName,
      profilePicUrl: `https://ui-avatars.com/api/?name=${fn}+${ln}&size=60&background=random&rounded=true`,
      isPrivate: Math.random() > 0.5,
      isVerified: Math.random() > 0.8,
    };
  });
};
export default function UsernamePage() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';

  console.log('UsernamePage rendered with username:', username);
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('profile');
  
  const [error, setError] = useState<string | null>(null);
  
  // Ref for auto scroll
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (username) {
      const timer = setTimeout(() => {
        if (sectionRef.current) {
          const y = sectionRef.current.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50); // Small delay to let React mount the new route elements
      
      return () => clearTimeout(timer);
    }
  }, [username]);

  useEffect(() => {
    console.log('useEffect triggered for username:', username);
    
    async function loadData() {
      console.log('loadData called for username:', username);
      setLoading(true);
      setError(null);
      setProfile(null);

      console.log('Fetching profile for:', username);
      try {
        // Fetch directly from our API endpoint
        const apiUrl = `/api/profiles/${encodeURIComponent(username)}`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API returned ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', {
          username: result.data?.username,
          posts: result.data?.posts,
          followers: result.data?.followers,
          following: result.data?.following,
          source: result.source,
          cached: result.cached,
        });
        
        if (result.data) {
          // Transform the API response to match the Profile interface
          const profile: Profile = {
            username: result.data.username,
            fullName: result.data.fullName || '',
            bio: result.data.bio || '',
            website: result.data.website,
            category: result.data.category,
            isVerified: result.data.isVerified || false,
            isBusinessAccount: result.data.isBusinessAccount || false,
            profilePicUrl: result.data.profilePicUrl || '',
            posts: result.data.posts || 0,
            followers: result.data.followers || 0,
            following: result.data.following || 0,
            hasStory: result.data.hasStory || false,
            highlights: result.data.highlights?.map((h: any) => ({
              id: h.id || h.instagramId,
              title: h.title || 'Highlight',
              coverUrl: h.coverUrl || h.mediaUrl || '',
              caption: h.caption,
              mediaUrl: h.mediaUrl,
              mediaCount: h.mediaCount || 1,
              createdAt: h.createdAt,
            })) || [],
            postsList: result.data.postsList?.map((p: any) => ({
              id: p.id || p.instagramId,
              thumbUrl: p.thumbUrl || p.mediaUrl || '',
              mediaUrl: p.mediaUrl || '',
              likes: p.likes || 0,
              comments: p.comments || 0,
              isVideo: p.isVideo || false,
              isSidecar: p.isSidecar || false,
              caption: p.caption,
            })) || [],
            storiesList: result.data.storiesList?.map((s: any) => ({
              id: s.id || s.instagramId,
              thumbUrl: s.thumbUrl || s.mediaUrl || '',
              mediaUrl: s.mediaUrl || '',
              likes: 0,
              comments: 0,
              isVideo: s.isVideo || false,
              isSidecar: false,
              caption: s.caption,
            })) || [],
          };
          
          console.log('Profile data transformed:', {
            username: profile.username,
            posts: profile.posts,
            followers: profile.followers,
            following: profile.following,
            profilePicUrl: profile.profilePicUrl?.substring(0, 50) + '...',
            postsListLength: profile.postsList?.length,
            highlightsLength: profile.highlights?.length,
          });
          
          setProfile(profile);
          console.log('Profile state set with data');
        } else {
          console.log('No data in API response');
          setError('No profile data received');
        }
      } catch (err: any) {
        console.error('Exception in loadData:', err);
        setError(err.message || 'Failed to load profile');
      }
      
      setLoading(false);
      console.log('Loading set to false');
    }

    if (username) {
      console.log('Username is valid, calling loadData');
      loadData();
    } else {
      console.log('Username is empty or invalid');
      setLoading(false);
    }
  }, [username]);

  const renderTabContent = () => {
    if (!profile) return null;
    
    if (activeTab === 'profile') {
      return (
        <ProfileView
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      );
    }
    
    const statMap: Record<string, { label: string; val: number }> = {
      posts: { label: 'Posts', val: profile.posts },
      followers: { label: 'Followers', val: profile.followers },
      follows: { label: 'Follows', val: profile.following }
    };

    return (
      <div className={styles.tabContentWrap}>
        <MiniProfile 
          profile={profile} 
          statLabel={statMap[activeTab].label} 
          statValue={statMap[activeTab].val} 
        />
        
        {activeTab === 'posts' && <PostsGrid posts={profile.postsList} username={profile.username} />}
        {activeTab === 'followers' && (
          <UserList title={`Last 49 Followers (most recent order) :`} users={generateMockUsers(49)} />
        )}
        {activeTab === 'follows' && (
          <UserList title={`Last 49 Follows (most recent order) :`} users={generateMockUsers(49)} />
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <Hero />

      {/* ── Tab Bar ── */}
      <div className={styles.mainTabBar} ref={sectionRef}>
        <div className={styles.mainTabsInner}>
          {(['profile', 'posts', 'followers', 'follows'] as MainTab[]).map(tab => (
            <button
              key={tab}
              className={`${styles.mainTab} ${activeTab === tab ? styles.mainTabActive : ''}`}
              onClick={() => setActiveTab(tab)}
              disabled={loading}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3-column layout: Left Ad | Content | Right Ad ── */}
      <div className={styles.threeCol}>

        {/* Left Ad */}
        <div className={styles.sideAdCol}>
          <AdSlot placement="result_left" style={{ width: 160 }} />
        </div>

        {/* Main Content */}
        <div className={styles.contentContainer}>
          {loading ? (
            <SkeletonLoader />
          ) : profile ? (
            <>
              {!profile.isBusinessAccount && (
                <div className={styles.personalNote}>
                  <strong>Note:</strong> This is a Personal account. Due to Instagram API restrictions, some data like stories and the full posts list may not be available.
                </div>
              )}
              {renderTabContent()}
            </>
          ) : (
            <div className={styles.error}>{error || 'User not found or not a business account.'}</div>
          )}
        </div>

        {/* Right Ad */}
        <div className={styles.sideAdCol}>
          <AdSlot placement="result_right" style={{ width: 160 }} />
        </div>
      </div>

      <MarketingSections />
    </div>
  );
}

