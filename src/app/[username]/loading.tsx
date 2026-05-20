import Hero from '@/components/layout/Hero/Hero';
import SkeletonLoader from '@/components/viewer/SkeletonLoader/SkeletonLoader';
import styles from './page.module.css';

export default function Loading() {
  return (
    <div className={styles.page}>
      <Hero />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
        <SkeletonLoader />
      </div>
    </div>
  );
}
