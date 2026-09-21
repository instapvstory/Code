import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blogData';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pvstoryviewer.com';
  
  // Static Routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/features',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Static blog posts from blogData.ts (all 16 posts)
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Also try to fetch from CMS if available (future-proofing)
  let cmsRoutes: MetadataRoute.Sitemap = [];
  try {
    const { getPublishedPosts } = await import('@/lib/cms');
    const { posts } = await getPublishedPosts(1, 1000);
    cmsRoutes = (posts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // CMS not available — static posts already included above
  }

  // Deduplicate by URL (CMS takes priority over static if same slug)
  const allBlogRoutes = [...blogRoutes, ...cmsRoutes];
  const seen = new Set<string>();
  const dedupedBlogRoutes = allBlogRoutes.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return [...staticRoutes, ...dedupedBlogRoutes];
}

