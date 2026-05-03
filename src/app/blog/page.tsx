import Link from 'next/link';
import styles from './blog.module.css';
import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import { blogPosts } from '@/lib/blogData';

// Try to fetch from Supabase, merge with static data
async function getBlogPosts() {
  let dynamicPosts: any[] = [];
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_')) {
      const { getPublishedPosts } = await import('@/lib/cms');
      const { posts } = await getPublishedPosts(1, 20);
      if (posts && posts.length > 0) {
        dynamicPosts = posts.map((p: any) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || '',
          date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          image: p.featured_image || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop',
          category: p.categories?.[0]?.name || 'Uncategorized',
          author: p.author?.name || 'Admin',
        }));
      }
    }
  } catch (e) {
    console.error('Failed to fetch from Supabase, using static data:', e);
  }

  // Filter out any static posts that might have the same slug as dynamic posts
  const dynamicSlugs = new Set(dynamicPosts.map(p => p.slug));
  const uniqueStaticPosts = blogPosts.filter(p => !dynamicSlugs.has(p.slug));

  return [...dynamicPosts, ...uniqueStaticPosts];
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className={styles.blogPage}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: 'Blog' }]} />
        <h1 className={styles.heading}>Blog</h1>
        <p className={styles.subheading}>
          Tips, guides, and insights about Instagram privacy and anonymous viewing.
        </p>
        <div className={styles.postsGrid}>
          {posts.map((post: any) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className={styles.postCard}>
              <div className={styles.postImageContainer}>
                <img src={post.image} alt={post.title} className={styles.postImage} />
                <span className={styles.categoryBadge}>{post.category}</span>
              </div>
              <div className={styles.postBody}>
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postExcerpt}>{post.excerpt}</p>
                <div className={styles.postMeta}>
                  <span>{post.author}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
