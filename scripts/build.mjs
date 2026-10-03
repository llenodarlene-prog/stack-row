import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonical, cleanSlug, escapeHtml, markdownToHtml, readContent } from './lib.mjs';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const [site, navigation, assets, plan] = await Promise.all([
  readJson('data/site.json'),
  readJson('data/navigation.json'),
  readJson('data/assets.json'),
  readJson('data/content-plan.json')
]);
const buildEnv = process.env.BUILD_ENV || 'local';
const siteUrl = String(site.url).replace(/\/$/, '');
if (buildEnv === 'production' && process.env.SITE_URL && process.env.SITE_URL.replace(/\/$/, '') !== siteUrl) {
  throw new Error('SITE_URL differs from data/site.json');
}
const indexable = buildEnv === 'production' && site.launch_status === 'ready';
const dist = path.resolve('dist');

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}

await mkdir(dist, { recursive: true });
await cp('src/styles', path.join(dist, 'styles'), { recursive: true });
await cp('src/scripts', path.join(dist, 'scripts'), { recursive: true });
for (const asset of assets.filter(item => item.deploy !== false)) {
  const source = asset.path.replace(/^\//, '');
  const target = path.join(dist, source);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
}

const contentFiles = (await files('content')).filter(file => file.endsWith('.md')).sort();
const all = [];
const routes = new Map();
for (const file of contentFiles) {
  const { metadata, body } = await readContent(file);
  for (const field of ['title', 'description', 'slug', 'type']) {
    if (!metadata[field]) throw new Error(`${file}: missing ${field}`);
  }
  if (!/^\/(?:$|.*\/)$/.test(metadata.slug)) throw new Error(`${file}: invalid slug`);
  if (routes.has(metadata.slug)) throw new Error(`${file}: duplicate route ${metadata.slug}`);
  routes.set(metadata.slug, file);
  all.push({ ...metadata, body, source: file });
}
const visible = all.filter(item => !(buildEnv === 'production' && item.draft === true));
const posts = visible.filter(item => ['article', 'blog'].includes(item.type));
const publishedPosts = posts.filter(item => item.draft !== true);

const navLinks = items => items.map(item => `<li><a href="${item.url}">${escapeHtml(item.label)}</a></li>`).join('');
const cards = items => items.length
  ? `<div class="card-grid">${items.map(item => `<article class="card"><p class="eyebrow">${escapeHtml(item.type)}${item.draft ? ' · Draft' : ''}</p><h3><a href="${item.slug}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></article>`).join('')}</div>`
  : '<p>No published research is available in this section yet.</p>';

function schemaFor(item, url) {
  if (['article', 'blog'].includes(item.type)) {
    return {
      '@context': 'https://schema.org',
      '@type': item.type === 'blog' ? 'BlogPosting' : 'Article',
      headline: item.title,
      description: item.description,
      url,
      datePublished: item.published || undefined,
      dateModified: item.modified || item.published || undefined,
      author: item.author ? { '@type': 'Person', name: item.author } : undefined,
      publisher: { '@type': 'Organization', name: site.name, url: siteUrl }
    };
  }
  return { '@context': 'https://schema.org', '@type': item.type === 'hub' ? 'CollectionPage' : 'WebPage', name: item.title, description: item.description, url };
}

const pageRecords = [];
for (const item of visible) {
  const url = canonical(siteUrl, item.slug);
  const draft = item.draft === true;
  const robots = indexable && !draft ? 'index,follow' : 'noindex,nofollow,noarchive';
  let body = markdownToHtml(item.body);
  if (item.type === 'home') body += `<section><h2>Latest research</h2>${cards(posts.slice(0, 6))}</section>`;
  if (item.type === 'hub') body += `<section><h2>${buildEnv === 'production' ? 'Published research' : 'Research pipeline'}</h2>${cards(posts.filter(post => post.slug.startsWith(item.slug)))}</section>`;
  const fullTitle = item.seo_title || `${item.title} | ${site.name}`;
  const schema = JSON.stringify(schemaFor(item, url)).replaceAll('<', '\\u003c');
  const html = `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(item.description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${['article','blog'].includes(item.type) ? 'article' : 'website'}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(item.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${siteUrl}/assets/brand/stack-row-icon.png">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Sora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles/main.css">
  <script src="/scripts/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header"><a class="brand" href="/"><img src="/assets/brand/stack-row-horizontal.png" alt="Stack Row" width="260" height="146"></a><button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav">Menu</button><nav id="primary-nav" aria-label="Primary"><ul>${navLinks(navigation.primary)}</ul></nav></header>
  <main id="content" class="shell"><article class="prose">${draft ? '<p class="draft-banner">Editorial draft. Not approved for publication.</p>' : ''}${body}</article></main>
  <footer class="site-footer"><div><strong>${escapeHtml(site.name)}</strong><p>${escapeHtml(site.tagline)}</p></div><nav aria-label="Footer"><ul>${navLinks(navigation.footer)}</ul></nav><p class="copyright">© ${new Date().getUTCFullYear()} Stack Row. All rights reserved.</p></footer>
</body>
</html>`;
  const target = item.slug === '/' ? path.join(dist, 'index.html') : path.join(dist, cleanSlug(item.slug), 'index.html');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
  pageRecords.push({ slug: item.slug, source: item.source, draft, type: item.type, url });
}

const indexed = visible.filter(item => item.draft !== true && item.noindex !== true);
const sitemap = indexed.map(item => `  <url><loc>${canonical(siteUrl, item.slug)}</loc>${item.modified || item.published ? `<lastmod>${escapeHtml(item.modified || item.published)}</lastmod>` : ''}</url>`).join('\n');
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
const feedEntries = publishedPosts.slice(0, 20).map(item => `<entry><title>${escapeHtml(item.title)}</title><id>${canonical(siteUrl, item.slug)}</id><link href="${canonical(siteUrl, item.slug)}"/><updated>${item.modified || item.published}T00:00:00Z</updated></entry>`).join('');
await writeFile(path.join(dist, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>${site.name}</title><id>${siteUrl}/</id><link href="${siteUrl}/feed.xml" rel="self"/>${feedEntries}</feed>\n`);
await writeFile(path.join(dist, 'robots.txt'), indexable ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
await cp('src/static/.htaccess', path.join(dist, '.htaccess'));
await writeFile(path.join(dist, 'build-manifest.json'), JSON.stringify({ site: site.name, environment: buildEnv, indexable, pages: pageRecords, planItems: plan.length }, null, 2) + '\n');
console.log(`Built ${pageRecords.length} pages for ${site.name} (${buildEnv}; indexable=${indexable})`);
