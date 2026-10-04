/**
 * Save RevBid ads.txt via the local Next.js API (login + POST)
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');
const fs = require('fs');

const ADS_TXT = fs.readFileSync('scripts/revbid-ads.txt', 'utf-8');

function request(method, path, body, cookieHeader = '') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'localhost', port: 3000,
      path, method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const loginRes = await request('POST', '/api/admin/auth/login', {
  email: 'instapvstory@gmail.com',
  password: 'QMpM9@Fu!&%c.?+',
});
if (loginRes.status !== 200) { console.error('Login failed:', loginRes.body); process.exit(1); }
const cookie = loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
console.log('✅ Logged in');

const saveRes = await request('POST', '/api/admin/ad-networks', {
  file: 'ads.txt',
  content: ADS_TXT,
}, cookie);

console.log('Status:', saveRes.status);
console.log('Response:', JSON.stringify(saveRes.body, null, 2));
