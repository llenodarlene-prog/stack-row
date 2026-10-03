import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { icon } from './icons.mjs';
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
const dist = path.resolve(process.env.OUT_DIR || 'dist');

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
const isPost = item => ['article', 'blog'].includes(item.type);
const planById = new Map(plan.map((item, index) => [item.id, { ...item, index }]));
const visible = all.filter(item => !(buildEnv === 'production' && item.draft === true));
const bySlug = new Map(visible.map(item => [item.slug, item]));
const posts = visible.filter(isPost).sort((a, b) => (planById.get(a.content_id)?.index ?? 99) - (planById.get(b.content_id)?.index ?? 99));
const publishedPosts = posts.filter(item => item.draft !== true);
const hubs = visible.filter(item => item.type === 'hub');
const assetByPath = new Map(assets.map(asset => [asset.path, asset]));

// Internal links may only point at routes that exist in this build, so a
// production build never links to an excluded draft.
const staticRoutes = new Set(['/sitemap.xml', '/feed.xml']);
const isAvailable = href => !href.startsWith('/') || bySlug.has(href.split('#')[0]) || staticRoutes.has(href);
const unlink = markdown => markdown.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (match, text, href) => isAvailable(href) ? match : text);
const render = markdown => markdownToHtml(unlink(markdown));
const minutes = item => Math.max(1, Math.round(item.body.split(/\s+/).length / 220));
const anchor = text => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function image(key, { sizes, eager = false, decorative = false }) {
  const large = assetByPath.get(`/assets/images/${key}-1600.jpg`);
  const small = assetByPath.get(`/assets/images/${key}-800.jpg`);
  if (!large || !small) throw new Error(`unknown image: ${key}`);
  return `<img src="${small.path}" srcset="${small.path} ${small.width}w, ${large.path} ${large.width}w" sizes="${sizes}" width="${large.width}" height="${large.height}" alt="${decorative ? '' : escapeHtml(large.alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
}

const typeLabels = { article: 'Article', blog: 'Blog' };
const pills = item => `<span class="pill pill-${item.type}">${typeLabels[item.type]}</span>${item.draft ? '<span class="pill pill-draft">Draft</span>' : ''}`;

function cardKind(entry) {
  const target = entry.href ? bySlug.get(entry.href) : null;
  if (target?.type === 'hub') return 'topic';
  if (target && isPost(target)) return 'post';
  return entry.text ? 'feature' : 'chip';
}

function card(entry) {
  const { title, href, text } = entry;
  const target = href ? bySlug.get(href) : null;
  const kind = cardKind(entry);
  const glyph = entry.icon || (kind === 'topic' ? target.icon : '');
  const badge = glyph ? `<span class="icon-badge">${icon(glyph)}</span>` : '';
  if (kind === 'chip') return `<li class="chip">${badge}<span>${escapeHtml(title)}</span></li>`;
  const media = kind === 'topic' && target.image ? `<div class="card-media">${image(target.image, { sizes: '(min-width: 900px) 380px, 100vw', decorative: true })}</div>` : '';
  const label = kind === 'post' ? `<p class="pill-row">${pills(target)}</p>` : '';
  const heading = href ? `<a href="${href}">${escapeHtml(title)}</a>` : escapeHtml(title);
  const more = href ? `<span class="card-more" aria-hidden="true">${kind === 'topic' ? 'Explore' : 'Read'} ${icon('arrow-right')}</span>` : '';
  return `<article class="card card-${kind}">${media}<div class="card-body">${badge}${label}<h3>${heading}</h3>${text ? render(text) : ''}${more}</div></article>`;
}

function parseCards(lines) {
  const cards = [];
  for (const line of lines) {
    const heading = line.match(/^###\s+(?:\[([^\]]+)\]\(([^)\s]+)\)|(.+?))(?:\s+\{icon:([a-z-]+)\})?$/);
    if (heading) cards.push({ title: heading[1] || heading[3], href: heading[2] || '', icon: heading[4] || '', text: '' });
    else if (line.trim() && cards.length) cards.at(-1).text = `${cards.at(-1).text} ${line.trim()}`.trim();
  }
  return cards.filter(item => isAvailable(item.href));
}

function cardGrid(cards) {
  const kind = cardKind(cards[0]);
  if (kind === 'chip') return `<ul class="chip-row">${cards.map(card).join('')}</ul>`;
  return `<div class="card-grid card-grid-${kind}">${cards.map(card).join('')}</div>`;
}

// A hub's articles and blogs as a filterable index table.
function coverage(item) {
  const hubPosts = posts.filter(post => post.slug.startsWith(item.slug));
  if (!hubPosts.length) return '';
  const types = new Set(hubPosts.map(post => post.type));
  const filters = types.size > 1
    ? `<div class="filters" role="group" aria-label="Filter coverage"><button type="button" data-filter="all" aria-pressed="true">All Content</button><button type="button" data-filter="article" aria-pressed="false">Articles</button><button type="button" data-filter="blog" aria-pressed="false">Blogs</button></div>`
    : '';
  const rows = hubPosts.map(post => `<tr data-type="${post.type}"><td class="index-title"><a href="${post.slug}">${escapeHtml(post.title)}</a><p>${escapeHtml(post.description)}</p></td><td class="index-type">${pills(post)}</td><td class="index-length">${minutes(post)} min read</td><td class="index-arrow" aria-hidden="true">${icon('arrow-right')}</td></tr>`).join('');
  return `${filters}<div class="table-wrap index-wrap"><table class="index-table"><thead><tr><th scope="col">Title</th><th scope="col">Type</th><th scope="col" class="index-length">Length</th><th scope="col" class="index-arrow"><span class="visually-hidden">Open</span></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

const isNumeric = value => /^[$€£]?\d[\d,]*(?:\.\d+)?%?$/.test(String(value).trim());
const toNumber = value => Number(String(value).replace(/[^\d.]/g, ''));

// Finds the first table in a post with at least one fully numeric column.
function firstDataTable(body) {
  const lines = body.replace(/\r/g, '').split('\n');
  let heading = '';
  let rows = [];
  for (let index = 0; index <= lines.length; index++) {
    const line = lines[index] ?? '';
    if (/^##\s/.test(line)) heading = line.replace(/^##\s+/, '');
    if (line.trim().startsWith('|')) { rows.push(line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())); continue; }
    if (!rows.length) continue;
    const [head, , ...data] = rows;
    const numeric = head.map((_, column) => data.length >= 3 && data.every(row => isNumeric(row[column] || '')));
    if (numeric.some(Boolean)) return { heading, head, data, numeric };
    rows = [];
  }
  return null;
}

// A bar chart drawn from a post's own data table. It only exists while that
// post is part of the build, so unpublished figures never reach production.
function chart(route) {
  const post = bySlug.get(route);
  if (!post) return '';
  const table = firstDataTable(post.body);
  if (!table) throw new Error(`${post.source}: no numeric table to chart`);
  const series = table.head.map((_, column) => column).filter(column => table.numeric[column]).slice(0, 2);
  // Series share one scale only when they share a unit; otherwise each column scales to its own maximum.
  const unit = column => String(table.data[0][column]).replace(/[\d.,\s]/g, '');
  const shared = series.every(column => unit(column) === unit(series[0]));
  const columnMax = column => Math.max(...table.data.map(row => toNumber(row[column])));
  const max = column => shared ? Math.max(...series.map(columnMax)) : columnMax(column);
  const sourceColumn = table.head.findIndex(cell => /source/i.test(cell));
  const sources = sourceColumn > -1 ? [...new Set(table.data.map(row => row[sourceColumn]))] : [];
  const legend = series.map((column, index) => `<li class="key-${index + 1}">${escapeHtml(table.head[column])}</li>`).join('');
  const rows = table.data.map(row => `<div class="chart-row"><dt>${escapeHtml(row[0])}</dt><dd>${series.map((column, index) => `<span class="bar bar-${index + 1}" style="--v:${(toNumber(row[column]) / max(column) * 100).toFixed(1)}%"><b>${escapeHtml(row[column])}</b><span class="visually-hidden"> ${escapeHtml(table.head[column])}</span></span>`).join('')}</dd></div>`).join('');
  return `<figure class="chart glass"><figcaption><p class="eyebrow">Featured Data</p><h3>${escapeHtml(table.heading || post.title)}</h3><ul class="chart-legend">${legend}</ul></figcaption><dl class="chart-rows">${rows}</dl><p class="chart-source">${sources.length === 1 ? `Source: ${escapeHtml(sources[0])}, as reported in the article. ` : ''}<a href="${post.slug}">Read the Article ${icon('arrow-right')}</a></p></figure>`;
}

// Renders one "## " section. A section whose card list or coverage grid ends
// up empty is dropped whole, so no heading is left introducing nothing.
function section(markdown, item) {
  const [headingLine, ...rest] = markdown.split('\n');
  const parts = [];
  let buffer = [];
  let block = null;
  let empty = false;
  let blocks = 0;
  // A table needs the full width, so it counts as a block of its own.
  const flush = () => {
    if (buffer.join('').trim()) {
      const html = render(buffer.join('\n'));
      const at = html.indexOf('<div class="table-wrap">');
      if (at > -1) { parts.push(html.slice(0, at), html.slice(at)); blocks++; } else parts.push(html);
    }
    buffer = [];
  };
  for (const line of rest) {
    const open = line.match(/^:::\s*(cards|coverage|chart)(?:\s+(\/\S*))?$/);
    if (!block && open) { flush(); block = { kind: open[1], route: open[2], lines: [] }; continue; }
    if (block && line.trim() === ':::') {
      if (block.kind === 'cards') {
        const cards = parseCards(block.lines);
        if (cards.length) parts.push(cardGrid(cards)); else empty = true;
      } else if (block.kind === 'chart') {
        const figure = chart(block.route);
        if (figure) parts.push(figure); else empty = true;
      } else {
        const index = coverage(item);
        if (index) parts.push(index); else empty = true;
      }
      blocks++;
      block = null;
      continue;
    }
    (block ? block.lines : buffer).push(line);
  }
  flush();
  if (empty) return '';
  const heading = render(headingLine);
  if (markdown.includes('::: callout')) return `<section class="band band-callout"><div class="shell">${heading}${parts.join('\n')}</div></section>`;
  // Text-only sections use a two-column layout: heading left, copy right.
  if (!blocks || (blocks === 1 && parts[parts.length - 1].startsWith('<ul class="chip-row">'))) {
    return `<section class="band band-split"><div class="shell split"><div class="split-head">${heading}</div><div class="split-body">${parts.join('\n')}</div></div></section>`;
  }
  const [intro, ...others] = parts[0].startsWith('<p') ? parts : ['', ...parts];
  return `<section class="band"><div class="shell"><div class="band-head">${heading}${intro}</div>${others.join('\n')}</div></section>`;
}

function split(body) {
  const lines = body.replace(/\r/g, '').split('\n');
  const chunks = [[]];
  for (const line of lines) {
    if (/^##\s/.test(line)) chunks.push([]);
    chunks.at(-1).push(line);
  }
  return { intro: chunks[0].join('\n'), sections: chunks.slice(1).map(chunk => chunk.join('\n')) };
}

const hubFor = item => hubs.find(hub => item.slug.startsWith(hub.slug) && item.slug !== hub.slug);
const isCurrent = (url, current) => url === current.slug || (url !== '/' && current.slug.startsWith(url));
const navItems = (items, current) => items.filter(item => isAvailable(item.url)).map(item =>
  `<li><a href="${item.url}"${item.button ? ' class="button button-small"' : ''}${isCurrent(item.url, current) ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a></li>`).join('');

function schemaFor(item, url) {
  if (isPost(item)) {
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
  if (item.slug === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: site.name, url: `${siteUrl}/`, logo: `${siteUrl}/assets/brand/stack-row-icon.png`, slogan: site.tagline, email: site.contact_email || undefined },
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: site.name, url: `${siteUrl}/`, description: item.description, publisher: { '@id': `${siteUrl}/#organization` } }
      ]
    };
  }
  return { '@context': 'https://schema.org', '@type': item.type === 'hub' ? 'CollectionPage' : 'WebPage', name: item.title, description: item.description, url };
}

// Adds heading anchors, a highlighted key-points panel and collapsible FAQ
// entries to a rendered article body. Returns the body and its outline.
function enhance(html) {
  const outline = [];
  // Numeric table columns get proportional data bars behind their values.
  const tables = html.replace(/<table>[\s\S]*?<\/table>/g, table => {
    const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row => [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(cell => cell[1])).filter(row => row.length);
    if (rows.length < 3) return table;
    const max = rows[0].map((_, column) => rows.every(row => isNumeric(row[column] || '')) ? Math.max(...rows.map(row => toNumber(row[column]))) : 0);
    if (!max.some(Boolean)) return table;
    return table.replace(/<tr>([\s\S]*?)<\/tr>/g, (row, cells) => {
      let column = -1;
      return `<tr>${cells.replace(/<td>([\s\S]*?)<\/td>/g, (cell, text) => {
        column++;
        return max[column] ? `<td class="num"><span class="databar" style="--v:${(toNumber(text) / max[column] * 100).toFixed(1)}%"></span><span>${text}</span></td>` : cell;
      })}</tr>`;
    });
  });
  let body = tables.replace(/<h2>([\s\S]*?)<\/h2>/g, (match, text) => {
    const id = anchor(text);
    outline.push({ id, text });
    return `<h2 id="${id}">${text}</h2>`;
  });
  body = body.replace(/(<h2 id="key-(?:takeaways|statistics-and-data)">[\s\S]*?)(?=<h2 |$)/, '<section class="key-panel">$1</section>');
  body = body.replace(/(<h2 id="frequently-asked-questions">[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2 |$)/, (match, heading, content) => {
    const [lead, ...items] = content.split(/(?=<h3>)/);
    const entries = items.map(entry => entry.replace(/^(<h3>[\s\S]*?<\/h3>)([\s\S]*)$/, '<details class="faq"><summary>$1</summary><div class="faq-answer">$2</div></details>'));
    return `${heading}${lead}<div class="faq-list">${entries.join('')}</div>`;
  });
  return { body, outline };
}

function frame(key, label, sizes) {
  return `<figure class="frame"><div class="frame-bar" aria-hidden="true"><span></span><span></span><span></span><b>${escapeHtml(label)}</b></div>${image(key, { sizes, eager: true })}</figure>`;
}

function main(item) {
  const draft = item.draft === true;
  const banner = draft ? `<p class="draft-banner">${isPost(item) ? 'Editorial draft. Not approved for publication.' : 'Review draft. Not approved for publication.'}</p>` : '';
  if (isPost(item) || item.layout === 'prose') {
    const hub = hubFor(item);
    const [first, ...rest] = item.body.replace(/\r/g, '').split('\n');
    const { body, outline } = enhance(render(rest.join('\n')));
    const crumbs = `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a>${hub ? `<span aria-hidden="true">/</span><a href="${hub.slug}">${escapeHtml(hub.label || hub.title)}</a>` : ''}</nav>`;
    const meta = isPost(item) ? `<p class="post-meta">${pills(item)}<span>${minutes(item)} min read</span></p>` : '';
    const toc = isPost(item) && outline.length > 2
      ? `<aside class="post-aside"><nav class="toc" aria-label="On This Page"><p class="toc-title">On This Page</p><ol>${outline.map(entry => `<li><a href="#${entry.id}">${entry.text}</a></li>`).join('')}</ol></nav></aside>`
      : '';
    const related = (planById.get(item.content_id)?.targets || []).map(id => bySlug.get(planById.get(id)?.slug)).filter(Boolean).slice(0, 3);
    const more = related.length
      ? `<section class="band related"><div class="shell"><div class="band-head"><h2>Related Reading</h2></div><div class="card-grid card-grid-post">${related.map(post => card({ title: post.title, href: post.slug, text: post.description })).join('')}</div></div></section>`
      : '';
    return `<article class="post">${isPost(item) ? '<div class="progress" aria-hidden="true"><span></span></div>' : ''}<header class="post-header"><div class="shell post-header-inner">${banner}${crumbs}${meta}${render(first)}</div></header><div class="shell post-layout${toc ? '' : ' post-layout-single'}">${toc}<div class="prose">${body}</div></div></article>${more}`;
  }
  const { intro, sections } = split(item.body);
  const home = item.template === 'home';
  const label = home ? 'stackrow.org' : `stackrow.org${item.slug}`;
  let media = item.image ? frame(item.image, label, '(min-width: 900px) 560px, 100vw') : '';
  if (home) {
    const topics = navigation.topics.map(topic => bySlug.get(topic.url)).filter(hub => hub?.icon).map(hub => `<li><a href="${hub.slug}">${icon(hub.icon)}<span>${escapeHtml(hub.label || hub.title)}</span></a></li>`).join('');
    media = `<div class="hero-stack">${media}<nav class="coverage-panel glass" aria-label="Coverage"><p>Coverage</p><ul>${topics}</ul></nav></div>`;
  }
  const badge = item.type === 'hub' && item.icon ? `<span class="icon-badge icon-badge-large">${icon(item.icon)}</span>` : '';
  const eyebrow = item.type === 'hub' ? `<p class="eyebrow">${badge}Topic</p>` : '';
  const hero = `<header class="hero${home ? ' hero-home' : ''}${media ? '' : ' hero-plain'}"><div class="shell hero-grid"><div class="hero-copy">${banner}${eyebrow}${render(intro)}</div>${media ? `<div class="hero-media">${media}</div>` : ''}</div></header>`;
  return `${hero}${sections.map(markdown => section(markdown, item)).join('')}`;
}

const pageRecords = [];
for (const item of visible) {
  const url = canonical(siteUrl, item.slug);
  const draft = item.draft === true;
  const robots = indexable && !draft && item.noindex !== true ? 'index,follow' : 'noindex,nofollow,noarchive';
  const fullTitle = item.seo_title || `${item.title} | ${site.name}`;
  const schema = JSON.stringify(schemaFor(item, url)).replaceAll('<', '\\u003c');
  const social = item.image ? `/assets/images/${item.image}-1600.jpg` : '/assets/brand/stack-row-icon.png';
  const footerColumns = navigation.footer.map(column => {
    const links = navItems(column.links, item);
    return links ? `<nav aria-label="${escapeHtml(column.label)}"><h2>${escapeHtml(column.label)}</h2><ul>${links}</ul></nav>` : '';
  }).join('');
  const email = site.contact_email ? `<p><a class="footer-email" href="mailto:${escapeHtml(site.contact_email)}">${icon('mail')}${escapeHtml(site.contact_email)}</a></p>` : '';
  const html = `<!doctype html>
<html lang="${site.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(item.description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${isPost(item) ? 'article' : 'website'}">
  <meta property="og:site_name" content="${escapeHtml(site.name)}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(item.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${siteUrl}${social}">
  <meta name="twitter:card" content="${item.image ? 'summary_large_image' : 'summary'}">
  <meta name="theme-color" content="${site.colors.navy}">
  <link rel="icon" href="/assets/brand/stack-row-icon-192.png" type="image/png">
  <script type="application/ld+json">${schema}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Sora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles/main.css">
  <script src="/scripts/main.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header"><div class="shell site-header-inner"><a class="brand" href="${navigation.home.url}" aria-label="${escapeHtml(site.name)} home"><img src="/assets/brand/stack-row-logo-header.png" alt="${escapeHtml(site.name)}" width="566" height="173"></a><nav class="nav-topics" aria-label="Topics"><ul>${navItems(navigation.topics, item)}</ul></nav><nav class="nav-utility" aria-label="Site"><ul>${navItems(navigation.utility, item)}</ul></nav></div></header>
  <main id="content">${main(item)}</main>
  <footer class="site-footer"><div class="shell footer-grid"><div class="footer-brand"><strong>${escapeHtml(site.name)}</strong><p class="footer-tagline">${escapeHtml(site.tagline)}</p><p>${escapeHtml(site.description)}</p>${email}</div>${footerColumns}<p class="copyright">© ${new Date().getUTCFullYear()} ${escapeHtml(site.name)}. All rights reserved.</p></div></footer>
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
