import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
async function walk(dir){const e=await readdir(dir,{withFileTypes:true});return (await Promise.all(e.map(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)]))).flat();}
const pages=[];
for(const file of (await walk('dist')).filter(f=>f.endsWith('.html'))){
 const html=await readFile(file,'utf8'); const rel=path.relative('dist',file).replaceAll(path.sep,'/'); const route=rel==='index.html'?'/':`/${path.posix.dirname(rel)}/`;
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const entities=scripts.flatMap(x=>Array.isArray(x?.['@graph'])?x['@graph']:[x]).filter(Boolean);
 const types=new Set(entities.flatMap(e=>Array.isArray(e['@type'])?e['@type']:[e['@type']]).filter(Boolean));
 const hrefs=[...html.matchAll(/href="(\/[^"#?]*\/?)(?:[#?][^"]*)?"/g)].map(m=>m[1]||'/').map(h=>h==='/'?'/':h.replace(/\/$/,'')+'/');
 pages.push({route,types,hrefs});
}
const routes=new Set(pages.map(p=>p.route)); const inbound=new Map(pages.map(p=>[p.route,0]));
for(const p of pages) for(const href of new Set(p.hrefs)) if(routes.has(href)&&href!==p.route) inbound.set(href,(inbound.get(href)||0)+1);
const failures=[];
for(const page of pages){const article=['Article','BlogPosting','NewsArticle'].some(t=>page.types.has(t));
 if(page.route==='/'&&(!page.types.has('Organization')||!page.types.has('WebSite'))) failures.push('/: homepage schema requires Organization and WebSite');
 if(article){for(const r of ['Organization','WebSite','WebPage','BreadcrumbList']) if(!page.types.has(r)) failures.push(`${page.route}: article schema missing ${r}`); if((inbound.get(page.route)||0)<1) failures.push(`${page.route}: orphaned article has no inbound internal link`);}
}
if(failures.length) throw new Error(failures.join('\n')); console.log(`Discoverability checks passed for ${pages.length} HTML pages.`);
