'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TurnstileGate.module.css';

declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

interface TurnstileGateProps {
  siteKey: string;
  children: React.ReactNode;
}

const SESSION_KEY = 'pvstory_cf_ok';

export default function TurnstileGate({ siteKey, children }: TurnstileGateProps) {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);

  useEffect(() => {
    // Already verified in this browser session — skip challenge
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setVerified(true);
      return;
    }

    const render = () => {
      if (!containerRef.current || widgetRef.current || !window.turnstile) return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        size: 'normal',
        callback: async (token: string) => {
          setVerifying(true);
          try {
            const res = await fetch('/api/turnstile/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            });
            if (res.ok) {
              sessionStorage.setItem(SESSION_KEY, '1');
              setVerified(true);
            } else {
              setErr(true);
            }
          } catch {
            setErr(true);
          } finally {
            setVerifying(false);
          }
        },
        'error-callback': () => {
          setErr(true);
          setVerifying(false);
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
  }, [siteKey]);

  // Verified — show content normally
  if (verified) return <>{children}</>;

  return (
    <div className={styles.gate}>
      {/* Blurred background preview of real content */}
      <div className={styles.blurred} aria-hidden="true">
        {children}
      </div>

      {/* Security overlay */}
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.shieldWrap}>
            <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className={styles.title}>Security Check</h2>
          <p className={styles.sub}>
            Please verify you&apos;re human to view this profile.<br />
            This only takes a second.
          </p>

          {err ? (
            <div className={styles.errorBox}>
              <p>Verification failed. Please refresh and try again.</p>
              <button className={styles.retryBtn} onClick={() => { setErr(false); widgetRef.current = null; }}>
                Try Again
              </button>
            </div>
          ) : verifying ? (
            <div className={styles.verifyingMsg}>
              <div className={styles.spinner} />
              Verifying…
            </div>
          ) : (
            <div ref={containerRef} className={styles.widget} />
          )}

          <p className={styles.poweredBy}>
            Protected by{' '}
            <svg width="70" height="12" viewBox="0 0 110 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', verticalAlign: 'middle', opacity: 0.6 }}>
              <text x="0" y="14" fontFamily="sans-serif" fontSize="13" fill="#f6821f">Cloudflare</text>
            </svg>
            {' '}Turnstile
          </p>
        </div>
      </div>
    </div>
  );
}
