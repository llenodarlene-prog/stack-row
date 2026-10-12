import { readFile } from 'node:fs/promises';

const staging = String(process.env.STAGING_URL || '').replace(/\/$/, '');
const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'));

if (!/^https:\/\/[a-z0-9.-]+$/i.test(staging)) throw new Error('the staging SITE_URL variable must be an HTTPS origin');
if (new URL(staging).host === new URL(site.url).host) throw new Error('the staging SITE_URL variable points at the production domain');
if (manifest.environment !== 'staging' || manifest.indexable !== false) throw new Error('dist/ is not a noindex staging build');

console.log(`Staging target confirmed: ${staging} (noindex build)`);
