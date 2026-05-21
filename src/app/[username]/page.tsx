import { Metadata } from 'next';
import styles from './page.module.css';
import Hero from '@/components/layout/Hero/Hero';
import MarketingSections from '@/components/layout/MarketingSections/MarketingSections';
import { fetchProfileData } from '@/lib/profile-service';
import ProfileClientWrapper from './ProfileClientWrapper';
import TurnstileGate from '@/components/TurnstileGate/TurnstileGate';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  
  try {
    const { profile } = await fetchProfileData(username);
    return {
      title: `${profile.fullName || profile.username} (@${profile.username}) - InstaPvStory`,
      description: profile.bio ? profile.bio.slice(0, 150) + '...' : `View ${profile.username}'s Instagram stories, posts, and followers anonymously.`,
      openGraph: {
        title: `${profile.fullName || profile.username} (@${profile.username})`,
        description: `View ${profile.username}'s Instagram profile anonymously.`,
        images: profile.profilePicUrl ? [{ url: profile.profilePicUrl }] : [],
      }
    };
  } catch (error) {
    return {
      title: 'Profile Not Found - InstaPvStory',
      description: 'The requested Instagram profile could not be found.',
    };
  }
}

export default async function UsernamePage({ params }: Props) {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  
  let profile = null;
  let notFound = false;

  try {
    const data = await fetchProfileData(username);
    profile = data.profile;
  } catch (err: any) {
    notFound = true;
  }

  return (
    <div className={styles.page}>
      <Hero />
      
      {notFound ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '1.5rem', color: '#ef4444', minHeight: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          profile not found
        </div>
      ) : profile ? (
        <TurnstileGate siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}>
          <ProfileClientWrapper profile={profile} />
        </TurnstileGate>
      ) : null}

      <MarketingSections />
    </div>
  );
}
