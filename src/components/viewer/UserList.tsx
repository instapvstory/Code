import Image from 'next/image';
import styles from './UserList.module.css';

export interface UserItem {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  isPrivate: boolean;
  isVerified?: boolean;
}

interface UserListProps {
  title: string;
  users: UserItem[];
}

export default function UserList({ title, users }: UserListProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.list}>
        {users.map((user, index) => (
          <div key={user.id} className={styles.row}>
            <div className={styles.left}>
              <Image
                src={user.profilePicUrl}
                alt={user.username}
                width={40}
                height={40}
                className={styles.avatar}
                unoptimized
              />
              <div className={styles.info}>
                <div className={styles.usernameRow}>
                  <span className={styles.username}>{user.username}</span>
                  {user.isVerified && (
                    <svg className={styles.verified} width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <button className={styles.copyBtn} title="Copy username">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.fullName}>{user.fullName}</div>
              </div>
            </div>
            <div className={styles.right}>
              {user.isPrivate && <span className={styles.privateBadge}>Private</span>}
              <span className={styles.indexNum}>{index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
