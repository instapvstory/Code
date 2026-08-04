import SkeletonLoader from '@/components/viewer/SkeletonLoader/SkeletonLoader';
import styles from './page.module.css';

export default function Loading() {
  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '20px 16px' }}>
        <SkeletonLoader />
      </div>
    </div>
  );
}
