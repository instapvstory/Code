import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
  const [year, setYear] = useState<number>(2024);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className={styles.footer} suppressHydrationWarning={true}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.brand}>
            <div className={styles.brandTitle}>
              <div className={styles.logoIcon}>
                <img src="/logo.png" alt="PvStoryViewer Logo" width="28" height="28" />
              </div>
              <h3 style={{ color: '#ffffff', margin: 0 }}>PvStoryViewer</h3>
            </div>
            <p className="text-small">Anonymous Instagram story and highlight viewer.</p>
          </div>
            <div className={styles.links}>
            <div className={styles.group}>
              <h4>Company</h4>
              <Link href="/about" className="text-small">About Us</Link>
              <Link href="/features" className="text-small">Features</Link>
              <Link href="/blog" className="text-small">Blog</Link>
            </div>
            <div className={styles.group}>
              <h4>Legal</h4>
              <Link href="/terms" className="text-small">Terms of Service</Link>
              <Link href="/privacy" className="text-small">Privacy Policy</Link>
              <Link href="/disclaimer" className="text-small">Disclaimer</Link>
            </div>
            <div className={styles.group}>
              <h4>Support</h4>
              <Link href="/contact" className="text-small">Contact Us</Link>
              <Link href="/#faq" className="text-small">FAQ</Link>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <p className="text-small">&copy; {year} PvStoryViewer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
