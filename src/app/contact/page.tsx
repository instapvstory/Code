'use client';

import { useState } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import aboutStyles from '../about/About.module.css';
import styles from './ContactForm.module.css';



export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build a mailto link with the form data pre-filled
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    const mailtoUrl = `mailto:contact@pvstoryviewer.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

  return (
    <main className={aboutStyles.aboutPage}>
      <div className={aboutStyles.container}>
        <Breadcrumb items={[{ label: 'Contact Us' }]} />
        <header className={aboutStyles.header}>
          <span className={aboutStyles.badge}>Support</span>
          <h1 className={aboutStyles.title}>Get in <span className={aboutStyles.grad}>Touch</span></h1>
          <p style={{ color: '#9ca3af', marginTop: '16px', fontSize: '1.1rem' }}>
            Have a question, spotted a bug, or want to suggest a feature? We&apos;d love to hear from you.
          </p>
        </header>

        <div className={styles.formWrapper}>
          {submitted ? (
            <div className={styles.successMsg}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px', color: '#10b981' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3>Your email client should open now</h3>
              <p style={{ marginTop: '8px', fontWeight: '400', fontSize: '0.9rem', opacity: 0.8 }}>
                If it didn&apos;t open automatically, email us directly at{' '}
                <a href="mailto:contact@pvstoryviewer.com" style={{ color: '#7c3aed' }}>
                  contact@pvstoryviewer.com
                </a>.
                We typically respond within 1–2 business days.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.contactInfo}>
                <p>
                  You can also reach us directly at{' '}
                  <a href="mailto:contact@pvstoryviewer.com" className={styles.emailLink}>
                    contact@pvstoryviewer.com
                  </a>
                  . We respond within 1–2 business days.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Subject</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="What is this about?"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Message</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Describe your question or issue..."
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.submitBtn}>
                  Send Message
                </button>
              </form>
            </>
          )}
        </div>

        {/* Trust note */}
        <div className={styles.trustNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>We don&apos;t share your contact details with any third parties. Messages are used only to respond to your inquiry.</span>
        </div>
      </div>
    </main>
  );
}
