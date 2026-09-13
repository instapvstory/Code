import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import styles from './About.module.css';

export const metadata = {
  title: 'About PvStoryViewer — Who We Are and Why We Built This',
  description: 'PvStoryViewer was built to solve a specific problem: viewing public Instagram profiles and stories without an account or login. Here\'s the honest story of what this tool is, how it works, and what it doesn\'t do.',
  openGraph: {
    title: 'About PvStoryViewer — Who We Are and Why We Built This',
    description: 'An honest explanation of what PvStoryViewer is, how it works, and the principles behind it.',
    type: 'website',
    url: 'https://pvstoryviewer.com/about',
  },
  twitter: {
    card: 'summary',
    title: 'About PvStoryViewer',
    description: 'An honest explanation of what PvStoryViewer is, how it works, and the principles behind it.',
  },
};

export default function AboutPage() {
  return (
    <main className={styles.aboutPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'About' }]} />
        <header className={styles.header}>
          <span className={styles.badge}>About This Tool</span>
          <h1 className={styles.title}>Why We Built <span className={styles.grad}>PvStoryViewer</span></h1>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The Problem We Noticed</h2>
          <div className={styles.content}>
            <p>
              Instagram is a public platform — millions of accounts set themselves to "public" deliberately, making their content visible to anyone. But accessing that public content without an Instagram account is surprisingly difficult. The platform increasingly prompts non-logged-in visitors to create an account or log in, even when viewing content that the account holder has made publicly available.
            </p>
            <p>
              For marketers doing competitive research, parents wanting to understand which public creators their children follow, journalists monitoring public figures, or simply someone who doesn't have an Instagram account but wants to check a public profile — this friction is unnecessary and frustrating.
            </p>
            <p>
              PvStoryViewer was built to remove that friction. Enter a public username, see the public profile — stories, posts, highlights. No account required on your end.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How It Actually Works</h2>
          <div className={styles.content}>
            <p>
              PvStoryViewer retrieves data from public Instagram Business and Creator accounts through Instagram's official data infrastructure. This is important to understand: we're not scraping HTML pages or using unofficial endpoints. We access publicly available data through the same mechanisms that power thousands of legitimate social media tools.
            </p>
            <p>
              When you enter a username, our server makes the data request — not your browser, not your device. This means your IP address and identity are never involved in the Instagram data transaction. The profile data we retrieve is delivered to your browser. Because no personal Instagram session is involved, no view record is created on the account you're viewing.
            </p>
            <p>
              This works for public Business and Creator accounts. Instagram's official API is designed to serve this category of account data to third-party applications. Personal accounts — even when set to public — are not available through this same official path, which is why some searches return no results.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What We Don't Do</h2>
          <div className={styles.grid}>
            <div className={styles.valueCard} style={{ '--acc': '#ef4444' } as React.CSSProperties}>
              <div className={styles.icon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <h3 className={styles.vTitle}>No Private Account Access</h3>
              <p className={styles.vDesc}>We cannot and do not access private Instagram accounts. Private content is protected at the API level. Any tool claiming otherwise is not being truthful.</p>
            </div>
            <div className={styles.valueCard} style={{ '--acc': '#f59e0b' } as React.CSSProperties}>
              <div className={styles.icon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className={styles.vTitle}>No Credential Storage</h3>
              <p className={styles.vDesc}>We never ask for your Instagram username or password. There's nothing to store because we don't need it. Your account is never involved.</p>
            </div>
            <div className={styles.valueCard} style={{ '--acc': '#10b981' } as React.CSSProperties}>
              <div className={styles.icon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className={styles.vTitle}>No User Data Sold</h3>
              <p className={styles.vDesc}>We don't build profiles on our users, sell search history, or share data with third parties. Searches you run stay on your device.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Who Uses This Tool</h2>
          <div className={styles.content}>
            <p>Based on the use cases we see, the people who find PvStoryViewer genuinely useful tend to fall into a few categories:</p>
            <ul>
              <li><strong>Marketers and brand managers</strong> who want to monitor competitor Instagram activity without leaving a footprint in their story view lists.</li>
              <li><strong>Freelancers and agencies</strong> conducting pre-pitch research on potential clients' existing social presence.</li>
              <li><strong>Journalists and researchers</strong> studying public figures' social media activity for reporting or academic purposes.</li>
              <li><strong>People without Instagram accounts</strong> who want to view a specific public profile — a business, a public event page, a creator they heard about.</li>
              <li><strong>Parents</strong> wanting to understand what public content creators their children follow, without needing their own account.</li>
              <li><strong>Influencer marketing teams</strong> vetting potential partners' content history and engagement before approaching them.</li>
            </ul>
            <p>
              These are all uses involving publicly available content — information the account holder has deliberately made visible to the world by setting their account to public.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Commitment Going Forward</h2>
          <div className={styles.content}>
            <p>
              We're committed to keeping PvStoryViewer functional, honest, and free. We won't add dark patterns, fake metrics, or deceptive upgrade prompts. What you see is what the tool does.
            </p>
            <p>
              We also commit to staying within the bounds of Instagram's official data access infrastructure. That means some limitations are real and intentional — not bugs to be worked around, but design decisions that reflect how the platform's data sharing is meant to function.
            </p>
            <p>
              If you have questions, found a bug, or want to suggest an improvement, reach out through our <a href="/contact" style={{ color: '#7c3aed' }}>contact page</a>.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
