import Header from '@/components/layout/Header/Header';

import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import styles from './features.module.css';

export const metadata = {
  title: 'Core Features - PvStoryViewer',
  description: 'Explore the powerful features of PvStoryViewer, from anonymous story viewing to high-quality content discovery.',
};

const features = [
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>,
    title: '100% Anonymous',
    desc: 'Browse any public Instagram profile without ever logging in. Your identity stays completely hidden — no traces, no footprints left on the viewer list.',
    color: '#7c3aed',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
    title: 'Instant Results',
    desc: 'Our optimized architecture fetches real-time data in milliseconds. Experience zero-lag browsing even with high-resolution media.',
    color: '#06b6d4',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>,
    title: 'Stories & Reels',
    desc: 'Watch full stories and play reels with full audio support. Access the complete public feed of any professional account instantly.',
    color: '#f59e0b',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    title: 'Zero Login Required',
    desc: 'We prioritize your security by never asking for your credentials. Protect your personal account while conducting research or browsing.',
    color: '#10b981',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
    title: 'Worldwide Fetch',
    desc: 'Bypass regional restrictions and view public profiles from anywhere in the world through our global proxy network.',
    color: '#ec4899',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
    title: 'Advanced Discovery Engine',
    desc: 'Unlike simple scrapers, we use high-performance discovery protocols that ensure data accuracy and compliance with public information standards.',
    color: '#8b5cf6',
  },
];

export default function FeaturesPage() {
  return (
    <main className={styles.featuresPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'Features' }]} />
        <header className={styles.header}>
          <span className={styles.badge}>Capabilities</span>
          <h1 className={styles.title}>The Power of <span className={styles.grad}>PvStoryViewer</span></h1>
        </header>

        <div className={styles.grid}>
          {features.map((f, i) => (
            <div 
              key={i} 
              className={styles.featureCard}
              style={{ '--acc': f.color } as React.CSSProperties}
            >
              <div className={styles.icon}>{f.icon}</div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}
