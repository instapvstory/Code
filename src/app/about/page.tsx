import Header from '@/components/layout/Header/Header';

import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import styles from './About.module.css';

export const metadata = {
  title: 'About Us - PvStoryViewer',
  description: 'Learn about the mission and values behind PvStoryViewer, the premier anonymous social media discovery tool.',
};

export default function AboutPage() {
  return (
    <main className={styles.aboutPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'About' }]} />
        <header className={styles.header}>
          <span className={styles.badge}>Our Identity</span>
          <h1 className={styles.title}>Empowering <span className={styles.grad}>Private Discovery</span></h1>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The Genesis of PvStoryViewer</h2>
          <div className={styles.content}>
            <p>
              PvStoryViewer was established by a collective of digital privacy advocates and social media researchers who identified a critical gap in the market: the lack of a secure, high-performance platform for anonymous profile discovery. In an era where digital footprints are increasingly tracked and monetized, we believed that professionals—from market analysts to investigative researchers—deserved a tool that respected their privacy without compromising on data quality.
            </p>
            <p>
              Our journey began with a focus on solving the technical hurdles of real-time content retrieval while ensuring total user anonymity. Today, PvStoryViewer stands as a leader in the field, serving millions of users who require secure access to public social information for competitive analysis, creative inspiration, and personal privacy.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Technical Excellence & Expertise</h2>
          <div className={styles.content}>
            <p>
              At the heart of our platform is a proprietary discovery engine designed for speed and reliability. Unlike standard web scrapers that are often unstable and inaccurate, PvStoryViewer utilizes optimized cloud architecture to interface with official social data protocols. This ensures:
            </p>
            <ul>
              <li><strong>Real-Time Synchronization:</strong> Content is fetched at the moment of request, ensuring you see the most current stories and posts.</li>
              <li><strong>High-Resolution Media:</strong> We prioritize quality, delivering images and reels in their original high-definition state.</li>
              <li><strong>Global Accessibility:</strong> Our distributed server network ensures fast load times and reliable access from any geographic location.</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why Professionals Trust Our System</h2>
          <div className={styles.grid}>
            <div className={styles.valueCard} style={{ '--acc': '#7c3aed' } as React.CSSProperties}>
              <div className={styles.icon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className={styles.vTitle}>Absolute Anonymity</h3>
              <p className={styles.vDesc}>Our "Zero-Login" philosophy means we never ask for your identity. Your research remains entirely confidential.</p>
            </div>
            <div className={styles.valueCard} style={{ '--acc': '#06b6d4' } as React.CSSProperties}>
              <div className={styles.icon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <h3 className={styles.vTitle}>Server-Side Protection</h3>
              <p className={styles.vDesc}>All requests are processed through our secure cloud environment, shielding your IP address from third-party platforms.</p>
            </div>
            <div className={styles.valueCard} style={{ '--acc': '#10b981' } as React.CSSProperties}>
              <div className={styles.icon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className={styles.vTitle}>Infinite Reliability</h3>
              <p className={styles.vDesc}>We maintain a 99.9% uptime record, ensuring that your research tools are ready whenever inspiration strikes.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Commitment to Ethics</h2>
          <div className={styles.content}>
            <p>
              Ethics and transparency are the pillars of PvStoryViewer. We exclusively process publicly available data, strictly adhering to the standards set by global social media platforms. We do not support, enable, or encourage the viewing of private accounts or the misuse of social data for harassment.
            </p>
            <p>
              We are committed to remaining a free-to-use resource for the global community of social media researchers, creative directors, and privacy-conscious users.
            </p>
          </div>
        </section>

      </div>

    </main>
  );
}
