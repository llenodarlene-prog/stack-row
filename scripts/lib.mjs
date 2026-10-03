import { readFile } from 'node:fs/promises';

export const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function scalar(value) {
  const clean = value.trim();
  if (clean === 'true') return true;
  if (clean === 'false') return false;
  if (clean === 'null') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(clean)) return Number(clean);
  if ((clean.startsWith('[') && clean.endsWith(']')) || (clean.startsWith('{') && clean.endsWith('}'))) {
    try { return JSON.parse(clean); } catch { return clean; }
  }
  return clean.replace(/^(["'])(.*)\1$/, '$2');
}

export async function readContent(file) {
  const raw = await readFile(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing front matter`);
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon < 1) throw new Error(`${file}: invalid front matter line: ${line}`);
    metadata[line.slice(0, colon).trim()] = scalar(line.slice(colon + 1));
  }
  return { metadata, body: match[2].trim() };
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|#[\w-]+|mailto:[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

// Supports h1 to h3 (with an optional {#id}), paragraphs, lists, pipe tables,
// and ::: name containers. Raw HTML is always escaped.
export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const output = [];
  let paragraph = [];
  let list = null;
  let table = [];
  let containers = 0;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ');
    // A fully bracketed paragraph is an editor instruction, never public copy.
    const note = /^\[[^\]]*\]$/.test(text);
    output.push(`<p${note ? ' class="editor-note"' : ''}>${inline(text)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list) output.push(`</${list}>`);
    list = null;
  };
  const flushTable = () => {
    if (!table.length) return;
    const [head, ...rest] = table;
    const body = rest.filter(row => !row.every(cell => /^:?-+:?$/.test(cell)));
    output.push(`<div class="table-wrap"><table><thead><tr>${head.map(cell => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${body.map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    table = [];
  };
  const flush = () => { flushParagraph(); closeList(); flushTable(); };
  for (const line of lines) {
    if (!line.trim()) { flush(); continue; }
    const open = line.match(/^:::\s*([a-z][a-z-]*)$/);
    if (open) { flush(); output.push(`<div class="${open[1]}">`); containers++; continue; }
    if (line.trim() === ':::' && containers) { flush(); output.push('</div>'); containers--; continue; }
    if (line.trim().startsWith('|')) { flushParagraph(); closeList(); table.push(cells(line)); continue; }
    flushTable();
    const heading = line.match(/^(#{1,3})\s+(.+?)(?:\s+\{#([a-z][\w-]*)\})?$/);
    if (heading) {
      flushParagraph(); closeList();
      const level = heading[1].length;
      const id = heading[3] && level > 1 ? ` id="${heading[3]}"` : '';
      output.push(`<h${level}${id}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const kind = ordered ? 'ol' : 'ul';
      if (list !== kind) { closeList(); output.push(`<${kind}>`); list = kind; }
      output.push(`<li>${inline((unordered || ordered)[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }
  flush();
  while (containers-- > 0) output.push('</div>');
  return output.join('\n');
}

export const cleanSlug = slug => slug === '/' ? '' : slug.replace(/^\//, '').replace(/\/$/, '');
export const canonical = (base, slug) => `${base}${slug === '/' ? '/' : `/${cleanSlug(slug)}/`}`;
