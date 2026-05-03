import Image from 'next/image';
import styles from './MiniProfile.module.css';
import type { Profile } from '../ProfileView/ProfileView';

interface MiniProfileProps {
  profile: Profile;
  statLabel: string;
  statValue: number | string;
}

export default function MiniProfile({ profile, statLabel, statValue }: MiniProfileProps) {
  return (
    <div className={styles.miniProfile}>
      <div className={styles.left}>
        <Image
          src={profile.profilePicUrl}
          alt={profile.username}
          width={80}
          height={80}
          className={styles.avatar}
          unoptimized
        />
        <div className={styles.info}>
          <div className={styles.usernameRow}>
            <span className={styles.username}>{profile.username}</span>
            <button className={styles.copyBtn} title="Copy username">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
          <div className={styles.fullName}>{profile.fullName}</div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{profile.posts.toLocaleString()}</div>
          <div className={styles.statLabel}>Posts</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{profile.followers.toLocaleString()}</div>
          <div className={styles.statLabel}>Followers</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{profile.following.toLocaleString()}</div>
          <div className={styles.statLabel}>Follows</div>
        </div>
      </div>
    </div>
  );
}
