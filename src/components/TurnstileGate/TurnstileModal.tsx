'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TurnstileGate.module.css'; // reuse the same CSS

interface TurnstileModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  siteKey: string;
}

const SESSION_KEY = 'pvstory_cf_ok';

export default function TurnstileModal({ isOpen, onSuccess, onClose, siteKey }: TurnstileModalProps) {
  const [err, setErr] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const render = () => {
      if (!containerRef.current || widgetRef.current || !window.turnstile) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'normal',
        callback: async (token: string) => {
          try {
            const res = await fetch('/api/turnstile/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
            if (res.ok) {
              sessionStorage.setItem(SESSION_KEY, '1');
              onSuccess();
            } else {
              setErr(true);
            }
          } catch {
            setErr(true);
          }
        },
        'error-callback': () => {
          setErr(true);
        },
        'expired-callback': () => {
          if (widgetRef.current && window.turnstile) {
            window.turnstile.remove(widgetRef.current);
            widgetRef.current = null;
          }
          render();
        },
      });
    };

    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    if (window.turnstile) {
      render();
    } else {
      const onLoad = () => render();
      script.addEventListener('load', onLoad);
      return () => script!.removeEventListener('load', onLoad);
    }

    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [isOpen, siteKey, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <button className={styles.closeModalBtn} onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        
        <h2 style={{ marginBottom: 16, fontSize: '1.2rem', color: '#fff' }}>Security Check</h2>
        <div ref={containerRef} className={styles.widgetContainer} style={{ minHeight: 65, display: 'flex', justifyContent: 'center' }} />
        
        {err && (
          <div className={styles.errorBox} style={{ marginTop: 16 }}>
            <p>Verification failed. Please try again.</p>
            <button className={styles.retryBtn} onClick={() => { setErr(false); widgetRef.current = null; }}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
