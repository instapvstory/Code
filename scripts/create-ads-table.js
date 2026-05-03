const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL to create ads table
const adsTableSQL = `
-- Ad placement management
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'custom', -- 'adsense', 'custom', 'html', 'script'
    placement VARCHAR(50) NOT NULL DEFAULT 'after_content', -- 'before_content', 'after_content', 'after_p1', 'after_p3', 'sidebar', 'between_blocks', 'header', 'footer'
    code TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'testing'
    target_devices VARCHAR(50) DEFAULT 'all', -- 'all', 'desktop', 'mobile', 'tablet'
    target_categories UUID[] DEFAULT '{}', -- Array of category IDs
    target_tags UUID[] DEFAULT '{}', -- Array of tag IDs
    priority INTEGER DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_impressions INTEGER,
    max_clicks INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ad queries
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement);
CREATE INDEX IF NOT EXISTS idx_ads_type ON ads(type);

-- Ad performance tracking
CREATE TABLE IF NOT EXISTS ad_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, date)
);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_ad_stats_date ON ad_stats(date);
CREATE INDEX IF NOT EXISTS idx_ad_stats_ad_id ON ad_stats(ad_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ad_stats_updated_at ON ad_stats;
CREATE TRIGGER update_ad_stats_updated_at BEFORE UPDATE ON ad_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample ad for testing
INSERT INTO ads (name, type, placement, code, status, target_devices, priority) VALUES
(
    'After First Paragraph',
    'adsense',
    'after_p1',
    '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-123456789" data-ad-slot="1234567890" data-ad-format="auto"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>',
    'active',
    'all',
    1
) ON CONFLICT DO NOTHING;
`;

async function createAdsTable() {
  console.log('Creating ads table...');
  
  try {
    // Split SQL into individual statements
    const statements = adsTableSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      
      try {
        // Try to execute SQL using Supabase's query method
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`Note: Could not execute via RPC: ${error.message}`);
          console.log('You may need to run this SQL directly in the Supabase SQL editor.');
        }
      } catch (err) {
        console.log(`Execution note: ${err.message}`);
      }
    }
    
    console.log('\n✅ Ads table creation script completed.');
    console.log('Note: If tables were not created, you may need to run the SQL manually in Supabase.');
    console.log('Go to: https://app.supabase.com/project/_/sql');
    console.log('And run the SQL from database/seo_monetization_schema.sql');
    
  } catch (error) {
    console.error('Error creating ads table:', error.message);
  }
}

createAdsTable();