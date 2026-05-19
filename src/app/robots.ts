import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/login', '/ads-demo'],
    },
    sitemap: 'https://instapsv.com/sitemap.xml',
  };
}
