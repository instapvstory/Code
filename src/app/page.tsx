import Hero from '@/components/layout/Hero/Hero';
import MarketingSections from '@/components/layout/MarketingSections/MarketingSections';

export default async function Home() {
  let initialPosts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    image: string;
    category: string;
    author: string;
  }> = [];
  try {
    const { getPublishedPosts } = await import('@/lib/cms');
    const { posts } = await getPublishedPosts(1, 3);
    if (posts && posts.length > 0) {
      initialPosts = posts.map((p: any) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || '',
        date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
        image: p.featured_image || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop',
        category: p.categories?.[0]?.name || 'Uncategorized',
        author: p.author?.name || 'Admin',
      }));
    }
  } catch (err) {
    console.error('Failed to fetch initial home posts:', err);
  }

  return (
    <main>
      <Hero />
      <MarketingSections initialPosts={initialPosts} />
    </main>
  );
}
