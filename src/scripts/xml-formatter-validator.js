// XML Formatter and Validator interface. Parsing and formatting live in
// developer-tool-formulas.js. Documents stay in this tab: nothing is fetched,
// stored, or placed in a URL, and all output is added as text nodes.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const X = window.StackRowDevTools?.Xml;
  if (!T || !X) return;
  const $ = id => document.getElementById(id);
  const form = document.querySelector('#calculator .calc-form');
  const LIMIT = X.XML_LIMITS.maxBytes;
  let searchTerm = '';

  function outputBlock(text) {
    const pre = T.el('pre', 'calc-code');
    pre.id = 'xf-output'; pre.tabIndex = 0; pre.setAttribute('aria-label', 'Formatted XML');
    paint(pre, text);
    return pre;
  }
  // Highlights search matches with <mark> elements built from text nodes.
  function paint(pre, text) {
    pre.replaceChildren();
    const term = searchTerm;
    if (!term) { pre.textContent = text; return 0; }
    let count = 0; let from = 0;
    const lower = text.toLowerCase(); const needle = term.toLowerCase();
    for (let at = lower.indexOf(needle); at >= 0 && count < 500; at = lower.indexOf(needle, at + needle.length)) {
      pre.append(document.createTextNode(text.slice(from, at)), T.el('mark', '', text.slice(at, at + needle.length)));
      from = at + needle.length; count += 1;
    }
    pre.append(document.createTextNode(text.slice(from)));
    return count;
  }
  function tree(model) {
    const box = T.el('div', 'calc-tree');
    box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'XML tree preview'); box.tabIndex = 0;
    const build = (items, depth) => {
      const ul = T.el('ul');
      for (const item of items) {
        const li = T.el('li');
        if (item.children.length) {
          const details = T.el('details'); details.open = depth < 2;
          details.append(T.el('summary', '', `${item.label} (${item.children.length})`), build(item.children, depth + 1));
          li.append(details);
        } else li.textContent = item.label;
        ul.append(li);
      }
      return ul;
    };
    box.append(T.el('p', 'calc-tree-title', 'Tree preview'), build(model.roots, 0));
    if (model.truncated) box.append(T.el('p', 'calc-hint', `The preview stops at ${X.XML_LIMITS.maxTreeNodes.toLocaleString('en-US')} nodes. The formatted text above is complete.`));
    return box;
  }

  const app = T.mount({
    icon: 'file-code', name: 'XML Formatter and Validator', file: 'xml', noun: 'formatter', doneWord: 'done',
    modeNames: { beautify: 'Beautify', minify: 'Minify', validate: 'Validate' },
    labels: { submit: 'Run', reset: 'Reset formatter', copy: 'Copy XML' },
    persistence: 'none', share: { mode: 'disabled' }, restore: false, print: false,
    limits: { maxInputBytes: LIMIT, maxFileBytes: LIMIT },
    privacyMessage: 'XML is processed in your browser. Files are read on this device only. Nothing is uploaded, saved, or put in the page address, and no external entity or URL is ever loaded.',
    example: { mode: 'beautify', values: { xml: '<?xml version="1.0" encoding="UTF-8"?><catalog xmlns:dc="http://purl.org/dc/elements/1.1/"><!-- Two sample books --><book id="b1" lang="en"><dc:title>Clean Data</dc:title><price currency="USD">29.99</price><note>Ships in <b>2</b> days</note></book><book id="b2"><dc:title>Fast Pipelines</dc:title><price currency="EUR">35.00</price><summary><![CDATA[Uses <pipe> & <stage> tags]]></summary></book></catalog>' } },
    exporters: [{ label: 'Download XML', mime: 'application/xml;charset=utf-8', extension: 'xml', modes: ['beautify', 'minify'], filename: last => `stack-row-${last.mode === 'minify' ? 'minified' : 'formatted'}-${last.date}`, build: last => last.output }],
    copy: last => (last.mode === 'validate' ? last.outputs.map(([k, v]) => `${k}: ${v}`).join('\n') : last.output),
    onMode(mode) { $('panel-xml').setAttribute('aria-labelledby', `tab-${mode}`); $('xf-search-wrap').hidden = mode === 'validate'; },
    compute(c) {
      const text = c.text('xml', { required: true, label: 'The XML document', maxBytes: LIMIT });
      if (text === null) return null;
      const indent = { 2: '  ', 4: '    ', tab: '\t' }[c.value('indent')] || '  ';
      const keepComments = c.value('comments') !== 'drop';
      const r = c.mode === 'minify' ? X.minifyXml(text, { keepComments }) : X.formatXml(text, { indent, keepComments });
      if (!r.ok) {
        const where = r.line ? `Line ${r.line}, column ${r.column}: ` : '';
        c.fail('xml', `${where}${r.message}`);
        showProblem(r);
        return null;
      }
      $('xf-problem').hidden = true;
      c.clear('xml');
      const stats = `${r.stats.nodes.toLocaleString('en-US')} nodes, ${r.stats.maxDepth} levels deep`;
      const nodes = [];
      if (c.mode !== 'validate') nodes.push(outputBlock(r.value));
      if (c.value('tree') === 'show') nodes.push(tree(X.buildXmlTreeModel(r.document)));
      const result = {
        output: r.value,
        metrics: c.mode === 'validate'
          ? [['Result', 'Well-formed XML', 'Checked against XML 1.0 syntax rules. Not checked against a schema.', true], ['Size', stats]]
          : [[c.mode === 'minify' ? 'Minified' : 'Formatted', `${T.policy.byteLength(r.value).toLocaleString('en-US')} bytes`, `${stats}. Input was ${T.policy.byteLength(text).toLocaleString('en-US')} bytes.`, true]],
        nodes,
        warning: r.warnings.join(' '),
        announce: c.mode === 'validate' ? 'The XML is well-formed.' : `XML ${c.mode === 'minify' ? 'minified' : 'formatted'}.`,
        inputs: [['Input size', `${T.policy.byteLength(text)} bytes`]],
        outputs: [['Result', 'Well-formed XML'], ['Nodes', String(r.stats.nodes)], ['Depth', String(r.stats.maxDepth)]]
      };
      window.setTimeout(updateSearchCount, 0);
      return result;
    }
  });

  // A detailed problem box next to the input: location, excerpt and repair hint.
  const problem = T.el('div', 'calc-problem'); problem.id = 'xf-problem'; problem.hidden = true;
  $('xf-text').closest('.calc-field').append(problem);
  function showProblem(r) {
    problem.replaceChildren(T.el('p', 'calc-problem-title', r.line ? `Not well-formed: line ${r.line}, column ${r.column}` : 'Not well-formed'), T.el('p', '', r.message));
    if (r.excerpt !== undefined) { const pre = T.el('pre', 'calc-code'); pre.textContent = `${r.excerpt}\n${' '.repeat(Math.max(0, Math.min(r.column - 1, 40)))}^`; problem.append(pre); }
    if (r.hint) problem.append(T.el('p', 'calc-hint', `How to fix it: ${r.hint.replaceAll('&amp;', '&')}`));
    problem.hidden = false;
  }

  // Search within the output.
  const searchWrap = T.el('div', 'calc-field'); searchWrap.id = 'xf-search-wrap';
  const searchLabel = T.el('label', '', 'Find in output'); searchLabel.htmlFor = 'xf-search';
  const search = T.el('input'); search.id = 'xf-search'; search.type = 'search'; search.autocomplete = 'off'; search.spellcheck = false;
  const searchCount = T.el('p', 'calc-hint'); searchCount.id = 'xf-search-count'; searchCount.setAttribute('aria-live', 'polite');
  searchWrap.append(searchLabel, search, searchCount);
  document.querySelector('#calc-output').insertAdjacentElement('beforebegin', searchWrap);
  function updateSearchCount() {
    const pre = $('xf-output');
    if (!pre || !app?.last) { searchCount.textContent = ''; return; }
    const n = paint(pre, app.last.output);
    searchCount.textContent = searchTerm ? `${n}${n === 500 ? '+' : ''} match${n === 1 ? '' : 'es'}` : '';
  }
  search.addEventListener('input', () => { searchTerm = search.value.slice(0, 200); updateSearchCount(); });
  search.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });

  // Local file input: size check first, then strict UTF-8 decoding.
  $('xf-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const textarea = $('xf-text');
    if (file.size > LIMIT) { textarea.value = ''; problem.replaceChildren(T.el('p', 'calc-problem-title', 'File too large'), T.el('p', '', `${file.name} is ${T.formatBytes(file.size)}. The limit is 1 MB.`)); problem.hidden = false; app?.announce('The file is too large. The limit is 1 MB.'); return; }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      textarea.value = text.replace(/^﻿/, '');
      app?.calculate();
    } catch {
      problem.replaceChildren(T.el('p', 'calc-problem-title', 'File could not be read'), T.el('p', '', `${file.name} is not valid UTF-8 text. Save it as UTF-8 and try again.`));
      problem.hidden = false; app?.announce('The file could not be read as UTF-8 text.');
    }
  });
  form.addEventListener('reset', () => { problem.hidden = true; search.value = ''; searchTerm = ''; searchCount.textContent = ''; });
})();
