import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { readContent } from './lib.mjs';

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

if (plan.length !== 20) fail(`content plan has ${plan.length} items, expected 20`);
if (plan.filter(item => item.type === 'article').length !== 10) fail('content plan must contain 10 articles');
if (plan.filter(item => item.type === 'blog').length !== 10) fail('content plan must contain 10 blogs');
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
  if (metadata.draft !== true) {
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
console.log(`Validated ${generated.length} generated HTML files, 20 content records, 20 research records, and ${assets.length} assets.`);
