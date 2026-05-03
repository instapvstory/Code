import styles from '@/styles/LegalPage.module.css';
import Header from '@/components/layout/Header/Header';

import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';

export const metadata = {
  title: 'Privacy Policy - InstaPvStory',
  description: 'Privacy policy for InstaPvStory. Learn how we handle data and protect your anonymity.',
};

export default function PrivacyPage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'Privacy Policy' }]} />
        <div className={styles.header}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: April 14, 2026</p>
        </div>

        <div className={styles.content}>
          <p>At InstaPvStory, your privacy is our primary concern. This policy outlines how we handle data and the measures we take to ensure your anonymity while using our service.</p>

          <h2>1. No Personal Data Collection</h2>
          <p>We do not require you to create an account or provide any personal information (such as name, email, or credentials) to use our service. Our "Zero-Login" philosophy means we do not collect or store any identifying information about our users, such as names, IP addresses (which are masked by our servers), or geographic locations.</p>

          <h2>2. Local Storage & Data Persistence</h2>
          <p>To enhance your experience, we may store your recent search history locally on your device using browser-based LocalStorage. This data never leaves your machine and is never transmitted to our servers or any third parties. You have the full right to clear this data at any time through your browser settings.</p>

          <h2>3. Data Flow Transparency</h2>
          <p>Our discovery systems act as a secure intermediary between the user and public data sources. When you enter a search query:</p>
          <ul>
            <li>Our secure cloud servers fetch the requested public content.</li>
            <li>The content is presented to you through our interface.</li>
            <li>No direct connection is established between your device and the target platform, ensuring your IP and identity remain hidden.</li>
          </ul>

          <h2>4. Usage Data & Performance Monitoring</h2>
          <p>We collect non-personal, aggregated information about site performance, including browser types, anonymized device categories, and page visit duration. This data is used exclusively for internal optimization and to ensure the reliability of our discovery engine.</p>

          <h2>5. Compliance with Digital Privacy Standards</h2>
          <p>InstaPvStory is designed with "Privacy by Design" principles. We strictly adhere to the standards of global privacy frameworks, including the spirit of GDPR and CCPA, by ensuring that we do not process, sell, or share personal user data. We exclusively interface with publicly available information that is intentionally made visible by content creators.</p>

          <h2>6. Third-Party Data Disclosures</h2>
          <p>We do not sell user data to advertisers, researchers, or any third-party entities. Since we do not collect personal identifiers, we have no identifiable data to share, even upon official request.</p>

        </div>

        <a href="/" className={styles.backHome}>← Back to Homepage</a>
      </div>

    </main>
  );
}
