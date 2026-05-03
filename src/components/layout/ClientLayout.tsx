'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') || false;

  return (
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} suppressHydrationWarning={true}>
      {!isAdminRoute && <Header />}
      <main style={{ flex: 1 }}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
