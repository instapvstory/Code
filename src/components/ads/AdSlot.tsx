'use client';

import { useEffect, useRef, useState } from 'react';

interface AdSlotProps {
  /** Must match the placement value set in Admin → Ads */
  placement: string;
  /** Optional label shown in the "no ad" placeholder */
  label?: string;
  /** Extra wrapper styles */
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSlot({ placement, label, style, className = '' }: AdSlotProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ads?placement=${encodeURIComponent(placement)}&status=active&limit=1`);
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!cancelled && json.success && json.data?.length > 0) {
          setCode(json.data[0].code);
        }
      } catch {
        // silently fail – no ad to show
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [placement]);

  // Inject ad scripts after the HTML is set
  useEffect(() => {
    if (!code || !containerRef.current) return;
    // Re-run any <script> tags that were injected via innerHTML
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [code]);

  if (loading) return null; // invisible while loading
  if (!code) return null;   // no ad configured → render nothing (clean)

  return (
    <div
      className={`ad-slot ${className}`}
      style={{ textAlign: 'center', overflow: 'hidden', ...style }}
    >
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: code }}
      />
      <p style={{ fontSize: 10, color: '#9ca3af', margin: '4px 0 0', letterSpacing: 1, textTransform: 'uppercase' }}>
        Advertisement
      </p>
    </div>
  );
}
