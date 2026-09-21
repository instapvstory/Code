'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';

const AdSlot = dynamic(() => import('@/components/ads/AdSlot'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') || false;
  const [adClosed, setAdClosed] = useState(false);
  const [adsterraReady, setAdsterraReady] = useState(false);

  useEffect(() => {
    // Delay Adsterra direct banner until page is interactive
    const id = setTimeout(() => setAdsterraReady(true), 3000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} suppressHydrationWarning={true}>
      {!isAdminRoute && <Header />}
      <main style={{ flex: 1 }}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}

      {/* Adsterra In-Page Push — fires once per session, very high CTR */}
      {!isAdminRoute && adsterraReady && (
        <Script
          id="adsterra-inpage-push"
          src="//pl4629628.profitableratecpmnetwork.com/invoke.js"
          strategy="lazyOnload"
        />
      )}

      {/* Sticky Footer Ad */}
      {!isAdminRoute && !adClosed && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'rgba(13, 11, 31, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px 0 4px',
          boxSizing: 'border-box'
        }}>
          {/* Close button */}
          <button 
            onClick={() => setAdClosed(true)}
            style={{
              position: 'absolute',
              top: '-24px',
              right: '10px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              zIndex: 10000
            }}
            title="Close Advertisement"
          >
            &times;
          </button>
          {/* Try DB-configured ad first, fallback to direct Adsterra banner */}
          <AdSlot placement="sticky_footer" style={{ margin: '0 auto' }} />
        </div>
      )}
    </div>
  );
}
