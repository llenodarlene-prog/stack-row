import { readFile } from 'node:fs/promises';
import { readContent } from './lib.mjs';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const [site, release, plan] = await Promise.all([
  readJson('data/site.json'),
  readJson('data/release.json'),
  readJson('data/content-plan.json')
]);
const errors = [];
if (site.launch_status !== 'ready') errors.push('data/site.json launch_status must be ready');
if (!site.contact_email) errors.push('a verified public contact email is required');
for (const [approval, value] of Object.entries(release.approvals)) if (value !== true) errors.push(`approval is incomplete: ${approval}`);

const pageFiles = ['home','about','contact','privacy','cybersecurity','saas','ai','business-technology','cloud-infrastructure'];
const pages = await Promise.all(pageFiles.map(file => readContent(`content/pages/${file}.md`)));
for (const route of release.core_routes) {
  const page = pages.find(candidate => candidate.metadata.slug === route);
  if (!page || page.metadata.complete !== true) errors.push(`core route is incomplete: ${route}`);
}

let publishedBlogs = 0;
for (const item of plan.filter(item => item.type === 'blog')) {
  const { metadata } = await readContent(`content/posts/${item.id.toLowerCase()}.md`);
  if (metadata.draft !== true) {
    const research = await readJson(`content/research/${item.id.toLowerCase()}.json`);
    if (research.status === 'verified' && research.fact_check?.status === 'approved' && research.qa?.status === 'approved') publishedBlogs++;
  }
}
if (publishedBlogs < release.minimum_published_blogs) errors.push(`at least ${release.minimum_published_blogs} verified published blog is required`);

if (errors.length) {
  console.error(`Production release gate failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exit(1);
}
console.log(`Production release gate passed: ${release.core_routes.length} core routes and ${publishedBlogs} published blog(s).`);
