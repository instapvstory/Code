/**
 * Migrate all static blogData.ts posts into the Supabase posts table
 * Run with: node scripts/migrate-posts.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({
  host: 'db.lmhlyoeuduketjclrwws.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'QMpM9@Fu!&%c.?+',
  ssl: { rejectUnauthorized: false },
});

// ─── All 16 blog posts data ─────────────────────────────────────────────────
// Extracted from blogData.ts (title, slug, excerpt, category, date, image, author)
const POSTS = [
  {
    slug: 'how-to-view-instagram-stories-anonymously',
    title: 'How to View Instagram Stories Anonymously in 2026 (Complete Guide)',
    excerpt: "Instagram notifies story owners when someone views their content. This guide covers every method — from workarounds to purpose-built tools — and explains exactly why each one does or doesn't protect your identity.",
    category: 'Tutorials',
    date: 'April 12, 2026',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'protecting-your-privacy-on-instagram',
    title: 'Protecting Your Privacy on Instagram: A Practical, Non-Paranoid Guide',
    excerpt: 'Instagram collects more data than most users realize. This guide walks through what the platform actually tracks, which settings meaningfully reduce your exposure, and when using an external viewer is the smarter choice.',
    category: 'Privacy',
    date: 'April 10, 2026',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'benefits-of-anonymous-competitor-research',
    title: 'The Real Benefits of Anonymous Competitor Research on Instagram',
    excerpt: "Knowing what your competitors are doing on Instagram is valuable. Letting them know you're watching isn't. This guide explains how anonymous research works and why it matters for business strategy.",
    category: 'Marketing',
    date: 'April 8, 2026',
    image: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'instagram-business-vs-creator-vs-personal-account',
    title: 'Instagram Business vs Creator vs Personal Account: Which Is Right for You?',
    excerpt: 'Choosing the wrong Instagram account type costs you access to tools, analytics, and features. This breakdown covers what each account type actually offers and the privacy implications of each.',
    category: 'Guides',
    date: 'April 6, 2026',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'how-instagram-story-views-work',
    title: 'How Instagram Story Views Work: The Technical Reality',
    excerpt: 'Understanding how Instagram logs story views technically — what triggers the notification, when data is sent to servers, and what this means for anonymity — is essential for anyone concerned about privacy.',
    category: 'Explained',
    date: 'April 4, 2026',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'is-it-legal-to-view-public-instagram-profiles',
    title: 'Is It Legal to View Public Instagram Profiles Anonymously?',
    excerpt: 'The legal landscape around anonymous viewing of public social media is widely misunderstood. This article covers what privacy law actually says about viewing publicly posted content.',
    category: 'Legal',
    date: 'April 2, 2026',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'instagram-competitor-research-guide-for-marketers',
    title: 'Instagram Competitor Research: The Complete Guide for Marketers',
    excerpt: 'Effective Instagram competitor research requires more than occasionally checking a rival account. This guide explains how to build a systematic approach to competitive intelligence on Instagram.',
    category: 'Marketing',
    date: 'March 31, 2026',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'parents-guide-monitoring-public-instagram-accounts',
    title: "Parents' Guide to Monitoring Public Instagram Accounts",
    excerpt: 'Understanding what your children are exposed to on public Instagram accounts is a legitimate parenting concern. This guide explains what parents can and cannot see, and how anonymous viewing tools fit into responsible monitoring.',
    category: 'Parenting',
    date: 'March 29, 2026',
    image: 'https://images.unsplash.com/photo-1591035897819-f4bdf739f446?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'instagram-research-methods-for-academics',
    title: 'Instagram Research Methods for Academics and Journalists',
    excerpt: 'Social media research raises specific methodological and ethical questions. This guide covers practical approaches for academics and journalists researching public Instagram accounts.',
    category: 'Research',
    date: 'March 27, 2026',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'instagram-seen-receipts-browse-without-leaving-trace',
    title: 'Instagram "Seen" Receipts: How to Browse Without Leaving a Trace',
    excerpt: "Instagram's read receipts and view notifications create a trail of your activity. This guide explains exactly what generates these receipts and how to browse without triggering them.",
    category: 'Privacy',
    date: 'March 25, 2026',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'understanding-instagram-algorithm-public-posts',
    title: 'Understanding the Instagram Algorithm for Public Posts',
    excerpt: "Instagram's algorithm determines what content gets seen. Understanding how it works helps both content creators and researchers understand why certain content surfaces in public feeds.",
    category: 'Explained',
    date: 'March 23, 2026',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'influencer-vetting-guide-brand-partnerships',
    title: 'The Complete Influencer Vetting Guide for Brand Partnerships',
    excerpt: 'Due diligence before any influencer partnership is essential. This guide covers what to research, how to research it discreetly, and what red flags to look for in public content history.',
    category: 'Marketing',
    date: 'March 21, 2026',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'ethics-of-viewing-public-social-media-content',
    title: 'The Ethics of Viewing Public Social Media Content',
    excerpt: 'Just because content is publicly available does not mean every use of it is ethically equivalent. This article explores the ethical dimensions of anonymous social media viewing.',
    category: 'Ethics',
    date: 'March 19, 2026',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'research-instagram-trends-without-account',
    title: 'How to Research Instagram Trends Without an Account',
    excerpt: "You don't need an Instagram account to research what's trending on the platform. This guide explains tools and methods for tracking Instagram trends from the outside.",
    category: 'Research',
    date: 'March 17, 2026',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'instagram-highlights-explained',
    title: 'Instagram Highlights Explained: What They Are and How to View Them',
    excerpt: 'Instagram Highlights are a permanent collection of selected Stories. This guide explains how they work, who can see them, and how they differ from regular Stories in terms of privacy.',
    category: 'Tutorials',
    date: 'March 15, 2026',
    image: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?q=80&w=800&auto=format&fit=crop',
  },
  {
    slug: 'instagram-data-collection-what-does-instagram-know',
    title: 'Instagram Data Collection: What Does Instagram Actually Know About You?',
    excerpt: "Meta's data collection through Instagram is extensive and often misunderstood. This breakdown explains exactly what data Instagram collects, how it's used, and what you can do about it.",
    category: 'Privacy',
    date: 'March 13, 2026',
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=800&auto=format&fit=crop',
  },
];

// Map of category name → category ID (we'll create them)
const CATEGORY_COLORS = {
  'Tutorials': '#6366f1',
  'Privacy': '#ec4899',
  'Marketing': '#10b981',
  'Guides': '#3b82f6',
  'Explained': '#f59e0b',
  'Legal': '#8b5cf6',
  'Parenting': '#14b8a6',
  'Research': '#f97316',
  'Ethics': '#64748b',
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function parseDate(dateStr) {
  // e.g. "April 12, 2026"
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function estimateReadingTime(excerpt) {
  const words = excerpt.split(/\s+/).length;
  return Math.max(5, Math.ceil(words * 8)); // blog posts ~5-15 min read
}

async function migrate() {
  await client.connect();
  console.log('✅ Connected to Supabase Postgres\n');

  // Get the first admin user ID to use as author
  const { rows: adminRows } = await client.query(
    "SELECT id FROM admin_users WHERE is_active = true ORDER BY created_at LIMIT 1"
  );
  if (!adminRows.length) { console.error('❌ No admin users found!'); process.exit(1); }
  const authorId = adminRows[0].id;
  console.log(`👤 Using author ID: ${authorId}\n`);

  // ─── Create categories ───────────────────────────────────────────────────
  console.log('📁 Creating categories...');
  const categoryMap = {}; // name → id

  const uniqueCategories = [...new Set(POSTS.map(p => p.category))];
  for (const catName of uniqueCategories) {
    const catSlug = slugify(catName);
    const { rows } = await client.query(
      `INSERT INTO categories (name, slug, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [catName, catSlug]
    );
    categoryMap[catName] = rows[0].id;
    console.log(`  ✅ ${catName} → ${rows[0].id}`);
  }

  // ─── Insert posts ────────────────────────────────────────────────────────
  console.log('\n📝 Migrating posts...');
  let created = 0;
  let skipped = 0;

  for (const post of POSTS) {
    // Check if already exists
    const { rows: existing } = await client.query(
      'SELECT id FROM posts WHERE slug = $1',
      [post.slug]
    );
    if (existing.length) {
      console.log(`  ⏩ SKIP: ${post.slug} (already exists)`);
      skipped++;
      continue;
    }

    const publishedAt = parseDate(post.date);
    const readingTime = estimateReadingTime(post.excerpt);
    const contentHtml = `<p>${post.excerpt}</p><p><em>Full article content is served from the static blogData.ts file.</em></p>`;

    // Insert post
    const { rows: postRows } = await client.query(
      `INSERT INTO posts (
        title, slug, excerpt, content, content_html, featured_image,
        author_id, status, published_at, reading_time, view_count,
        is_featured, meta_title, meta_description, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, 'published', $8, $9, 0,
        false, $1, $3, $8, $8
      ) RETURNING id`,
      [
        post.title,
        post.slug,
        post.excerpt,
        JSON.stringify({ type: 'static', source: 'blogData.ts' }),
        contentHtml,
        post.image,
        authorId,
        publishedAt,
        readingTime,
      ]
    );
    const postId = postRows[0].id;

    // Link to category
    if (categoryMap[post.category]) {
      await client.query(
        'INSERT INTO post_categories (post_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [postId, categoryMap[post.category]]
      );
    }

    console.log(`  ✅ ${post.slug}`);
    created++;
  }

  // ─── Final stats ─────────────────────────────────────────────────────────
  console.log(`\n📊 Results:`);
  console.log(`  Created: ${created} posts`);
  console.log(`  Skipped: ${skipped} posts (already in DB)`);

  const { rows: countRows } = await client.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status='published') AS published,
      COUNT(*) FILTER (WHERE status='draft') AS drafts,
      COUNT(*) AS total
    FROM posts;
  `);
  const { rows: catCount } = await client.query('SELECT COUNT(*) AS total FROM categories;');
  console.log(`\n✅ Database now has:`);
  console.log(`  ${countRows[0].total} total posts (${countRows[0].published} published, ${countRows[0].drafts} drafts)`);
  console.log(`  ${catCount[0].total} categories`);

  await client.end();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(e => { console.error('❌ Migration failed:', e.message); process.exit(1); });
