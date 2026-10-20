import { readFile } from 'node:fs/promises';

const base = String(process.env.SMOKE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) throw new Error('SMOKE_URL must be HTTPS');

const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const expectedBrand = String(process.env.SMOKE_BRAND || site.name);
const expectedRobots = String(process.env.SMOKE_EXPECT_ROBOTS || 'noindex');
const canonicalBase = String(process.env.SMOKE_CANONICAL_URL || site.url).replace(/\/$/, '');

if (expectedRobots === 'noindex' && base === canonicalBase) {
  throw new Error('refusing a noindex smoke test against the production domain');
}

let home;
for (let attempt = 1; attempt <= 5; attempt += 1) {
  home = await fetch(`${base}/`, { cache: 'no-store', headers: { 'user-agent': 'StackRowDeploymentCheck/2.0' } });
  if (home.ok) break;
  if (attempt < 5) await new Promise(resolve => setTimeout(resolve, attempt * 4000));
}
if (!home.ok) throw new Error(`/: HTTP ${home.status} after 5 attempts`);

const html = await home.text();
if (expectedBrand && !html.includes(expectedBrand)) throw new Error('/: expected brand name not found');
if (!html.includes(`<link rel="canonical" href="${canonicalBase}/">`)) throw new Error('/: canonical mismatch');
if (!html.includes(`<meta name="robots" content="${expectedRobots}`)) throw new Error(`/: expected ${expectedRobots} robots directive`);

for (const route of ['/robots.txt', '/sitemap.xml']) {
  const response = await fetch(`${base}${route}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  const text = await response.text();
  if (route === '/sitemap.xml' && !text.includes('<urlset')) throw new Error('/sitemap.xml: not a sitemap');
}

const missing = await fetch(`${base}/__smoke-test-missing-page__`, { cache: 'no-store' });
if (missing.status !== 404) throw new Error(`/404 behavior: expected HTTP 404, received ${missing.status}`);

console.log(`Smoke test passed for ${base}`);
