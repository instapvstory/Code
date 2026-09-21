const fs = require("fs");
const path = require("path");

// Extract all blog slugs from blogData.ts
const content = fs.readFileSync(path.join(__dirname, "../src/lib/blogData.ts"), "utf8");
const regex = /slug:\s*['"`]([^'"`]+)['"`]/g;
const slugs = [];
let match;
while ((match = regex.exec(content)) !== null) {
  slugs.push(match[1].trim());
}

const BASE_URL = "https://pvstoryviewer.com";
const urls = slugs.map(s => BASE_URL + "/blog/" + s);

console.log("Found " + urls.length + " blog posts:\n");
urls.forEach((u, i) => console.log("  " + (i + 1) + ". " + u));

// Ping Google and Bing sitemaps
const SITEMAP_URL = BASE_URL + "/sitemap.xml";
const pingUrls = [
  "https://www.google.com/ping?sitemap=" + encodeURIComponent(SITEMAP_URL),
  "https://www.bing.com/ping?sitemap=" + encodeURIComponent(SITEMAP_URL),
];

console.log("\nPinging sitemap to Google & Bing...\n");
Promise.all(
  pingUrls.map(u =>
    fetch(u)
      .then(r => ({ url: u, status: r.status, ok: r.ok }))
      .catch(e => ({ url: u, error: e.message, ok: false }))
  )
).then(results => {
  results.forEach(r => {
    if (r.ok) {
      console.log("  PINGED: " + r.url + " -> " + r.status);
    } else {
      console.log("  FAILED: " + r.url + " -> " + (r.error || r.status));
    }
  });
  console.log("\nAll blog URLs for manual GSC submission:");
  urls.forEach((u, i) => console.log("  " + (i + 1) + ". " + u));
  console.log("\nDone. Google will recrawl your sitemap within 24-48 hours.");
});
