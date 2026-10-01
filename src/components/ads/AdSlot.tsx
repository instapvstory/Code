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
  /** Disable responsive scaling using CSS transform */
  disableScale?: boolean;
}

function parseDimensions(code: string, placement: string) {
  const isSidebar =
    placement.toLowerCase().includes('left') ||
    placement.toLowerCase().includes('right') ||
    placement.toLowerCase().includes('sidebar');

  let width = isSidebar ? (placement.includes('hero') ? 160 : 300) : 728;
  let height = isSidebar ? 600 : 90;

  // Placement specific defaults
  if (placement === 'article_mid' || placement === 'article_bottom' || placement === 'article_top') {
    width = 728;
    height = 90;
  } else if (placement === 'article_sidebar' || placement === 'blog_sidebar') {
    width = 300;
    height = 250;
  }

  // Try to find width and height in atOptions or iframe/img/div attributes
  const widthRegex = /(?:['"]?width['"]?\s*:\s*['"]?(\d+)['"]?|width=['"]?(\d+)['"]?|width\s*:\s*(\d+)px)/i;
  const heightRegex = /(?:['"]?height['"]?\s*:\s*['"]?(\d+)['"]?|height=['"]?(\d+)['"]?|height\s*:\s*(\d+)px)/i;

  const wMatch = code.match(widthRegex);
  if (wMatch) {
    const val = parseInt(wMatch[1] || wMatch[2] || wMatch[3]);
    if (val > 50 && val < 2000) width = val;
  }

  const hMatch = code.match(heightRegex);
  if (hMatch) {
    const val = parseInt(hMatch[1] || hMatch[2] || hMatch[3]);
    if (val > 30 && val < 2000) height = val;
  }

  return { width, height };
}

export default function AdSlot({ placement, label, style, className = '', disableScale = false }: AdSlotProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [dynamicHeight, setDynamicHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
        const res = await fetch(`/api/ads?placement=${encodeURIComponent(placement)}&status=active&device=${device}&limit=1`);
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
    return () => {
      cancelled = true;
    };
  }, [placement]);

  // Listen for iframe content auto-resize postMessages
  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.data?.type === 'ad_slot_resize' && e.data?.placement === placement) {
        const h = Number(e.data.height);
        if (h > 30 && h < 1200) {
          setDynamicHeight(h);
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMsg);
      return () => window.removeEventListener('message', handleMsg);
    }
  }, [placement]);

  useEffect(() => {
    if (!code || !containerRef.current || disableScale) {
      setScale(1);
      return;
    }

    const parsed = parseDimensions(code, placement);
    const container = containerRef.current;

    const handleResize = () => {
      const containerWidth = container.getBoundingClientRect().width;
      if (containerWidth < parsed.width && containerWidth > 0) {
        setScale(containerWidth / parsed.width);
      } else {
        setScale(1);
      }
    };

    handleResize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined') {
      const win = window as any;
      if ('ResizeObserver' in win) {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(container);
      } else {
        win.addEventListener('resize', handleResize);
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else if (typeof window !== 'undefined') {
        (window as any).removeEventListener('resize', handleResize);
      }
    };
  }, [code, placement, disableScale]);

  if (loading) return null; // invisible while loading
  if (!code) return null; // no active ad configured -> render nothing

  const parsed = parseDimensions(code, placement);
  const nativeWidth = parsed.width;
  const nativeHeight = dynamicHeight || parsed.height;

  const currentScale = disableScale ? 1 : scale;
  const scaledHeight = nativeHeight * currentScale;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <base target="_blank">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
            overflow: hidden;
          }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div id="ad-wrap" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
          ${code}
        </div>
        <script>
          function reportHeight() {
            try {
              var wrap = document.getElementById('ad-wrap');
              var h = wrap ? wrap.scrollHeight : (document.body.scrollHeight || document.documentElement.scrollHeight);
              if (h && h > 30) {
                window.parent.postMessage({ type: 'ad_slot_resize', height: h, placement: '${placement}' }, '*');
              }
            } catch (e) {}
          }
          window.addEventListener('load', reportHeight);
          setTimeout(reportHeight, 400);
          setTimeout(reportHeight, 1500);
        </script>
      </body>
    </html>
  `;

  return (
    <div
      ref={containerRef}
      className={`ad-slot ${className}`}
      style={{
        textAlign: 'center',
        overflow: 'hidden',
        width: '100%',
        maxWidth: style?.maxWidth || nativeWidth,
        height: scaledHeight + 18,
        ...style,
      }}
    >
      <div
        style={{
          marginLeft: '50%',
          transform: `translateX(-50%) scale(${currentScale})`,
          transformOrigin: 'top center',
          width: nativeWidth,
          height: nativeHeight,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <iframe
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden', display: 'block' }}
          scrolling="no"
          title={`Ad Slot ${placement}`}
        />
      </div>
      <p
        style={{
          fontSize: 10,
          color: '#9ca3af',
          margin: '4px 0 0',
          letterSpacing: 1,
          textTransform: 'uppercase',
          lineHeight: '14px',
        }}
      >
        Advertisement
      </p>
    </div>
  );
}
