'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './Hero.module.css';

// Lazy-load AdSlot after page is interactive — never blocks FCP/TTI
const AdSlot = dynamic(() => import('@/components/ads/AdSlot'), { ssr: false });

export default function Hero() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pvstory_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = parsed.map((item: any) => 
          typeof item === 'string' ? { username: item, name: '', pic: '' } : item
        );
        setHistory(normalized);
      } catch (e) {}
    }
    // Delay ad mount until after page is interactive (2s idle window)
    const id = setTimeout(() => setAdReady(true), 2000);
    return () => clearTimeout(id);
  }, []);

  const handleSubmit = (value?: string) => {
    const username = (value ?? query).trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    if (!username) return;

    // Trigger ad redirect on first submit of the session
    if (typeof window !== 'undefined') {
      const hasClicked = sessionStorage.getItem('pvstory_search_ad_clicked');
      if (!hasClicked) {
        sessionStorage.setItem('pvstory_search_ad_clicked', 'true');
        window.open('https://www.effectivecpmnetwork.com/a8hzkht0t?key=8e8f1f7c68aa8d3862601bcc04cd0d59', '_blank');
      }
    }
    
    // Create new basic history item, filter out old occurrences (matching string or object)
    const newItem = { username, name: '', pic: '' };
    const filtered = history.filter(h => {
      const hName = typeof h === 'object' ? h.username : h;
      return hName !== username;
    });
    
    const updated = [newItem, ...filtered].slice(0, 6);
    localStorage.setItem('pvstory_history', JSON.stringify(updated));
    setHistory(updated);
    router.push(`/${username}`);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') setShowHistory(false);
  };

  const clearHistory = () => {
    localStorage.removeItem('pvstory_history');
    setHistory([]);
    setShowHistory(false);
  };

  return (
    <div className={styles.heroWrap}>
      <div className={styles.heroBg} />

      <div className={styles.heroContainer}>
        {/* Left Sidebar Ad */}
        <div className={styles.heroAdLeft}>
          {adReady && (
            <AdSlot
              placement="hero_left"
              style={{ width: 160, minHeight: 600 }}
            />
          )}
        </div>

        {/* Center Content */}
        <div className={styles.heroContent}>
          {/* Main Heading */}
          <h1 className={styles.heroTitle}>
            <span className={styles.highlight}>Story</span> and <span className={styles.highlight}>followers</span> viewer
          </h1>

          {/* Welcome Banner */}
          <div className={styles.welcomeBanner}>
            <p className={styles.welcomeText}>👋 Welcome to PvStoryViewer!</p>
            <p className={styles.welcomeSub}>View public stories, posts and followers anonymously.</p>
          </div>

          {/* Search & History Section */}
          <div className={styles.searchSection}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox} onClick={() => inputRef.current?.focus()}>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="username or profile link"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 150)}
                  autoComplete="off"
                />
              </div>
              <div className={styles.submitSection}>
                <button className={styles.submitBtn} onClick={() => handleSubmit()}>
                  Submit
                </button>
                <div className={styles.enterBadge}>Enter ↵</div>
              </div>
            </div>

            {/* History Bar */}
            <div className={`${styles.historyBar} ${showHistory && history.length > 0 ? styles.historyVisible : ''}`}>
              <div className={styles.historyLabel}>History</div>
              <div className={styles.historyChevron}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              
              {/* Hidden History List (Desktop only / Hover based) */}
              {showHistory && history.length > 0 && (
                <div className={styles.historyList}>
                  {history.map(item => {
                    const isObj = typeof item === 'object';
                    const username = isObj ? item.username : item;
                    const name = isObj && item.name ? item.name : username;
                    const pic = isObj && item.pic ? item.pic : `https://ui-avatars.com/api/?name=${username}&size=36&background=374151&color=fff`;

                    return (
                      <button key={username} className={styles.historyItem} onMouseDown={() => handleSubmit(username)}>
                        <img src={pic} alt={username} className={styles.historyItemPic} />
                        <div className={styles.historyItemInfo}>
                          <span className={styles.historyItemName}>{name}</span>
                          <span className={styles.historyItemUsername}>@{username}</span>
                        </div>
                      </button>
                    );
                  })}
                  <button className={styles.clearHistoryBtn} onMouseDown={clearHistory}>Clear History</button>
                </div>
              )}
            </div>
          </div>

          {/* Ad below search */}
          {adReady && (
            <AdSlot
              placement="below_search"
              className={styles.belowSearchAd}
              style={{ margin: '12px auto 0' }}
            />
          )}
        </div>

        {/* Right Sidebar Ad */}
        <div className={styles.heroAdRight}>
          {adReady && (
            <AdSlot
              placement="hero_right"
              style={{ width: 160, minHeight: 600 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
