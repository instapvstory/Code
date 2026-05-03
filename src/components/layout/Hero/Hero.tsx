'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Hero.module.css';
import AdSlot from '@/components/ads/AdSlot';

export default function Hero() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pvstory_history');
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const handleSubmit = (value?: string) => {
    const username = (value ?? query).trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    if (!username) return;
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
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <p className={styles.welcomeText}>👋 Welcome to InstaPvStory!</p>
          <p className={styles.welcomeSub}>View public stories, posts and followers anonymously.</p>
        </div>

        {/* Search Container */}
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
            <button className={styles.submitBtn} onClick={() => handleSubmit()}>
              Submit
            </button>
          </div>
        </div>

        {/* Ad below search */}
        <AdSlot
          placement="below_search"
          style={{ width: '100%', maxWidth: 728, margin: '12px auto 0' }}
        />

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
    </div>

  );
}
