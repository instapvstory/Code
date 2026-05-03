'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header/Header';

import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import aboutStyles from '../about/About.module.css';
import styles from './ContactForm.module.css';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, you would send data to an API route here
  };

  return (
    <main className={aboutStyles.aboutPage}>
      <div className={aboutStyles.container}>
        <Breadcrumb items={[{ label: 'Contact Us' }]} />
        <header className={aboutStyles.header}>
          <span className={aboutStyles.badge}>Support</span>
          <h1 className={aboutStyles.title}>Get in <span className={aboutStyles.grad}>Touch</span></h1>
          <p style={{ color: '#9ca3af', marginTop: '16px', fontSize: '1.1rem' }}>
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </header>

        <div className={styles.formWrapper}>
          {submitted ? (
            <div className={styles.successMsg}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3>Message Sent Successfully</h3>
              <p style={{ marginTop: '8px', fontWeight: '400', fontSize: '0.9rem', opacity: 0.8 }}>
                Thank you for reaching out. Our team will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input type="text" className={styles.input} placeholder="John Doe" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input type="email" className={styles.input} placeholder="john@example.com" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Subject</label>
                <input type="text" className={styles.input} placeholder="How can we help?" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Message</label>
                <textarea className={styles.textarea} placeholder="Describe your inquiry..." required></textarea>
              </div>
              <button type="submit" className={styles.submitBtn}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

    </main>
  );
}
