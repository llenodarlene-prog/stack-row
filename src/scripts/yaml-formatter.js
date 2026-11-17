// YAML Formatter and Validator interface. Parsing uses js-yaml (MIT) through
// utility-tool-formulas.js, with the safe core schema, size limits and an
// alias-expansion guard. Everything stays in this tab.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const Y = window.StackRowUtilityTools?.Yaml;
  const yaml = window.jsyaml;
  if (!T || !Y || !yaml) return;
  const $ = id => document.getElementById(id);
  const form = document.querySelector('#calculator .calc-form');
  const LIMIT = Y.YAML_LIMITS.maxBytes;
  const problem = T.el('div', 'calc-problem'); problem.id = 'ym-problem'; problem.hidden = true;
  $('ym-text').closest('.calc-field').append(problem);
  function showProblem(r) {
    problem.replaceChildren(T.el('p', 'calc-problem-title', r.line ? `Problem at line ${r.line}, column ${r.column}` : 'Problem found'), T.el('p', '', r.message));
    if (r.excerpt !== undefined) { const pre = T.el('pre', 'calc-code'); pre.textContent = `${r.excerpt}\n${' '.repeat(Math.max(0, Math.min((r.column || 1) - 1, 60)))}^`; problem.append(pre); }
    problem.hidden = false;
  }
  const codeBlock = (text, label) => { const pre = T.el('pre', 'calc-code'); pre.tabIndex = 0; pre.setAttribute('aria-label', label); pre.textContent = text; return pre; };

  const app = T.mount({
    icon: 'file-code', name: 'YAML Formatter and Validator', file: 'yaml', noun: 'formatter', doneWord: 'done',
    modeNames: { format: 'Format YAML', validate: 'Validate YAML', tojson: 'YAML to JSON', toyaml: 'JSON to YAML' },
    labels: { submit: 'Run', reset: 'Reset formatter', copy: 'Copy output' },
    persistence: 'none', share: { mode: 'disabled' }, restore: false, print: false,
    limits: { maxInputBytes: LIMIT },
    privacyMessage: 'YAML is processed in your browser. Files are read on this device only. Nothing is uploaded, saved, or put in the page address.',
    example: { mode: 'format', values: { yaml: 'service: checkout-api\nreplicas: 3\nimage: {name: registry.example.com/checkout, tag: "1.8.2"}\nports: [8080, 9090]\ndefaults: &defaults\n  timeout_seconds: 30\n  retries: 2\nprod:\n  <<: *defaults\n  retries: 5\nenabled: yes   # kept as the string "yes" in YAML 1.2\n' } },
    exporters: [
      { label: 'Download YAML', mime: 'application/yaml;charset=utf-8', extension: 'yaml', modes: ['format', 'toyaml'], filename: last => `stack-row-formatted-${last.date}`, build: last => last.output },
      { label: 'Download JSON', mime: 'application/json;charset=utf-8', extension: 'json', modes: ['tojson'], filename: last => `stack-row-yaml-to-json-${last.date}`, build: last => last.output }
    ],
    copy: last => last.output,
    onMode(mode) { $('panel-yaml').setAttribute('aria-labelledby', `tab-${mode}`); $('ym-label').textContent = mode === 'toyaml' ? 'JSON' : 'YAML'; },
    compute(c) {
      const text = c.text('yaml', { required: true, label: c.mode === 'toyaml' ? 'The JSON input' : 'The YAML input', maxBytes: LIMIT });
      if (text === null) return null;
      const indent = Number(c.value('indent')) || 2;
      const sortKeys = c.value('sort') === 'sort';
      const r = c.mode === 'tojson' ? Y.yamlToJson(text, yaml, { indent }) : c.mode === 'toyaml' ? Y.jsonToYaml(text, yaml, { indent, sortKeys }) : Y.formatYaml(text, yaml, { indent, sortKeys });
      if (!r.ok) { c.fail('yaml', `${r.line ? `Line ${r.line}, column ${r.column}: ` : ''}${r.message}`); showProblem(r); return null; }
      problem.hidden = true; c.clear('yaml');
      const warnings = [];
      if (r.hasComments && c.mode !== 'validate') warnings.push('Comments are not kept in the output, because the YAML is rebuilt from its data.');
      if (r.stats?.aliases && c.mode !== 'validate') warnings.push('Anchors and aliases are written out in full in the output.');
      if (r.stats?.documents > 1) warnings.push(`The input has ${r.stats.documents} documents.${c.mode === 'tojson' ? ' They are converted to a JSON array.' : ''}`);
      const stats = r.stats ? `${r.stats.nodes.toLocaleString('en-US')} values, ${r.stats.maxDepth} levels deep` : '';
      return {
        output: r.value,
        announce: c.mode === 'validate' ? 'The YAML is valid.' : 'Done.',
        metrics: c.mode === 'validate' ? [['Result', 'Valid YAML', 'Parsed with the YAML 1.2 core schema', true], ['Size', stats], ['Documents', String(r.stats.documents)]] : [[{ format: 'Formatted YAML', tojson: 'JSON', toyaml: 'YAML' }[c.mode], `${T.policy.byteLength(r.value).toLocaleString('en-US')} bytes`, stats, true]],
        nodes: c.mode === 'validate' ? [] : [codeBlock(r.value, 'Output')],
        warning: warnings.join(' '),
        inputs: [['Input size', `${T.policy.byteLength(text)} bytes`]],
        outputs: [['Result', c.mode === 'validate' ? 'Valid' : 'Converted']]
      };
    }
  });
  $('ym-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > LIMIT) { showProblem({ message: `${file.name} is ${T.formatBytes(file.size)}. The limit is 1 MB.` }); return; }
    try { $('ym-text').value = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()).replace(/^﻿/, ''); app?.calculate(); }
    catch { showProblem({ message: `${file.name} is not valid UTF-8 text.` }); }
  });
  form.addEventListener('reset', () => { problem.hidden = true; });
})();
