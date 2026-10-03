import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { markdownToHtml } from '../scripts/lib.mjs';

test('markdown escapes raw HTML and renders safe links', () => {
  const output = markdownToHtml('# Test\n\n<script>alert(1)</script>\n\n[Home](/)');
  assert.match(output, /<h1>Test<\/h1>/);
  assert.doesNotMatch(output, /<script>/);
  assert.match(output, /&lt;script&gt;/);
  assert.match(output, /href="\/"/);
});

test('launch plan contains exactly ten articles and ten blogs', async () => {
  const plan = JSON.parse(await readFile('data/content-plan.json', 'utf8'));
  assert.equal(plan.length, 20);
  assert.equal(plan.filter(item => item.type === 'article').length, 10);
  assert.equal(plan.filter(item => item.type === 'blog').length, 10);
  assert.equal(new Set(plan.map(item => item.slug)).size, 20);
});

test('local build includes all drafts and marks them noindex', async () => {
  const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'));
  assert.equal(manifest.environment, 'local');
  assert.equal(manifest.indexable, false);
  assert.equal(manifest.pages.filter(page => page.draft).length, 20);
  const draft = await readFile('dist/cybersecurity/cybersecurity-statistics/index.html', 'utf8');
  assert.match(draft, /noindex,nofollow,noarchive/);
  assert.match(draft, /Editorial draft/);
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
