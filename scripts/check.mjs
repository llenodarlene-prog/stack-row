import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { PUBLISHED_PATTERN, readContent } from './lib.mjs';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const [site, plan, assets, killList, manifest] = await Promise.all([
  readJson('data/site.json'),
  readJson('data/content-plan.json'),
  readJson('data/assets.json'),
  readJson('data/ai-kill-list.json'),
  readJson('dist/build-manifest.json')
]);
const errors = [];
const fail = message => errors.push(message);

// The launch set stays fixed at 20. Later approved items carry a "set" name and
// pass the same per-item publication gates below.
const launch = plan.filter(item => !item.set);
if (launch.length !== 20) fail(`launch plan has ${launch.length} items, expected 20`);
if (launch.filter(item => item.type === 'article').length !== 10) fail('launch plan must contain 10 articles');
if (launch.filter(item => item.type === 'blog').length !== 10) fail('launch plan must contain 10 blogs');
for (const item of plan.filter(item => item.set)) if (!['article', 'blog'].includes(item.type)) fail(`${item.id}: invalid type`);
for (const field of ['id', 'title', 'primary_keyword', 'slug', 'cluster', 'role']) {
  const missing = plan.filter(item => !item[field]);
  if (missing.length) fail(`${missing.length} plan items missing ${field}`);
}
for (const field of ['id', 'slug']) {
  const values = plan.map(item => item[field]);
  if (new Set(values).size !== values.length) fail(`duplicate content plan ${field}`);
}
const ids = new Set(plan.map(item => item.id));
for (const item of plan) for (const target of item.targets) if (!ids.has(target)) fail(`${item.id}: unknown target ${target}`);

for (const asset of assets) {
  if (!asset.path || !asset.width || !asset.height || !asset.alt) fail('asset record is incomplete');
  await access(asset.path.replace(/^\//, '')).catch(() => fail(`missing asset ${asset.path}`));
}

for (const item of plan) {
  const key = item.id.toLowerCase();
  const postFile = `content/posts/${key}.md`;
  const researchFile = `content/research/${key}.json`;
  const { metadata, body } = await readContent(postFile).catch(error => { fail(error.message); return { metadata: {}, body: '' }; });
  const research = await readJson(researchFile).catch(error => { fail(`${researchFile}: ${error.message}`); return {}; });
  if (metadata.content_id !== item.id) fail(`${postFile}: content_id does not match plan`);
  if (metadata.slug !== item.slug) fail(`${postFile}: slug does not match plan`);
  if (metadata.type !== item.type) fail(`${postFile}: type does not match plan`);
  if (metadata.primary_keyword !== item.primary_keyword) fail(`${postFile}: primary keyword does not match plan`);
  if (research.content_id !== item.id || research.slug !== item.slug) fail(`${researchFile}: relationship does not match plan`);
  if (research.required_seo_tool !== 'Ubersuggest') fail(`${researchFile}: Ubersuggest must be the required SEO tool`);
  if (metadata.published && !PUBLISHED_PATTERN.test(String(metadata.published))) fail(`${postFile}: published must be YYYY-MM-DD or YYYY-MM-DDTHH:MMZ`);
  if (metadata.draft !== true) {
    if (!metadata.published) fail(`${postFile}: published content requires a published date`);
    if (research.status !== 'verified') fail(`${postFile}: published content requires verified research`);
    if (research.fact_check?.status !== 'approved' || research.qa?.status !== 'approved') fail(`${postFile}: published content requires fact-check and QA approval`);
    const lower = body.toLowerCase();
    for (const term of killList) if (lower.includes(term.toLowerCase())) fail(`${postFile}: AI kill-list term "${term}"`);
    const internalLinks = [...body.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g)].length;
    const externalLinks = [...body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].length;
    if (internalLinks < 2) fail(`${postFile}: published content requires at least 2 contextual internal links`);
    if (externalLinks < 3) fail(`${postFile}: published content requires at least 3 contextual external links`);
  }
}

// Hub-and-spoke silos. A silo is a top-level folder; its pillar is the plan
// item with role Hub (or Bridge) in that folder. Body links are counted from
// the markdown, so navigation, cards and coverage tables do not satisfy them.
const bodies = new Map();
for (const item of plan) {
  const { metadata, body } = await readContent(`content/posts/${item.id.toLowerCase()}.md`).catch(() => ({ metadata: {}, body: '' }));
  if (metadata.draft === false) bodies.set(item.slug, { item, links: new Set([...body.matchAll(/\]\((\/[^)#\s]*)/g)].map(match => match[1])) });
}
const folder = slug => slug.split('/')[1];
const pillars = new Map(plan.filter(item => ['Hub', 'Bridge'].includes(item.role)).map(item => [folder(item.slug), item]));
for (const [slug, { item, links }] of bodies) {
  const pillar = pillars.get(folder(slug));
  if (!pillar || !bodies.has(pillar.slug)) continue;
  if (pillar.slug !== slug && !links.has(pillar.slug)) fail(`${item.id}: spoke does not link to its pillar ${pillar.id} in the body`);
  if (pillar.slug !== slug && !bodies.get(pillar.slug).links.has(slug)) fail(`${pillar.id}: pillar does not link to its spoke ${item.id} in the body`);
  const inbound = [...bodies.values()].filter(other => other.item.slug !== slug && other.links.has(slug)).length;
  if (inbound < 2) fail(`${item.id}: only ${inbound} contextual body link(s) from other posts; at least 2 required`);
}

// Tool screenshots (docs/EDITORIAL-QA-SOP.md section 11a). Every screenshot
// must be a registered asset with its tool, source, capture month and, for
// vendor images, a credit. A post that lists featured_tools in its front
// matter needs a captioned screenshot of each one.
const assetByPath = new Map(assets.map(asset => [asset.path, asset]));
const screenshotSources = new Set(['own-capture', 'vendor-press-kit']);
for (const asset of assets.filter(asset => asset.path.startsWith('/assets/screenshots/'))) {
  if (!asset.tool) fail(`${asset.path}: screenshot asset needs a tool name`);
  if (!screenshotSources.has(asset.source)) fail(`${asset.path}: screenshot source must be own-capture or vendor-press-kit`);
  if (!/^\d{4}-\d{2}$/.test(asset.captured || '')) fail(`${asset.path}: screenshot needs a captured month (YYYY-MM)`);
  if (asset.source === 'vendor-press-kit' && !asset.credit) fail(`${asset.path}: vendor images need a credit line`);
  if (/screenshot|image of|picture of/i.test(asset.alt)) fail(`${asset.path}: alt text should describe what is shown, not say "screenshot"`);
}
// Image SEO: every registered image needs alt text a screen reader can read
// in one pass (125 characters or fewer).
for (const asset of assets) {
  if (!asset.alt || !asset.alt.trim()) fail(`${asset.path}: image needs alt text`);
  else if (asset.alt.length > 125) fail(`${asset.path}: alt text is ${asset.alt.length} characters; keep it to 125 or fewer`);
}
for (const dir of ['content/posts', 'content/pages']) {
  for (const name of (await readdir(dir)).filter(file => file.endsWith('.md'))) {
    const file = `${dir}/${name}`;
    const { metadata, body } = await readContent(file);
    const shots = [...body.matchAll(/^!\[([^\]]+)\]\((\/assets\/screenshots\/[\w./-]+)(?:\s+"([^"]+)")?\)\s*$/gm)];
    for (const [, alt, src, caption] of shots) {
      if (!assetByPath.has(src)) fail(`${file}: screenshot ${src} is not registered in data/assets.json`);
      if (assetByPath.has(src) && alt !== assetByPath.get(src).alt) fail(`${file}: screenshot ${src} alt text must match data/assets.json`);
      if (!caption || !/captured \w+ \d{4}/i.test(caption)) fail(`${file}: screenshot ${src} needs a caption with "captured Month YYYY"`);
    }
    const featured = Array.isArray(metadata.featured_tools) ? metadata.featured_tools : [];
    if (featured.length && metadata.draft !== true) {
      const shown = new Set(shots.map(([, , src]) => assetByPath.get(src)?.tool?.toLowerCase()).filter(Boolean));
      const missing = featured.filter(tool => !shown.has(String(tool).toLowerCase()));
      if (missing.length) fail(`${file}: featured tools need a screenshot: ${missing.join(', ')}`);
    }
  }
}

// A page marked complete is cleared for production, so it cannot be a draft or
// still carry editor instructions.
const placeholder = /\[(?:insert|add|confirm|identify|describe|where)\b|will be added before launch/i;
for (const name of (await readdir('content/pages')).filter(file => file.endsWith('.md'))) {
  const pageFile = `content/pages/${name}`;
  const { metadata, body } = await readContent(pageFile);
  if (metadata.complete !== true) continue;
  if (metadata.draft === true) fail(`${pageFile}: a draft page cannot be marked complete`);
  if (placeholder.test(body)) fail(`${pageFile}: page is marked complete but contains placeholder text`);
}

// Headings are always title case: every word is capitalized except short
// joining words, which stay lowercase unless they open or close the heading.
const minorWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with', 'as', 'per', 'vs', 'via', 'into']);
for (const dir of ['content/pages', 'content/posts']) {
  for (const name of (await readdir(dir)).filter(file => file.endsWith('.md'))) {
    const { body } = await readContent(`${dir}/${name}`);
    for (const line of body.split(/\r?\n/)) {
      const heading = line.match(/^#{1,3}\s+(.*?)(?:\s+\{[^}]*\})?$/);
      if (!heading) continue;
      const words = heading[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').split(/\s+/);
      const lower = words.filter((word, index) => /^[a-z]/.test(word) && (index === 0 || index === words.length - 1 || !minorWords.has(word.toLowerCase().replace(/[^a-z]/g, ''))));
      if (lower.length) fail(`${dir}/${name}: heading is not title case: "${heading[1]}"`);
    }
  }
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? htmlFiles(path.join(dir, entry.name)) : entry.name.endsWith('.html') ? [path.join(dir, entry.name)] : []))).flat();
}
const generated = await htmlFiles('dist');
if (!generated.length) fail('build produced no HTML files');
for (const file of generated) {
  const html = await readFile(file, 'utf8');
  for (const pattern of ['<title>', '<meta name="description"', '<meta name="robots"', '<link rel="canonical"', 'application/ld+json', '<h1>']) {
    if (!html.includes(pattern)) fail(`${file}: missing ${pattern}`);
  }
  if (html.includes('—')) fail(`${file}: em dash is not allowed`);
  const local = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)].map(match => match[1]);
  for (const srcset of html.matchAll(/srcset="([^"]+)"/g)) local.push(...srcset[1].split(',').map(entry => entry.trim().split(/\s+/)[0]));
  for (const target of new Set(local)) {
    const resolved = path.join('dist', target.endsWith('/') ? `${target}index.html` : target);
    await access(resolved).catch(() => fail(`${file}: broken local reference ${target}`));
  }
}
if (manifest.planItems !== 20) fail('build manifest does not cover the 20-item launch plan');
if (!/^https:\/\//.test(site.url)) fail('site URL must use HTTPS');

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Validated ${generated.length} generated HTML files, ${plan.length} content records, ${plan.length} research records, and ${assets.length} assets.`);
