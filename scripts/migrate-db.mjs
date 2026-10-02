/**
 * Direct Postgres migration script for Instapvstory CMS tables
 * Uses pg library to connect to Supabase Postgres directly
 * Run with: node scripts/migrate-db.mjs
 */

// Wait for pg to be available
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Client } = require('pg');

// Supabase Postgres connection details
// Format: postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const PROJECT_REF = 'lmhlyoeuduketjclrwws';

// We need the database password. Let's try the service role key as password (doesn't work)
// Instead, try connecting via the Supabase pooler
const connectionConfig = {
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  // The password is the Supabase DB password set during project creation
  // We'll try the service role JWT as password first
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD',
  ssl: { rejectUnauthorized: false },
};

const FULL_SCHEMA_SQL = `
-- CMS Tables Setup for Instapvstory.com
-- ============================================

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB,
  content_html TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  published_at TIMESTAMPTZ,
  reading_time INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post categories junction
CREATE TABLE IF NOT EXISTS post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Post tags junction
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Media table
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad files table
CREATE TABLE IF NOT EXISTS ad_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('site_name', 'Instapvstory', 'The name of your site'),
  ('site_description', 'View Instagram stories anonymously', 'Site description for SEO'),
  ('site_url', 'https://instapvstory.com', 'The public URL of your site'),
  ('posts_per_page', '10', 'Number of posts to show per page'),
  ('maintenance_mode', 'false', 'Enable or disable maintenance mode'),
  ('google_analytics_id', '', 'Google Analytics tracking ID'),
  ('contact_email', 'admin@instapvstory.com', 'Contact/support email address'),
  ('footer_text', '© 2025 Instapvstory. All rights reserved.', 'Footer copyright text'),
  ('twitter_handle', '', 'Twitter/X handle (without @)'),
  ('facebook_url', '', 'Facebook page URL')
ON CONFLICT (key) DO NOTHING;
`;

async function migrate() {
  const client = new Client(connectionConfig);
  
  try {
    console.log(`🔌 Connecting to Supabase Postgres at ${connectionConfig.host}...`);
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('🔨 Running schema migration...');
    await client.query(FULL_SCHEMA_SQL);
    console.log('✅ Schema migration complete!\n');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('posts', 'categories', 'tags', 'system_settings', 'media', 'ad_files', 'audit_logs', 'post_categories', 'post_tags')
      ORDER BY table_name;
    `);
    
    console.log('📊 Verified tables:');
    result.rows.forEach(row => console.log(`  ✅ ${row.table_name}`));
    
    // Check settings count
    const settingsResult = await client.query('SELECT COUNT(*) FROM system_settings;');
    console.log(`\n⚙️  Settings rows: ${settingsResult.rows[0].count}`);
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.message.includes('password')) {
      console.log('\n💡 Tip: You need to provide the DB_PASSWORD env variable.');
      console.log('   Get it from: Supabase Dashboard → Project Settings → Database → Connection string');
      console.log('   Run: DB_PASSWORD="your-password" node scripts/migrate-db.mjs');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
