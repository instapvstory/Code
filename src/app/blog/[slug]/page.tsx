import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/blogData';
import styles from '../blog.module.css';
import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import ContentAdInserter from '@/components/ads/ContentAdInserter';

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
          author: post.author?.name || 'Admin',
          slug: post.slug,
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch post from Supabase:', e);
  }
  // Fallback to static data
  const staticPost = blogPosts.find((p) => p.slug === slug);
  return staticPost || null;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} - PvStoryViewer`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className={styles.blogPage}>
      <div className={styles.container}>
        <Breadcrumb items={[
          { label: 'Blog', href: '/blog' },
          { label: post.title }
        ]} />
        <div className={styles.postContent}>
          <article className={styles.postHeader}>
            <span className={styles.category}>{post.category}</span>
            <h1 className={styles.postTitle}>{post.title}</h1>
            <div className={styles.meta}>
              <span>By {post.author}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
          </article>

          {post.image && (
            <div className={styles.heroImage}>
              <img src={post.image} alt={post.title} />
            </div>
          )}

          <div className={styles.article}>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>
      </div>
    </main>
  );
}
