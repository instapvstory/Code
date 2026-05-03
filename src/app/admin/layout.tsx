'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminAuthProvider from '@/components/admin/AdminAuthProvider';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <div className={styles.container}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <main className={styles.main}>
            <div className={styles.adminArea}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminAuthProvider>
  );
}