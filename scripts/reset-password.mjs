import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'db.lmhlyoeuduketjclrwws.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'QMpM9@Fu!&%c.?+',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Get current hash for both admins
const r = await client.query("SELECT email, password_hash FROM admin_users ORDER BY email");
for (const row of r.rows) {
  const matches = await bcrypt.compare('QMpM9@Fu!&%c.?+', row.password_hash || '');
  console.log(`${row.email}: hash_prefix=${row.password_hash?.substring(0,20)}... matches_current_pw=${matches}`);
}

// Reset password for BOTH users to the known password
const newHash = await bcrypt.hash('QMpM9@Fu!&%c.?+', 10);
await client.query(
  "UPDATE admin_users SET password_hash = $1 WHERE email IN ('instapvstory@gmail.com', 'admin@instapvstory.com')",
  [newHash]
);
console.log('\n✅ Password reset for both admin accounts');
console.log('   Email 1: instapvstory@gmail.com');
console.log('   Email 2: admin@instapvstory.com');
console.log('   Password: QMpM9@Fu!&%c.?+');

await client.end();
