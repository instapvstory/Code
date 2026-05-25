import styles from '@/styles/LegalPage.module.css';
import Header from '@/components/layout/Header/Header';

import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';

export const metadata = {
  title: 'Terms of Service - PvStoryViewer',
  description: 'Terms and conditions for using the PvStoryViewer anonymous Instagram viewer.',
};

export default function TermsPage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'Terms of Service' }]} />
        <div className={styles.header}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last Updated: April 14, 2026</p>
        </div>

        <div className={styles.content}>
          <p>Welcome to PvStoryViewer. By accessing or using our website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.</p>

          <h2>1. Acceptable Use Policy</h2>
          <p>PvStoryViewer is intended for professional market research, creative inspiration, and personal privacy analysis. By using this service, you warrant that your discovery activities are in compliance with your local laws. Prohibited activities include, but are not limited to:</p>
          <ul>
            <li>Automated data scraping or large-scale harvesting of data through our interface.</li>
            <li>Using our technology to facilitate harassment, stalking, or any form of illegal surveillance.</li>
            <li>Attempting to disrupt or overburden our cloud infrastructure through malicious traffic (DDoS).</li>
          </ul>

          <h2>2. Content Ownership & Copyright</h2>
          <p>PvStoryViewer does not own the content displayed through our discovery engine. All media, including stories, reels, and photos, are the property of their respective creators and the platforms that host them. We provide a transient viewing interface for publicly available data. Users are responsible for ensuring that their viewing activities respect the intellectual property rights of content owners.</p>

          <h2>3. Service Availability & Performance</h2>
          <p>While we aim for a 99.9% uptime, we do not guarantee that the service will be perpetually uninterrupted. Our performance relies on the availability of third-party public data sources. Changes to discovery protocols, server maintenance, or platform updates may temporarily impact the speed or availability of certain features.</p>

          <h2>4. Fair Usage Guidelines</h2>
          <p>To ensure a high-quality experience for all researchers, we implement fair usage monitoring. Users who engage in excessive or automated requests that degrade the experience for others may have their access temporarily limited. Our "Zero-Login" system is designed for high-performance individual discovery, not for commercial data redistribution.</p>

          <h2>5. Comprehensive Liability Disclaimer</h2>
          <p>PvStoryViewer, its developers, and its affiliates shall not be liable for any damages—direct or indirect—arising from the use of our discovery technology. This includes, but is not limited to, data inaccuracies, loss of research, or any legal consequences resulting from your use of publicly available information. You use this system entirely at your own risk.</p>

          <h2>6. Third-Party Data Protection</h2>
          <p>Our discovery engine interfaces with official systems to retrieve public metadata. At no point should our service be interpreted as providing access to private, protected, or restricted content. We strictly adhere to public-only disclosure standards.</p>


          <h2>6. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Your continued use of the site following any changes signifies your acceptance of the new Terms of Service.</p>
        </div>

        <a href="/" className={styles.backHome}>← Back to Homepage</a>
      </div>

    </main>
  );
}
