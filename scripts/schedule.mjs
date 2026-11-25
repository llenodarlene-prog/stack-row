import { appendFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { publishInstant, PUBLISHED_PATTERN, readContent } from './lib.mjs';

// Lists the publishing schedule, or (mode "due") reports whether any post went
// live during the last 12 hours. The scheduled workflow runs this hourly, so posts
// dated YYYY-MM-DDTHH:MMZ publish within an hour of their time, and date-only
// posts publish on the first run after 00:00 UTC.
const mode = process.argv[2] || 'list';
if (!['list', 'due'].includes(mode)) {
  console.error('usage: node scripts/schedule.mjs [list|due]');
  process.exit(2);
}

const now = process.env.PUBLISH_TIME ? Date.parse(process.env.PUBLISH_TIME) : Date.now();
if (Number.isNaN(now)) throw new Error('PUBLISH_TIME must be an ISO date-time');
// GitHub often skips or delays hourly cron runs by several hours, so look back
// far enough that a post is still deployed after a long gap.
const windowMs = 12 * 60 * 60 * 1000;

let names = [];
try {
  names = (await readdir('content/posts')).filter(name => name.endsWith('.md')).sort();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const rows = [];
for (const name of names) {
  const { metadata } = await readContent(path.join('content/posts', name));
  const published = String(metadata.published || '').trim();
  const valid = PUBLISHED_PATTERN.test(published);
  const at = valid ? publishInstant(published) : NaN;
  rows.push({
    id: String(metadata.content_id || name),
    published: published || '-',
    at,
    state: metadata.draft === true ? 'draft' : !valid ? 'unscheduled' : at > now ? 'scheduled' : 'live',
    slug: String(metadata.slug || '')
  });
}

const goingLive = rows.filter(row => row.state === 'live' && now - row.at < windowMs);

// Safety net: with SITE_URL set, any post that should be live but does not
// load on the live site (a missed or failed deploy) also triggers a deploy.
async function missingFromSite() {
  const site = process.env.SITE_URL;
  if (!site) return [];
  const missing = [];
  for (const row of rows.filter(r => r.state === 'live' && r.slug)) {
    try {
      const response = await fetch(new URL(row.slug, site), { method: 'HEAD', redirect: 'follow' });
      if (response.status === 404) missing.push(row.slug);
    } catch {
      // A network error is not evidence that the post is missing.
    }
  }
  return missing;
}

if (mode === 'due') {
  const missing = await missingFromSite();
  if (missing.length) console.log(`${missing.length} live post(s) missing from the site: ${missing.join(', ')}`);
  const due = goingLive.length > 0 || missing.length > 0;
  console.log(due
    ? `${goingLive.length} post(s) went live in the last 12 hours: ${goingLive.map(row => row.slug).join(', ')}`
    : 'Nothing went live in the last 12 hours.');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `due=${due}\n`);
} else {
  console.log(`Publishing schedule as of ${new Date(now).toISOString()}\n`);
  for (const row of rows.sort((a, b) => (a.at || 0) - (b.at || 0))) console.log(`${row.id}\t${row.published}\t${row.state}\t${row.slug}`);
}
