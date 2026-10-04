import { mkdir, readFile, writeFile } from 'node:fs/promises';

const plan = JSON.parse(await readFile('data/content-plan.json', 'utf8'));
await mkdir('content/posts', { recursive: true });
await mkdir('content/research', { recursive: true });
for (const item of plan) {
  const key = item.id.toLowerCase();
  const postPath = `content/posts/${key}.md`;
  const researchPath = `content/research/${key}.json`;
  const description = `Editorial research draft for ${item.title.toLowerCase()}.`;
  const post = `---\ntitle: ${item.title}\ndescription: ${description}\nslug: ${item.slug}\ntype: ${item.type}\ncontent_id: ${item.id}\nprimary_keyword: ${item.primary_keyword}\ndraft: true\n---\n\n# ${item.title}\n\nResearch and drafting are not complete. This route is reserved by the approved launch plan.\n`;
  const research = {
    schema: 1,
    content_id: item.id,
    slug: item.slug,
    status: 'scaffolded',
    required_seo_tool: 'Ubersuggest',
    keyword_queries: [],
    ranking_competitors: [],
    sources: [],
    statistics: [],
    claims: [],
    internal_link_targets: item.targets,
    fact_check: { status: 'pending', reviewer: null, date_utc: null },
    qa: { status: 'pending', reviewer: null, date_utc: null }
  };
  await writeFile(postPath, post, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
  await writeFile(researchPath, JSON.stringify(research, null, 2) + '\n', { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
}
console.log(`Scaffolded ${plan.length} content and research records.`);
