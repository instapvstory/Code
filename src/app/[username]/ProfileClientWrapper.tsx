'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import ProfileView from '@/components/viewer/ProfileView/ProfileView';
import type { Profile, MainTab } from '@/components/viewer/ProfileView/ProfileView';
import MiniProfile from '@/components/viewer/MiniProfile/MiniProfile';
import PostsGrid from '@/components/viewer/PostsGrid/PostsGrid';
import UserList, { UserItem } from '@/components/viewer/UserList';

// Lazy-load AdSlot — side ads should never block profile content
const AdSlot = dynamic(() => import('@/components/ads/AdSlot'), { ssr: false });

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

interface Props {
  profile: Profile;
}

export default function ProfileClientWrapper({ profile }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>('profile');
  const sectionRef = useRef<HTMLDivElement>(null);

  // Focus effect for when route changes and history update
  useEffect(() => {
    // 1. Scroll into view
    const timer = setTimeout(() => {
      if (sectionRef.current) {
        const y = sectionRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);

    // 2. Update search history with rich profile data
    try {
      const stored = localStorage.getItem('pvstory_history');
      let history = stored ? JSON.parse(stored) : [];
      
      const newItem = {
        username: profile.username,
        name: profile.fullName || profile.username,
        pic: profile.profilePicUrl
      };
      
      const filtered = history.filter((h: any) => {
        const hName = typeof h === 'object' ? h.username : h;
        return hName !== profile.username;
      });
      
      const updated = [newItem, ...filtered].slice(0, 6);
      localStorage.setItem('pvstory_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save history', e);
    }

    return () => clearTimeout(timer);
  }, [profile.username, profile.fullName, profile.profilePicUrl]);

  const renderTabContent = () => {
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
    <>
      {/* ── Tab Bar ── */}
      <div className={styles.mainTabBar} ref={sectionRef}>
        <div className={styles.mainTabsInner}>
          {(['profile', 'posts', 'followers', 'follows'] as MainTab[]).map(tab => (
            <button
              key={tab}
              className={`${styles.mainTab} ${activeTab === tab ? styles.mainTabActive : ''}`}
              onClick={() => setActiveTab(tab)}
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
          <AdSlot placement="hero_left" className={styles.sideAd} />
        </div>

        {/* Main Content */}
        <div className={styles.contentContainer}>
          {!profile.isBusinessAccount && (
            <div className={styles.personalNote}>
              <strong>Note:</strong> This is a Personal account. Due to Instagram API restrictions, some data like stories and the full posts list may not be available.
            </div>
          )}
          {renderTabContent()}
        </div>

        {/* Right Ad */}
        <div className={styles.sideAdCol}>
          <AdSlot placement="hero_right" className={styles.sideAd} />
        </div>
      </div>
    </>
  );
}
