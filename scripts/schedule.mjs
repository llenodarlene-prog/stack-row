import { appendFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { publishInstant, PUBLISHED_PATTERN, readContent } from './lib.mjs';

// Lists the publishing schedule, or (mode "due") reports whether any post went
// live during the last hour. The scheduled workflow runs this hourly, so posts
// dated YYYY-MM-DDTHH:MMZ publish within an hour of their time, and date-only
// posts publish on the first run after 00:00 UTC.
const mode = process.argv[2] || 'list';
if (!['list', 'due'].includes(mode)) {
  console.error('usage: node scripts/schedule.mjs [list|due]');
  process.exit(2);
}

const now = process.env.PUBLISH_TIME ? Date.parse(process.env.PUBLISH_TIME) : Date.now();
if (Number.isNaN(now)) throw new Error('PUBLISH_TIME must be an ISO date-time');
const windowMs = 65 * 60 * 1000;

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

if (mode === 'due') {
  const due = goingLive.length > 0;
  console.log(due
    ? `${goingLive.length} post(s) went live in the last hour: ${goingLive.map(row => row.slug).join(', ')}`
    : 'Nothing went live in the last hour.');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `due=${due}\n`);
} else {
  console.log(`Publishing schedule as of ${new Date(now).toISOString()}\n`);
  for (const row of rows.sort((a, b) => (a.at || 0) - (b.at || 0))) console.log(`${row.id}\t${row.published}\t${row.state}\t${row.slug}`);
}
