import styles from '@/styles/LegalPage.module.css';
import Header from '@/components/layout/Header/Header';

import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';

export const metadata = {
  title: 'Disclaimer - InstaPvStory',
  description: 'Legal disclaimer for InstaPvStory services and content.',
};

export default function DisclaimerPage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'Disclaimer' }]} />
        <div className={styles.header}>
          <h1 className={styles.title}>Disclaimer</h1>
          <p className={styles.lastUpdated}>Last Updated: April 14, 2026</p>
        </div>

        <div className={styles.content}>
          <p>The information and services provided by InstaPvStory are for general informational purposes only. By using this website, you acknowledge and agree to the following terms.</p>

          <h2>1. Independent Entity Status</h2>
          <p>InstaPvStory is an independently operated web-based research tool. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta Platforms, Inc., or any of its subsidiaries or affiliates. Our service operates as a separate discovery layer for publicly available digital content.</p>

          <h2>2. Intellectual Property & Trademark Disclosure</h2>
          <p>The name "Instagram," as well as related names, marks, emblems, and images, are registered trademarks of Meta Platforms, Inc. Use of these trademarks on our site is for nominative purposes only—specifically to identify the source of the public information being viewed—and does not imply any sponsorship or endorsement by the trademark owners.</p>

          <h2>3. Reliability of Discovery Channels</h2>
          <p>InstaPvStory utilizes advanced discovery protocols to retrieve real-time public data. However, we make no representations or warranties regarding the absolute completeness or 24/7 accuracy of the information provided. Data is processed "as is," and its availability depends on the stability of official discovery channels and third-party infrastructure.</p>

          <h2>4. User Conduct & Compliance</h2>
          <p>By utilizing our discovery engine, you agree to assume full responsibility for your actions. InstaPvStory is designed for ethical market research, creative monitoring, and personal anonymity. We explicitly disclaim any liability for the misuse of information obtained through our system, including any activities that violate the privacy expectations of content creators.</p>

          <h2>5. Professional Disclaimer</h2>
          <p>The information provided through InstaPvStory does not constitute legal, professional, or technical advice. Users are encouraged to conduct their own due diligence when using public social data for business, legal, or investigative purposes.</p>

        </div>

        <a href="/" className={styles.backHome}>← Back to Homepage</a>
      </div>

    </main>
  );
}
