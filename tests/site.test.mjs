import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { markdownToHtml } from '../scripts/lib.mjs';

const run = promisify(execFile);

test('markdown escapes raw HTML and renders safe links', () => {
  const output = markdownToHtml('# Test\n\n<script>alert(1)</script>\n\n[Home](/)');
  assert.match(output, /<h1>Test<\/h1>/);
  assert.doesNotMatch(output, /<script>/);
  assert.match(output, /&lt;script&gt;/);
  assert.match(output, /href="\/"/);
});

test('markdown renders tables, containers, anchors and editor notes', () => {
  const output = markdownToHtml('## Topics {#topics}\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n::: actions\n[Go](#topics) [Mail](mailto:a@example.com)\n:::\n\n[Insert the date.]\n\n[x](javascript:alert(1))');
  assert.match(output, /<h2 id="topics">Topics<\/h2>/);
  assert.match(output, /<th scope="col">A<\/th>/);
  assert.match(output, /<td>2<\/td>/);
  assert.match(output, /<div class="actions">\n<p><a href="#topics">Go<\/a> <a href="mailto:a@example.com">Mail<\/a><\/p>\n<\/div>/);
  assert.match(output, /<p class="editor-note">\[Insert the date\.\]<\/p>/);
  assert.doesNotMatch(output, /href="javascript/);
});

test('launch plan contains exactly ten articles and ten blogs', async () => {
  const plan = JSON.parse(await readFile('data/content-plan.json', 'utf8'));
  assert.equal(plan.length, 20);
  assert.equal(plan.filter(item => item.type === 'article').length, 10);
  assert.equal(plan.filter(item => item.type === 'blog').length, 10);
  assert.equal(new Set(plan.map(item => item.slug)).size, 20);
});

test('non-production build includes all drafts and marks them noindex', async () => {
  const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'));
  assert.equal(manifest.environment, process.env.BUILD_ENV || 'local');
  assert.equal(manifest.indexable, false);
  assert.equal(manifest.pages.filter(page => page.draft && ['article', 'blog'].includes(page.type)).length, 20);
  const draft = await readFile('dist/cybersecurity/cybersecurity-statistics/index.html', 'utf8');
  assert.match(draft, /noindex,nofollow,noarchive/);
  assert.match(draft, /Editorial draft/);
});

test('homepage renders the hero, topic cards and site schema', async () => {
  const home = await readFile('dist/index.html', 'utf8');
  assert.match(home, /<h1>Tech That Moves Businesses Forward\.<\/h1>/);
  assert.match(home, /<h2 id="topics">Explore the Topics<\/h2>/);
  for (const hub of ['cybersecurity', 'saas', 'ai', 'cloud-infrastructure', 'business-technology', 'developer-data']) {
    assert.match(home, new RegExp(`<h3><a href="/${hub}/">`));
  }
  assert.match(home, /"@type":"Organization"/);
  assert.match(home, /"@type":"WebSite"/);
});

test('production build excludes drafts and never links to them', async () => {
  const out = await mkdtemp(path.join(tmpdir(), 'stack-row-'));
  try {
    await run(process.execPath, ['scripts/build.mjs'], { env: { ...process.env, BUILD_ENV: 'production', OUT_DIR: out, SITE_URL: '' } });
    const manifest = JSON.parse(await readFile(path.join(out, 'build-manifest.json'), 'utf8'));
    assert.equal(manifest.pages.filter(page => page.draft).length, 0);
    const built = new Set(manifest.pages.map(page => page.slug));
    for (const page of manifest.pages) {
      const file = page.slug === '/' ? 'index.html' : path.join(page.slug, 'index.html');
      const html = await readFile(path.join(out, file), 'utf8');
      assert.doesNotMatch(html, /draft-banner|editor-note/);
      for (const [, href] of html.matchAll(/<a href="(\/[^"#]*)"/g)) {
        assert.ok(built.has(href) || href === '/sitemap.xml', `${page.slug} links to unbuilt route ${href}`);
      }
    }
    const sitemap = await readFile(path.join(out, 'sitemap.xml'), 'utf8');
    for (const page of JSON.parse(await readFile('dist/build-manifest.json', 'utf8')).pages.filter(page => page.draft)) {
      assert.ok(!built.has(page.slug), `draft ${page.slug} was built for production`);
      assert.ok(!sitemap.includes(page.url), `draft ${page.slug} is in the production sitemap`);
    }
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test('brand tokens match the approved brief', async () => {
  const site = JSON.parse(await readFile('data/site.json', 'utf8'));
  assert.deepEqual(site.colors, {
    navy: '#0B2A56', blue: '#2563EB', cyan: '#22D3EE', soft_white: '#F8FAFC', slate: '#374151', white: '#FFFFFF'
  });
  assert.equal(site.fonts.display, 'Sora');
  assert.equal(site.fonts.body, 'Inter');
  assert.equal(site.fonts.technical, 'IBM Plex Mono');
});
