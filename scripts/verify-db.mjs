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

await client.connect();

// Check ads table schema
const adsSchema = await client.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ads' ORDER BY ordinal_position;`
);
console.log('=== ads table columns ===');
adsSchema.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

// Check RLS policies
const rls = await client.query(
  `SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('posts','categories','tags','system_settings','media','ad_files') ORDER BY tablename;`
);
console.log('\n=== RLS Policies ===');
if (rls.rows.length === 0) {
  console.log('  (none yet - may need to add)');
} else {
  rls.rows.forEach(r => console.log(`  ${r.tablename}: ${r.policyname}`));
}

// Check all settings count
const settings = await client.query('SELECT COUNT(*) as cnt FROM system_settings;');
console.log(`\n=== Settings rows: ${settings.rows[0].cnt} ===`);

// Fix: Add permissive RLS policies so service_role can access tables
const policySQL = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON posts FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON categories FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON tags FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_categories' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON post_categories FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_tags' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON post_tags FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON media FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON system_settings FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_files' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON ad_files FOR ALL USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY service_role_all ON audit_logs FOR ALL USING (true)';
  END IF;
END $$;
`;

console.log('\n🔒 Adding RLS policies...');
await client.query(policySQL);
console.log('✅ RLS policies set!');

// Verify all settings
const allSettings = await client.query('SELECT key, value FROM system_settings ORDER BY key;');
console.log('\n=== All System Settings ===');
allSettings.rows.forEach(r => console.log(`  ${r.key} = "${r.value}"`));

// Add ads table slot column if missing
const adsColCheck = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'slot';`
);
if (adsColCheck.rows.length === 0) {
  console.log('\n⚠️  ads table missing "slot" column - adding...');
  await client.query(`ALTER TABLE ads ADD COLUMN IF NOT EXISTS slot TEXT DEFAULT 'article-inline';`);
  console.log('✅ slot column added');
} else {
  console.log('\n✅ ads table has slot column');
}

// Check ads table has impressions and clicks columns
const adsClicksCheck = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'ads' AND column_name IN ('impressions','clicks');`
);
console.log(`  ads impressions/clicks columns: ${adsClicksCheck.rows.map(r => r.column_name).join(', ') || 'missing'}`);
if (adsClicksCheck.rows.length < 2) {
  await client.query(`
    ALTER TABLE ads ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
    ALTER TABLE ads ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
  `);
  console.log('  ✅ Added impressions and clicks columns');
}

await client.end();
console.log('\n🎉 All done!');
