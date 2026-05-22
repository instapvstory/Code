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
      
      // Prevent crash if environment variable is missing
      if (!siteKey) {
        console.error("Turnstile Site Key is missing. Check your environment variables.");
        setErr(true);
        return;
      }

      try {
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light', // explicitly light to match the screenshot
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
      } catch (err) {
        console.error("Turnstile failed to render:", err);
        setErr(true);
      }
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

      {/* Security overlay with just the native widget */}
      <div className={styles.overlay}>
        <div ref={containerRef} className={styles.widgetContainer} />
        
        {err && (
          <div className={styles.errorBox}>
            <p>Verification failed. Please refresh.</p>
            <button className={styles.retryBtn} onClick={() => { setErr(false); widgetRef.current = null; }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
