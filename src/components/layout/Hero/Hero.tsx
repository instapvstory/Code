'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './Hero.module.css';
import TurnstileModal from '@/components/TurnstileGate/TurnstileModal';

// Lazy-load AdSlot after page is interactive — never blocks FCP/TTI
const AdSlot = dynamic(() => import('@/components/ads/AdSlot'), { ssr: false });

export default function Hero() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pvstory_history');
    if (stored) setHistory(JSON.parse(stored));
    // Delay ad mount until after page is interactive (2s idle window)
    const id = setTimeout(() => setAdReady(true), 2000);
    return () => clearTimeout(id);
  }, []);

  const handleSubmit = (value?: string) => {
    const username = (value ?? query).trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    if (!username) return;

    if (sessionStorage.getItem('pvstory_cf_ok') === '1') {
      doRoute(username);
    } else {
      setPendingUsername(username);
      setShowCaptcha(true);
    }
  };

  const doRoute = (username: string) => {
    const updated = [username, ...history.filter(h => h !== username)].slice(0, 6);
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

      <div className={styles.heroContent}>
        {/* Main Heading */}
        <h1 className={styles.heroTitle}>
          <span className={styles.highlight}>Story</span> and <span className={styles.highlight}>followers</span> viewer
        </h1>

        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <p className={styles.welcomeText}>👋 Welcome to InstaPvStory!</p>
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
                {history.map(item => (
                  <button key={item} className={styles.historyItem} onMouseDown={() => handleSubmit(item)}>
                    @{item}
                  </button>
                ))}
                <button className={styles.clearHistoryBtn} onMouseDown={clearHistory}>Clear History</button>
              </div>
            )}
          </div>
        </div>

        {/* Ad below search - deferred until after page is interactive */}
        {adReady && (
          <AdSlot
            placement="below_search"
            style={{ width: '100%', maxWidth: 728, margin: '12px auto 0' }}
          />
        )}
      </div>

      <TurnstileModal
        isOpen={showCaptcha}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onClose={() => setShowCaptcha(false)}
        onSuccess={() => {
          setShowCaptcha(false);
          if (pendingUsername) doRoute(pendingUsername);
        }}
      />
    </div>
  );
}
