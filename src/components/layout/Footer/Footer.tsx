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
              <h3>PV Story</h3>
            </div>
            <p className="text-small">
              pvstory.com is not connected with Instagram. All content belongs to the content authors. Download is available for informational purposes only.
            </p>
          </div>
          <div className={styles.links}>
            <div className={styles.group}>
              <h4>Quick Links</h4>
              <Link href="/about" className="text-small">About Us</Link>
              <Link href="/contact" className="text-small">Contact</Link>
              <Link href="/blog" className="text-small">Blog</Link>
              <Link href="/features" className="text-small">Social Media Story Viewer</Link>
            </div>
            <div className={styles.group}>
              <h4>Legal</h4>
              <Link href="/privacy" className="text-small">Privacy Policy</Link>
              <Link href="/terms" className="text-small">Terms of Use</Link>
            </div>
            <div className={styles.group}>
              <h4>Support</h4>
              <Link href="mailto:contact@pvstory.com" className="text-small">contact@pvstory.com</Link>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <p className="text-small">&copy; {year} pvstory.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
