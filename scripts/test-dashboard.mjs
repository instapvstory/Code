/**
 * Full dashboard API test — logs in, gets session cookie, tests all endpoints
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const https = require('https');
const http = require('http');

const BASE = 'http://localhost:3000';

async function request(method, path, body, cookieHeader = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('🔐 Logging in...');
  const loginRes = await request('POST', '/api/admin/auth/login', {
    email: 'instapvstory@gmail.com',
    password: 'QMpM9@Fu!&%c.?+'
  });
  
  const setCookieHeaders = loginRes.headers['set-cookie'];
  if (!setCookieHeaders) {
    console.log('❌ Login failed:', loginRes.status, JSON.stringify(loginRes.body));
    process.exit(1);
  }
  
  // Extract the session cookie
  const sessionCookie = setCookieHeaders
    .map(c => c.split(';')[0])
    .find(c => c.startsWith('admin_session') || c.startsWith('admin_token'));
  
  console.log('✅ Login successful! Cookie:', sessionCookie?.substring(0, 40) + '...');
  
  const endpoints = [
    ['GET', '/api/admin/dashboard'],
    ['GET', '/api/admin/settings'],
    ['GET', '/api/admin/posts'],
    ['GET', '/api/admin/categories'],
    ['GET', '/api/admin/tags'],
    ['GET', '/api/admin/ads'],
    ['GET', '/api/admin/users'],
    ['GET', '/api/admin/media'],
    ['GET', '/api/admin/ad-networks'],
  ];
  
  console.log('\n📊 Testing all dashboard APIs:\n');
  for (const [method, path] of endpoints) {
    const res = await request(method, path, null, sessionCookie);
    const ok = res.status >= 200 && res.status < 300;
    const icon = ok ? '✅' : '❌';
    const summary = ok
      ? (typeof res.body === 'object' ? Object.keys(res.body).join(', ') : 'ok')
      : JSON.stringify(res.body).substring(0, 100);
    console.log(`  ${icon} [${res.status}] ${path}`);
    if (ok && res.body?.stats) {
      const s = res.body.stats;
      console.log(`       Stats: posts=${s.totalPosts}, published=${s.publishedPosts}, categories=${s.totalCategories}, tags=${s.totalTags}, views=${s.totalViews}`);
    }
    if (ok && res.body?.settings) {
      console.log(`       Settings: ${res.body.settings.length} rows`);
      res.body.settings.slice(0,3).forEach(s => console.log(`         ${s.key} = "${s.value}"`));
    }
    if (!ok) console.log(`       Error: ${summary}`);
  }
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
