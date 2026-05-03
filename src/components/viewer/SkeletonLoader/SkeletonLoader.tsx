import styles from './SkeletonLoader.module.css';

const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`${styles.skeleton} ${className}`} style={style} />
);

const SkeletonLoader = () => {
  return (
    <div className={styles.wrapper}>
      {/* Profile header skeleton */}
      <div className={styles.profileRow}>
        <Skeleton className={styles.avatarSkeleton} />
        <div className={styles.statsRow}>
          <Skeleton className={styles.statBox} />
          <Skeleton className={styles.statBox} />
          <Skeleton className={styles.statBox} />
        </div>
      </div>

      {/* Bio skeleton */}
      <div className={styles.bioSection}>
        <Skeleton className={styles.line} style={{ width: '120px' }} />
        <Skeleton className={styles.line} style={{ width: '200px' }} />
        <Skeleton className={styles.line} style={{ width: '320px' }} />
        <Skeleton className={styles.line} style={{ width: '280px' }} />
      </div>

      {/* Story / Highlights tabs skeleton */}
      <div className={styles.tabsSkeleton}>
        <Skeleton className={styles.tabItem} />
        <Skeleton className={styles.tabItem} />
      </div>

      {/* Grid skeleton */}
      <div className={styles.gridSkeleton}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={styles.gridCell} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
