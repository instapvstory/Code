import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/blogData';
import { relatedPostsMap } from '@/lib/blogRelated';
import styles from '../blog.module.css';
import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pvstoryviewer.com';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_')) {
      const { getPostBySlug } = await import('@/lib/cms');
      const post = await getPostBySlug(slug);
      if (post) {
        return {
          title: post.title,
          excerpt: post.excerpt || '',
          content: post.content_html || '',
          date: post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          image: post.featured_image || '',
          category: post.categories?.[0]?.name || 'Uncategorized',
          author: post.author?.name || 'PvStoryViewer Editorial Team',
          authorBio: 'The PvStoryViewer editorial team writes about Instagram privacy, social media mechanics, and digital anonymity.',
          slug: post.slug,
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch post from Supabase:', e);
  }
  const staticPost = blogPosts.find((p) => p.slug === slug);
  return staticPost || null;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found' };

  const postUrl = `${SITE_URL}/blog/${slug}`;
  const ogImage = post.image || `${SITE_URL}/android-chrome-512x512.png`;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: postUrl,
      siteName: 'PvStoryViewer',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // ── Related posts (topical authority internal links) ──
  const relatedSlugs = relatedPostsMap[slug] || [];
  const relatedPosts = relatedSlugs
    .map((s) => blogPosts.find((p) => p.slug === s))
    .filter(Boolean) as typeof blogPosts;

  // ── Recent posts (3 latest, excluding current) ──
  const recentPosts = blogPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  return (
    <main className={styles.blogPage}>
      <div className={styles.container}>
        <Breadcrumb items={[
          { label: 'Blog', href: '/blog' },
          { label: post.title }
        ]} />
        <div className={styles.postContent}>

          {/* Article Header */}
          <article className={styles.postHeader}>
            <span className={styles.category}>{post.category}</span>
            <h1 className={styles.postTitle}>{post.title}</h1>
            <div className={styles.meta}>
              <span>By {post.author}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
            {('authorBio' in post) && post.authorBio && (
              <p className={styles.authorBio}>{post.authorBio}</p>
            )}
          </article>

          {/* Hero Image */}
          {post.image && (
            <div className={styles.heroImage}>
              <img src={post.image} alt={post.title} />
            </div>
          )}

          {/* Article Body */}
          <div className={styles.article}>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* ── Related Reading (topical internal links) ── */}
          {relatedPosts.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px', verticalAlign: 'middle', color: '#7c3aed' }}>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                Related Reading
              </h2>
              <div className={styles.relatedGrid}>
                {relatedPosts.map((rp) => (
                  <Link key={rp.slug} href={`/blog/${rp.slug}`} className={styles.relatedCard}>
                    {rp.image && (
                      <div className={styles.relatedCardImg}>
                        <img src={rp.image} alt={rp.title} loading="lazy" />
                      </div>
                    )}
                    <div className={styles.relatedCardBody}>
                      <span className={styles.relatedCardCategory}>{rp.category}</span>
                      <h3 className={styles.relatedCardTitle}>{rp.title}</h3>
                      <p className={styles.relatedCardExcerpt}>{rp.excerpt.slice(0, 100)}…</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Box */}
          <div className={styles.authorBox}>
            <div className={styles.authorBoxAvatar}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div className={styles.authorBoxName}>{post.author}</div>
              {('authorBio' in post) && post.authorBio && (
                <div className={styles.authorBoxBio}>{post.authorBio}</div>
              )}
            </div>
          </div>

        </div>

        {/* ── Recent Posts ── */}
        {recentPosts.length > 0 && (
          <section className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <h2 className={styles.recentTitle}>Recent Posts</h2>
              <Link href="/blog" className={styles.recentViewAll}>View All →</Link>
            </div>
            <div className={styles.recentGrid}>
              {recentPosts.map((rp) => (
                <Link key={rp.slug} href={`/blog/${rp.slug}`} className={styles.recentCard}>
                  <div className={styles.recentCardImg}>
                    <img src={rp.image} alt={rp.title} loading="lazy" />
                    <span className={styles.recentCardCategory}>{rp.category}</span>
                  </div>
                  <div className={styles.recentCardBody}>
                    <h3 className={styles.recentCardTitle}>{rp.title}</h3>
                    <p className={styles.recentCardExcerpt}>{rp.excerpt.slice(0, 90)}…</p>
                    <div className={styles.recentCardMeta}>
                      <span>{rp.author}</span>
                      <span>•</span>
                      <span>{rp.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
