'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TurnstileGate.module.css';

declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement | string, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

interface TurnstileGateProps {
  siteKey: string;
  children: React.ReactNode;
}

const SESSION_KEY = 'pvstory_cf_ok';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function TurnstileGate({ siteKey, children }: TurnstileGateProps) {
  const [verified, setVerified] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Check session on mount
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setVerified(true);
      return;
    }
    setReady(true);
  }, []);

  // Inject Turnstile script and render widget
  useEffect(() => {
    if (!ready || verified || !siteKey) return;

    const renderWidget = () => {
      if (!containerRef.current || widgetIdRef.current) return;
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: () => {
            // Token is valid — trust client-side callback for UX
            sessionStorage.setItem(SESSION_KEY, '1');
            setVerified(true);
          },
          'error-callback': () => {
            // Reset so user can retry
            widgetIdRef.current = null;
          },
          'expired-callback': () => {
            if (widgetIdRef.current) {
              window.turnstile.remove(widgetIdRef.current);
              widgetIdRef.current = null;
            }
          },
        });
      } catch (e) {
        console.error('Turnstile render error:', e);
      }
    };

    const SCRIPT_ID = 'cf-turnstile-api';

    if (document.getElementById(SCRIPT_ID)) {
      // Script already loaded
      if (window.turnstile) {
        renderWidget();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [ready, verified, siteKey]);

  // Pass-through when verified
  if (verified) return <>{children}</>;

  return (
    <div className={styles.wrap}>
      {/* Skeleton / blurred profile underneath */}
      <div className={styles.blurred} aria-hidden="true">
        {children}
      </div>

      {/* Official Turnstile widget centered */}
      <div className={styles.overlay}>
        {ready && siteKey ? (
          <div ref={containerRef} className={styles.widget} />
        ) : (
          <div className={styles.noKey}>
            <p>⚠️ Captcha not configured.</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
