// JSON Validator and Formatter interface. Parsing lives in
// developer-tool-formulas.js and never uses eval or Function. Keys and
// values are rendered as text only. Nothing is stored or shared.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const J = window.StackRowDevTools?.Json;
  if (!T || !J) return;
  const $ = id => document.getElementById(id);
  const form = document.querySelector('#calculator .calc-form');
  const LIMIT = J.JSON_LIMITS.maxBytes;
  let searchTerm = '';

  function codeBlock(text, label) {
    const pre = T.el('pre', 'calc-code'); pre.id = 'jf-output'; pre.tabIndex = 0; pre.setAttribute('aria-label', label);
    pre.textContent = text;
    return pre;
  }
  function tree(model, openLevels, copyButton) {
    const box = T.el('div', 'calc-tree'); box.id = 'jf-tree';
    box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'JSON tree'); box.tabIndex = 0;
    const row = (item, container) => {
      const line = T.el('span', 'calc-tree-row');
      line.dataset.search = `${item.key} ${item.summary}`.toLowerCase();
      const copy = copyButton(item.path, `path ${item.path}`);
      copy.addEventListener('click', event => event.preventDefault()); // do not toggle the parent <details>
      line.append(T.el('span', 'calc-tree-key', item.key), T.el('span', `calc-badge-type calc-type-${item.type}`, item.type), T.el('span', 'calc-tree-value', item.summary), copy);
      container.append(line);
    };
    const build = (item, depth) => {
      const li = T.el('li');
      if (item.children.length) {
        const details = T.el('details'); details.open = openLevels === 'all' || depth < Number(openLevels);
        const summary = T.el('summary'); row(item, summary);
        const ul = T.el('ul'); for (const c of item.children) ul.append(build(c, depth + 1));
        details.append(summary, ul); li.append(details);
      } else row(item, li);
      return li;
    };
    const ul = T.el('ul'); ul.append(build(model.root, 0));
    box.append(ul);
    if (model.truncated) box.append(T.el('p', 'calc-hint', `The tree stops at ${J.JSON_LIMITS.maxTreeNodes.toLocaleString('en-US')} values. Formatting and validation still cover the whole document.`));
    return box;
  }
  function warningsText(w, stats) {
    const out = [];
    if (w.duplicates.length) out.push(`${w.duplicates.length} duplicate name${w.duplicates.length === 1 ? '' : 's'}: ${w.duplicates.slice(0, 5).map(d => `"${d.key}" in ${d.path}`).join(', ')}${w.duplicates.length > 5 ? ', and more' : ''}. Most parsers keep only the last value, so earlier ones are lost.`);
    if (w.unsafe.length) out.push(`${w.unsafe.length} integer${w.unsafe.length === 1 ? '' : 's'} beyond ±9,007,199,254,740,991 (${w.unsafe.slice(0, 3).map(u => u.raw).join(', ')}). This tool keeps the digits exactly, but JavaScript and many other readers will round them.`);
    if (w.extreme.length) out.push(`${w.extreme.length} number${w.extreme.length === 1 ? '' : 's'} too large or too small for standard floating point (${w.extreme.slice(0, 3).map(u => u.raw).join(', ')}). Other readers may turn them into Infinity or 0.`);
    if (stats.maxDepth > 64) out.push(`The document is ${stats.maxDepth} levels deep. Some parsers stop at lower limits.`);
    return out.join(' ');
  }

  const app = T.mount({
    icon: 'braces', name: 'JSON Validator and Formatter', file: 'json', noun: 'formatter', doneWord: 'done',
    modeNames: { beautify: 'Beautify', minify: 'Minify', validate: 'Validate', tree: 'Tree view', csv: 'JSON to CSV' },
    labels: { submit: 'Run', reset: 'Reset formatter', copy: 'Copy output' },
    persistence: 'none', share: { mode: 'disabled' }, restore: false, print: false,
    limits: { maxInputBytes: LIMIT, maxFileBytes: LIMIT },
    privacyMessage: 'JSON is processed in your browser. Files are read on this device only. Nothing is uploaded, saved, or put in the page address. Avoid pasting secrets into any online tool.',
    example: { mode: 'beautify', values: { json: '{"orderId":"A-1042","total":129.50,"paid":true,"customer":{"name":"Ana Ruiz","tier":null},"items":[{"sku":"KB-01","qty":2,"price":49.75},{"sku":"MS-07","qty":1,"price":30.00}],"orderId":"A-1043"}' } },
    exporters: [
      { label: 'Download JSON', mime: 'application/json;charset=utf-8', extension: 'json', modes: ['beautify', 'minify'], filename: last => `stack-row-${last.mode === 'minify' ? 'minified' : 'formatted'}-${last.date}`, build: last => last.output },
      { label: 'Download CSV', mime: 'text/csv;charset=utf-8', extension: 'csv', modes: ['csv'], filename: last => `stack-row-json-to-csv-${last.date}`, build: last => `${last.output}\r\n` }
    ],
    copy: last => last.output,
    onMode(mode) { $('panel-json').setAttribute('aria-labelledby', `tab-${mode}`); $('jf-search-wrap').hidden = mode !== 'tree'; },
    compute(c, { copyButton }) {
      const text = c.text('json', { required: true, label: 'The JSON input', maxBytes: LIMIT });
      if (text === null) return null;
      const indent = { 2: '  ', 4: '    ', tab: '\t' }[c.value('indent')] || '  ';
      const sortKeys = c.value('sort') === 'sort';
      let r;
      if (c.mode === 'csv') r = J.jsonArrayToCsv(text, { nested: c.value('nested') });
      else r = J.formatJson(text, { indent, sortKeys, minify: c.mode === 'minify' });
      if (!r.ok) {
        const where = r.line ? `Line ${r.line}, column ${r.column} (character ${r.index + 1}): ` : '';
        c.fail('json', `${where}${r.message}`);
        if (r.line) showProblem(r); else $('jf-problem').hidden = true;
        return null;
      }
      $('jf-problem').hidden = true;
      c.clear('json');
      const stats = `${r.stats.nodes.toLocaleString('en-US')} values, ${r.stats.maxDepth} levels deep`;
      const warning = warningsText(r.warnings, r.stats);
      if (c.mode === 'csv') {
        return {
          output: r.value,
          metrics: [['CSV', `${r.rows.toLocaleString('en-US')} rows, ${r.columns.length} columns`, 'Columns in first-seen order', true], ['Missing fields', `${r.missing.toLocaleString('en-US')} empty cells`], ['Formula protection', `${r.protectedCells} cell${r.protectedCells === 1 ? '' : 's'} prefixed with an apostrophe`]],
          nodes: [codeBlock(r.value.length > 20000 ? `${r.value.slice(0, 20000)}\n…preview cut at 20,000 characters. Download for the full file.` : r.value, 'CSV preview')],
          warning,
          announce: `Converted ${r.rows} rows to CSV.`,
          inputs: [['Input', stats]], outputs: [['Rows', String(r.rows)], ['Columns', r.columns.join(', ')]]
        };
      }
      const formatted = r.value;
      const metrics = c.mode === 'validate'
        ? [['Result', warning ? 'Valid JSON, with warnings' : 'Valid JSON', 'Checked against RFC 8259 grammar', true], ['Top-level value', r.root.type], ['Size', stats]]
        : [[c.mode === 'minify' ? 'Minified' : c.mode === 'tree' ? 'Tree view' : 'Formatted', c.mode === 'tree' ? stats : `${T.policy.byteLength(formatted).toLocaleString('en-US')} bytes`, c.mode === 'tree' ? 'Copy a path with the Copy button on each row' : `${stats}${sortKeys ? '. Keys sorted A to Z.' : ''}`, true]];
      const nodes = [];
      if (c.mode === 'beautify' || c.mode === 'minify') nodes.push(codeBlock(formatted, c.mode === 'minify' ? 'Minified JSON' : 'Formatted JSON'));
      if (c.mode === 'tree') nodes.push(tree(J.buildJsonTreeModel(r.root), c.value('depth'), copyButton));
      window.setTimeout(applySearch, 0);
      return {
        output: formatted, metrics, nodes, warning,
        announce: c.mode === 'validate' ? (warning ? 'Valid JSON, with warnings.' : 'Valid JSON.') : `JSON ${c.mode === 'minify' ? 'minified' : c.mode === 'tree' ? 'tree ready' : 'formatted'}.`,
        inputs: [['Input size', `${T.policy.byteLength(text)} bytes`]],
        outputs: [['Result', 'Valid JSON'], ['Top-level value', r.root.type], ['Values', String(r.stats.nodes)], ['Depth', String(r.stats.maxDepth)]]
      };
    }
  });

  const problem = T.el('div', 'calc-problem'); problem.id = 'jf-problem'; problem.hidden = true;
  $('jf-text').closest('.calc-field').append(problem);
  function showProblem(r) {
    problem.replaceChildren(T.el('p', 'calc-problem-title', `Not valid JSON: line ${r.line}, column ${r.column}`), T.el('p', '', r.message));
    const pre = T.el('pre', 'calc-code'); pre.textContent = `${r.excerpt}\n${' '.repeat(Math.max(0, Math.min(r.column - 1, 40)))}^`;
    problem.append(pre);
    if (r.hint) problem.append(T.el('p', 'calc-hint', `How to fix it: ${r.hint}`));
    problem.hidden = false;
  }

  // Tree search: marks matching rows and opens their parents.
  const searchWrap = T.el('div', 'calc-field'); searchWrap.id = 'jf-search-wrap'; searchWrap.hidden = true;
  const label = T.el('label', '', 'Search the tree'); label.htmlFor = 'jf-search';
  const search = T.el('input'); search.id = 'jf-search'; search.type = 'search'; search.autocomplete = 'off'; search.spellcheck = false;
  const count = T.el('p', 'calc-hint'); count.setAttribute('aria-live', 'polite');
  searchWrap.append(label, search, count);
  $('calc-output').insertAdjacentElement('beforebegin', searchWrap);
  function applySearch() {
    const rows = document.querySelectorAll('#jf-tree .calc-tree-row');
    let n = 0;
    for (const row of rows) {
      const hit = Boolean(searchTerm) && row.dataset.search.includes(searchTerm);
      row.classList.toggle('calc-tree-hit', hit);
      if (hit) { n += 1; for (let p = row.parentElement; p && p.id !== 'jf-tree'; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true; }
    }
    count.textContent = searchTerm ? `${n} match${n === 1 ? '' : 'es'}` : '';
  }
  search.addEventListener('input', () => { searchTerm = search.value.trim().toLowerCase().slice(0, 200); applySearch(); });
  search.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });

  $('jf-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > LIMIT) { problem.replaceChildren(T.el('p', 'calc-problem-title', 'File too large'), T.el('p', '', `${file.name} is ${T.formatBytes(file.size)}. The limit is 1 MB.`)); problem.hidden = false; app?.announce('The file is too large. The limit is 1 MB.'); return; }
    try {
      $('jf-text').value = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()).replace(/^﻿/, '');
      app?.calculate();
    } catch {
      problem.replaceChildren(T.el('p', 'calc-problem-title', 'File could not be read'), T.el('p', '', `${file.name} is not valid UTF-8 text. RFC 8259 requires UTF-8 for JSON exchanged between systems.`));
      problem.hidden = false; app?.announce('The file could not be read as UTF-8 text.');
    }
  });
  form.addEventListener('reset', () => { problem.hidden = true; search.value = ''; searchTerm = ''; count.textContent = ''; });
})();
