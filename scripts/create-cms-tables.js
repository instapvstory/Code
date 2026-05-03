const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  console.log('Executing SQL...');
  
  // For Supabase, we need to use the SQL API or REST API
  // Since we can't directly execute SQL via the client, we'll create tables through the REST API
  // by making requests to the Supabase REST API
  
  // This is a simplified approach - in production you'd use migrations or the SQL editor
  console.log('📝 SQL to execute (first 500 chars):');
  console.log(sql.substring(0, 500) + '...');
  
  console.log('\n⚠️  Note: To execute this SQL, you need to:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Paste the SQL from database/blog_cms_schema.sql');
  console.log('4. Click "Run"');
  
  return { success: true };
}

async function checkTables() {
  console.log('\n🔍 Checking existing tables...');
  
  const tables = ['posts', 'categories', 'tags', 'seo_settings', 'ads', 'domains'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') { // table does not exist
          console.log(`  ❌ Table "${table}" does not exist`);
        } else {
          console.log(`  ⚠️  Error checking table "${table}": ${error.message}`);
        }
      } else {
        console.log(`  ✅ Table "${table}" exists (${data?.length || 0} rows)`);
      }
    } catch (err) {
      console.log(`  ❌ Exception checking table "${table}": ${err.message}`);
    }
  }
}

async function createSampleData() {
  console.log('\n📝 Creating sample data for testing...');
  
  // Try to insert sample categories
  try {
    const { error: catError } = await supabase
      .from('categories')
      .insert([
        {
          name: 'Technology',
          slug: 'technology',
          description: 'Latest tech news and tutorials',
          is_active: true
        },
        {
          name: 'Marketing',
          slug: 'marketing',
          description: 'Digital marketing strategies',
          is_active: true
        },
        {
          name: 'SEO',
          slug: 'seo',
          description: 'Search engine optimization tips',
          is_active: true
        }
      ]);
    
    if (catError) {
      console.log(`  ⚠️  Could not insert categories: ${catError.message}`);
    } else {
      console.log('  ✅ Created sample categories');
    }
  } catch (err) {
    console.log(`  ❌ Error creating categories: ${err.message}`);
  }
  
  // Try to insert sample tags
  try {
    const { error: tagError } = await supabase
      .from('tags')
      .insert([
        { name: 'Next.js', slug: 'nextjs' },
        { name: 'React', slug: 'react' },
        { name: 'TypeScript', slug: 'typescript' },
        { name: 'Supabase', slug: 'supabase' },
        { name: 'SEO', slug: 'seo' }
      ]);
    
    if (tagError) {
      console.log(`  ⚠️  Could not insert tags: ${tagError.message}`);
    } else {
      console.log('  ✅ Created sample tags');
    }
  } catch (err) {
    console.log(`  ❌ Error creating tags: ${err.message}`);
  }
  
  // Try to insert a sample post
  try {
    const { error: postError } = await supabase
      .from('posts')
      .insert([
        {
          title: 'Welcome to Our Blog',
          slug: 'welcome-to-our-blog',
          excerpt: 'Welcome to our new blog platform built with Next.js and Supabase',
          content: '<p>This is the first post on our new blog platform.</p><p>We are excited to share content about technology, marketing, and SEO.</p>',
          content_html: '<p>This is the first post on our new blog platform.</p><p>We are excited to share content about technology, marketing, and SEO.</p>',
          status: 'published',
          author_id: null, // Will be set to admin user
          featured_image: null,
          is_featured: true,
          meta_title: 'Welcome to Our Blog - Instapvstory',
          meta_description: 'Welcome to our new blog platform built with Next.js and Supabase',
          published_at: new Date().toISOString()
        }
      ]);
    
    if (postError) {
      console.log(`  ⚠️  Could not insert post: ${postError.message}`);
    } else {
      console.log('  ✅ Created sample post');
    }
  } catch (err) {
    console.log(`  ❌ Error creating post: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 CMS Tables Setup Script');
  console.log('==========================');
  
  await checkTables();
  
  console.log('\n📋 Instructions for setting up tables:');
  console.log('1. Open your Supabase project dashboard');
  console.log('2. Go to "SQL Editor"');
  console.log('3. Copy the SQL from database/blog_cms_schema.sql');
  console.log('4. Paste and run it to create posts, categories, tags tables');
  console.log('5. Copy the SQL from database/seo_monetization_schema.sql');
  console.log('6. Paste and run it to create SEO & monetization tables');
  
  console.log('\n📁 SQL files location:');
  console.log(`   - Blog CMS Schema: ${path.join(process.cwd(), 'database/blog_cms_schema.sql')}`);
  console.log(`   - SEO Schema: ${path.join(process.cwd(), 'database/seo_monetization_schema.sql')}`);
  
  // Try to create sample data if tables exist
  await createSampleData();
  
  console.log('\n✅ Setup instructions complete');
  console.log('\nAfter creating tables, test the admin dashboard at:');
  console.log('   http://localhost:3000/admin/posts');
}

main().catch(console.error);