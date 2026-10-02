/**
 * Setup CMS database tables in Supabase
 * Run with: node scripts/setup-db.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lmhlyoeuduketjclrwws.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaGx5b2V1ZHVrZXRqY2xyd3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM0NzQ1NiwiZXhwIjoyMDkxOTIzNDU2fQ.8lzTOZ8gFTS3QKHJaQBuo8W2HKxuddbSSq06TQojROU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MIGRATIONS = [
  {
    name: 'posts',
    sql: `CREATE TABLE IF NOT EXISTS posts (
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
    )`
  },
  {
    name: 'categories',
    sql: `CREATE TABLE IF NOT EXISTS categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    name: 'tags',
    sql: `CREATE TABLE IF NOT EXISTS tags (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    name: 'post_categories',
    sql: `CREATE TABLE IF NOT EXISTS post_categories (
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, category_id)
    )`
  },
  {
    name: 'post_tags',
    sql: `CREATE TABLE IF NOT EXISTS post_tags (
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    )`
  },
  {
    name: 'media',
    sql: `CREATE TABLE IF NOT EXISTS media (
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
    )`
  },
  {
    name: 'system_settings',
    sql: `CREATE TABLE IF NOT EXISTS system_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    name: 'ad_files',
    sql: `CREATE TABLE IF NOT EXISTS ad_files (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    name: 'ads',
    sql: `CREATE TABLE IF NOT EXISTS ads (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      slot TEXT NOT NULL DEFAULT 'article-inline',
      code TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    name: 'audit_logs',
    sql: `CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details JSONB,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    name: 'seed_system_settings',
    sql: `INSERT INTO system_settings (key, value, description) VALUES
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
    ON CONFLICT (key) DO NOTHING`
  },
];

async function runMigrations() {
  console.log('🚀 Starting database setup...\n');
  
  // We use supabase.rpc to run raw SQL via a helper function
  // But first, let's try using the REST API directly for DDL
  for (const migration of MIGRATIONS) {
    process.stdout.write(`Creating ${migration.name}... `);
    
    // Try inserting to check if table exists (for data tables)
    // For DDL we need to use the SQL API
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/exec_ddl`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migration.sql }),
      }
    );
    
    if (response.ok) {
      console.log('✅ done');
    } else {
      const err = await response.text();
      // Try alternative approach using supabase client
      console.log(`⚠️ RPC not available (${response.status}), trying alternative...`);
      
      // For data migrations, try direct insert
      if (migration.name === 'seed_system_settings') {
        const settings = [
          { key: 'site_name', value: 'Instapvstory', description: 'The name of your site' },
          { key: 'site_description', value: 'View Instagram stories anonymously', description: 'Site description for SEO' },
          { key: 'site_url', value: 'https://instapvstory.com', description: 'The public URL of your site' },
          { key: 'posts_per_page', value: '10', description: 'Number of posts per page' },
          { key: 'maintenance_mode', value: 'false', description: 'Enable or disable maintenance mode' },
          { key: 'google_analytics_id', value: '', description: 'Google Analytics tracking ID' },
          { key: 'contact_email', value: 'admin@instapvstory.com', description: 'Contact email address' },
          { key: 'footer_text', value: '© 2025 Instapvstory. All rights reserved.', description: 'Footer copyright text' },
          { key: 'twitter_handle', value: '', description: 'Twitter/X handle' },
          { key: 'facebook_url', value: '', description: 'Facebook page URL' },
        ];
        
        for (const s of settings) {
          const { error } = await supabase.from('system_settings').upsert(s, { onConflict: 'key' });
          if (error) console.log(`  ⚠️  ${s.key}: ${error.message}`);
          else console.log(`  ✅ ${s.key}`);
        }
      } else {
        console.log(`  ❌ Failed: ${err.substring(0, 100)}`);
      }
    }
  }
  
  // Test what tables are now accessible
  console.log('\n📊 Checking table accessibility...');
  const tables = ['posts', 'categories', 'tags', 'system_settings', 'media', 'ads', 'ad_files'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: accessible (${Array.isArray(data) ? data.length : 0} rows returned)`);
    }
  }
}

runMigrations().catch(console.error);
