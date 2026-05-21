'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { blogPosts } from '@/lib/blogData';
import styles from './MarketingSections.module.css';

// Lazy-load AdSlot — never block initial render with ad API calls
const AdSlot = dynamic(() => import('@/components/ads/AdSlot'), { ssr: false });

/* ─────── Features Data ─────── */
const features = [
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>,
    title: '100% Anonymous',
    desc: 'Browse any public Instagram profile without ever logging in. Your identity stays completely hidden — no traces, no footprints.',
    accent: '#7c3aed',
    large: true,
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
    title: 'Instant Results',
    desc: 'Real-time data fetched in milliseconds. No delays, no loading spinners.',
    accent: '#06b6d4',
    large: false,
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>,
    title: 'Stories & Reels',
    desc: 'Watch full stories and play reels with sound. Direct access to all public content.',
    accent: '#f59e0b',
    large: false,
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    title: 'Zero Login Required',
    desc: 'We never ask for your Instagram credentials. Your account is never at risk.',
    accent: '#10b981',
    large: false,
  },
  {
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
    title: 'Works Worldwide',
    desc: 'Access any public profile from around the globe — no regional restrictions.',
    accent: '#ec4899',
    large: false,
  },
];

/* ─────── Steps Data ─────── */
const steps = [
  {
    num: '01',
    title: 'Enter a Username',
    desc: 'Type any public Instagram username into the search bar above. No account needed.',
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  },
  {
    num: '02',
    title: 'Fetch Real Data',
    desc: 'We instantly query secure data sources and retrieve live profile data, posts, and stories.',
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  },
  {
    num: '03',
    title: 'Browse Anonymously',
    desc: 'View their photos, reels, stories, follower counts, and bio. All without them knowing.',
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  },
];

/* ─────── Comparison Data ─────── */
const comparisonData = [
  { 
    feature: 'Visible to Owner', 
    loggedIn: 'Yes', 
    others: 'No', 
    ours: 'No' 
  },
  { 
    feature: 'Login Required', 
    loggedIn: 'Yes', 
    others: 'No', 
    ours: 'No' 
  },
  { 
    feature: 'Ad Intrusion', 
    loggedIn: 'Medium', 
    others: 'Extreme', 
    ours: 'Minimal' 
  },
  { 
    feature: 'IP Protection', 
    loggedIn: 'None', 
    others: 'Partial', 
    ours: 'Full Proxy' 
  },
  { 
    feature: 'View Reels/Stories', 
    loggedIn: 'Yes', 
    others: 'Sometimes', 
    ours: 'Yes (HD)' 
  },
];


/* ─────── Use Cases Data ─────── */
const useCases = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    title: 'Competitor Research',
    desc: 'Monitor competitor profiles, track their content strategy, and analyze engagement without being noticed.',
    tag: 'For Marketers',
    color: '#06b6d4',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
    title: 'Creative Inspiration',
    desc: 'Browse aesthetics, content styles, and visual storytelling from top creators worldwide.',
    tag: 'For Creatives',
    color: '#8b5cf6',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    title: 'Parental Monitoring',
    desc: "Keep an eye on public profiles your kids might interact with. Stay informed without disruption.",
    tag: 'For Parents',
    color: '#10b981',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>,
    title: 'Private Browsing',
    desc: 'View public profiles without leaving a "seen" mark or triggering profile visit notifications.',
    tag: 'For Privacy',
    color: '#f59e0b',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
    title: 'Influencer Vetting',
    desc: 'Verify influencer metrics, authenticity, and content quality before any brand partnership.',
    tag: 'For Brands',
    color: '#ec4899',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
    title: 'Social Research',
    desc: 'Academics and researchers study social media trends without needing an Instagram account.',
    tag: 'For Research',
    color: '#ef4444',
  },
];

/* ─────── Testimonials Data ─────── */
const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Digital Marketing Manager',
    avatar: 'SK',
    rating: 5,
    text: "InstaPVStory is the cleanest Instagram viewer I've found. No shady ads, no login prompts — just works perfectly. Our team uses it daily for competitor analysis.",
    color: '#7c3aed',
  },
  {
    name: 'Ahmed R.',
    role: 'Content Creator',
    avatar: 'AR',
    rating: 5,
    text: "I was skeptical at first, but this tool is legitimately impressive. Fetches real stories and reels instantly. It's become my go-to for content research.",
    color: '#06b6d4',
  },
  {
    name: 'Priya M.',
    role: 'Brand Strategist',
    avatar: 'PM',
    rating: 5,
    text: "Finally, a professional tool that respects my privacy. No sign-up, no data collection. The UI is stunning and it just works. Highly recommended.",
    color: '#10b981',
  },
  {
    name: 'James T.',
    role: 'Freelance Photographer',
    avatar: 'JT',
    rating: 5,
    text: "The story viewer is absolutely unmatched. Real-time, beautiful display, and no watermarks. I use it to get inspiration from top photographers anonymously.",
    color: '#f59e0b',
  },
  {
    name: 'Mikaela J.',
    role: 'Social Media Researcher',
    avatar: 'MJ',
    rating: 5,
    text: "Perfect for academic research. I can study public profiles, posts, and engagement patterns without disrupting the subjects or needing an account.",
    color: '#ec4899',
  },
  {
    name: 'Daniel C.',
    role: 'Tech Entrepreneur',
    avatar: 'DC',
    rating: 5,
    text: "Built on high-performance global architecture — that alone sets it apart from every scraped, sketchy alternative. This is how a professional tool should work.",
    color: '#8b5cf6',
  },
];

/* ─────── FAQ Data ─────── */
const faqs = [
  {
    q: 'Can I view private Instagram profiles?',
    a: "No — and that's by design. InstaPVStory strictly accesses public profiles using official data protocols. We do not support, promote, or enable any attempt to view private accounts. Any tool claiming to do so is a scam.",
  },
  {
    q: 'Is InstaPVStory really 100% anonymous?',
    a: "Yes. Since we access data through our own secure environment, you never log in with your personal account. The target profile has absolutely no way of knowing you viewed their content.",
  },
  {
    q: 'Do you store my search history or personal data?',
    a: "We store recent searches locally on your own device (browser storage) for your convenience — they never leave your machine. We do not collect, transmit, or sell any user data whatsoever.",
  },
  {
    q: 'How is this different from just visiting Instagram yourself?',
    a: "When you visit a profile on Instagram while logged in, your account is added to their visitor data. With InstaPVStory, you browse without an account, leaving no trace. It's the difference between being invisible and being seen.",
  },
  {
    q: 'Can I watch Stories and Reels for free?',
    a: "Yes, completely free. Stories are fetched in real-time via advanced discovery protocols. You can watch videos and view photos at full quality without paying anything or creating an account.",
  },
  {
    q: 'Why can I only view Business/Creator accounts?',
    a: "This is a limitation of the current discovery protocols. The systems are designed to access public-facing Business and Creator accounts, which is a large majority of public profiles on the platform.",
  },
  {
    q: 'Is it legal to use InstaPVStory?',
    a: "Yes. We exclusively access publicly available content through official data infrastructure. This is the same mechanism used by millions of third-party social media apps. We operate well within the bounds of standard data privacy terms for public information.",
  },
  {
    q: 'Why do some profiles show an error?',
    a: "A profile may fail to load if: (1) it's set to private, (2) it's a personal account (not a Business/Creator account), or (3) the username is misspelled. Make sure the profile is a public Business or Creator account.",
  },
];

interface MarketingSectionsProps {
  initialPosts?: any[];
}

export default function MarketingSections({ initialPosts = [] }: MarketingSectionsProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );
  
  const XIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );

  const StatusValue = ({ value, isOur = false }: { value: string; isOur?: boolean }) => {
    if (value === 'Yes') return <span className={styles.tick}><CheckIcon /></span>;
    if (value === 'No') return <span className={styles.cross}><XIcon /></span>;
    
    return (
      <span className={`${styles.statusText} ${isOur ? styles.statusOur : ''}`}>
        {value}
      </span>
    );
  };


  return (
    <div className={styles.sections}>

      {/* ── FEATURES ── */}
      <section className={styles.section} id="features">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Features
            </span>
            <h2 className={styles.sectionTitle}>Everything You Need,<br /><span className={styles.grad}>Zero Compromises</span></h2>
            <p className={styles.sectionSub}>A fully-featured anonymous Instagram viewer built on high-performance cloud technology. No shortcuts. No nonsense.</p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div
                key={i}
                className={`${styles.featureCard} ${f.large ? styles.featureLarge : ''}`}
                style={{ '--accent': f.accent } as React.CSSProperties}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
                <div className={styles.featureGlow} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOMEPAGE AD SLOT 1: After Features ── */}
      <div style={{ textAlign: 'center', padding: '8px 24px 0' }}>
        <AdSlot placement="homepage_after_features" style={{ maxWidth: 728, margin: '0 auto' }} />
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Process
            </span>
            <h2 className={styles.sectionTitle}>How InstaPVStory<br /><span className={styles.grad}>Works</span></h2>
            <p className={styles.sectionSub}>Three steps to completely anonymous Instagram browsing.</p>
          </div>

          <div className={styles.stepsWrap}>
            {steps.map((step, i) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
                {i < steps.length - 1 && <div className={styles.stepConnector} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className={`${styles.section} ${styles.comparisonSection}`} id="why-us">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M22 6s-2-2-4-2H6C4 4 2 6 2 6s1 4 4 4h12c3 0 4-4 4-4z"></path><path d="M12 10v12"></path><path d="M8 22h8"></path></svg>
              Comparison
            </span>
            <h2 className={styles.sectionTitle}>Why We&apos;re Better<br /><span className={styles.grad}>Than The Rest</span></h2>
            <p className={styles.sectionSub}>Most Instagram "viewers" are scraper bots in disguise. We built something different.</p>
          </div>

          <div className={styles.comparisonTableWrapper}>
            <p className={styles.scrollHint}>← Scroll to compare →</p>
            <div className={styles.comparisonScroll}>
              <div className={styles.comparisonTable}>
                {/* Header */}
                <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                  <div className={styles.featureLabel}>Feature</div>
                  <div className={styles.competitorCol}>Logged-in App</div>
                  <div className={styles.competitorCol}>Other Viewer Sites</div>
                  <div className={`${styles.competitorCol} ${styles.ourCol}`}>
                    <div className={styles.ourBadge}>Best Choice</div>
                    InstaPSV
                  </div>
                </div>

                {/* Rows */}
                {comparisonData.map((row, i) => (
                  <div key={i} className={styles.tableRow}>
                    <div className={styles.featureLabel}>{row.feature}</div>
                    <div className={styles.competitorCol}>
                      <StatusValue value={row.loggedIn} />
                    </div>
                    <div className={styles.competitorCol}>
                      <StatusValue value={row.others} />
                    </div>
                    <div className={`${styles.competitorCol} ${styles.ourCol}`}>
                      <StatusValue value={row.ours} isOur />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className={styles.section} id="use-cases">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Use Cases
            </span>
            <h2 className={styles.sectionTitle}>Popular Ways to View<br /><span className={styles.grad}>Instagram Anonymously</span></h2>
            <p className={styles.sectionSub}>Whether you're a marketer, creator, or simply privacy-conscious — here's how people use InstaPVStory.</p>
          </div>

          <div className={styles.useCasesGrid}>
            {useCases.map((uc, i) => (
              <div key={i} className={styles.useCaseCard} style={{ '--acc': uc.color } as React.CSSProperties}>
                <span className={styles.useCaseTag} style={{ color: uc.color, borderColor: uc.color }}>{uc.tag}</span>
                <span className={styles.useCaseEmoji}>{uc.icon}</span>
                <h3 className={styles.useCaseTitle}>{uc.title}</h3>
                <p className={styles.useCaseDesc}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.section} id="blog">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Latest Blog
            </span>
            <h2 className={styles.sectionTitle}>Anonymity & Privacy<br /><span className={styles.grad}>Resources</span></h2>
            <p className={styles.sectionSub}>Stay updated with the latest tips, tricks, and guides for secure social media browsing.</p>
          </div>

          <div className={styles.blogGrid}>
            {(initialPosts.length > 0 ? initialPosts : blogPosts.slice(0, 3)).map((post) => (
              <div key={post.slug} className={styles.blogCard}>
                <div className={styles.blogCardImage}>
                  <img src={post.image} alt={post.title} loading="lazy" decoding="async" />
                  <span className={styles.blogCardDate}>{post.date}</span>
                </div>
                <div className={styles.blogCardContent}>
                  <h3 className={styles.blogCardTitle}>{post.title}</h3>
                  <p className={styles.blogCardExcerpt}>{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className={styles.blogReadMore}>
                    Read Article →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.blogArchiveCta}>
            <Link href="/blog" className={styles.blogArchiveBtn}>
              View All Posts
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOMEPAGE AD SLOT 2: After Blog ── */}
      <div style={{ textAlign: 'center', padding: '8px 24px 0' }}>
        <AdSlot placement="homepage_after_blog" style={{ maxWidth: 728, margin: '0 auto' }} />
      </div>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.section} id="testimonials">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Testimonials
            </span>
            <h2 className={styles.sectionTitle}>What Our Users<br /><span className={styles.grad}>Are Saying</span></h2>
            <p className={styles.sectionSub}>Trusted by marketers, creators, researchers, and everyday users around the world.</p>
          </div>

          <div className={styles.testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.stars}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <p className={styles.testimonialText}>&quot;{t.text}&quot;</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar} style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className={styles.testimonialName}>{t.name}</div>
                    <div className={styles.testimonialRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section} id="faq">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              FAQ
            </span>
            <h2 className={styles.sectionTitle}>Frequently Asked<br /><span className={styles.grad}>Questions</span></h2>
            <p className={styles.sectionSub}>Everything you need to know about how InstaPVStory works and how we protect your privacy.</p>
          </div>

          <div className={styles.faqList}>
            {faqs.map((faq, i) => (
              <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                <button
                  className={styles.faqQ}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className={styles.faqChevron}>
                    {openFaq === i ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    )}
                  </span>
                </button>
                <div className={styles.faqA}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Start Browsing Anonymously</h2>
          <p className={styles.ctaSub}>No signup. No login. No limits. Just enter a username and go.</p>
          <a href="#search" className={styles.ctaBtn}>
            Try It Free →
          </a>
        </div>
      </section>

    </div>
  );
}
