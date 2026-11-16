// URL Encoder and Decoder interface. Logic lives in developer-tool-formulas.js.
// Text is only transformed, never fetched, saved, or placed in a share link.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const U = window.StackRowDevTools?.Url;
  if (!T || !U) return;
  const $ = id => document.getElementById(id);
  const form = document.querySelector('#calculator .calc-form');
  const LIMIT = 100000;
  const HIGHLIGHT_LIMIT = 5000;
  const counts = text => `${text.length.toLocaleString('en-US')} characters, ${T.policy.byteLength(text).toLocaleString('en-US')} bytes`;

  // Output as text. Encoded triplets are highlighted for short results; the
  // text is split with a regular expression and added as text nodes only.
  function codeBlock(text, label, highlight) {
    const pre = T.el('pre', 'calc-code');
    pre.setAttribute('aria-label', label);
    pre.tabIndex = 0;
    if (highlight && text.length <= HIGHLIGHT_LIMIT) {
      for (const part of text.split(/(%[0-9A-Fa-f]{2}|\+)/)) { if (!part) continue; pre.append(/^(%[0-9A-Fa-f]{2}|\+)$/.test(part) ? T.el('mark', '', part) : document.createTextNode(part)); }
    } else pre.textContent = text;
    return pre;
  }

  // Query editor rows: plain inputs without names, read by this script.
  const pairsBox = $('ue-pairs');
  let pairCount = 0;
  function addPair(key = '', value = '') {
    pairCount += 1;
    const row = T.el('div', 'calc-pair');
    const id = `ue-pair-${pairCount}`;
    const keyField = T.el('div', 'calc-field'); const keyLabel = T.el('label', '', 'Key'); keyLabel.htmlFor = `${id}-k`;
    const keyInput = T.el('input'); keyInput.id = `${id}-k`; keyInput.value = key; keyInput.dataset.pair = 'key'; keyInput.autocomplete = 'off'; keyInput.spellcheck = false;
    keyField.append(keyLabel, keyInput);
    const valueField = T.el('div', 'calc-field'); const valueLabel = T.el('label', '', 'Value'); valueLabel.htmlFor = `${id}-v`;
    const valueInput = T.el('input'); valueInput.id = `${id}-v`; valueInput.value = value; valueInput.dataset.pair = 'value'; valueInput.autocomplete = 'off'; valueInput.spellcheck = false;
    valueField.append(valueLabel, valueInput);
    const remove = T.el('button', 'calc-link', 'Remove'); remove.type = 'button';
    remove.setAttribute('aria-label', `Remove parameter ${key || pairCount}`);
    remove.addEventListener('click', () => { row.remove(); form.dispatchEvent(new Event('input')); $('ue-add').focus(); });
    row.append(keyField, valueField, remove);
    pairsBox.append(row);
    return keyInput;
  }
  const readPairs = () => [...pairsBox.querySelectorAll('.calc-pair')].map(row => ({ key: row.querySelector('[data-pair="key"]').value, value: row.querySelector('[data-pair="value"]').value }));
  let loadedFrom = null;
  function loadPairs(text) {
    const r = U.parseQueryPairs(text);
    pairsBox.replaceChildren();
    if (r.ok) for (const p of r.pairs) addPair(p.key, p.value);
    loadedFrom = text;
  }
  $('ue-add').addEventListener('click', () => { addPair().focus(); });

  function encodeOptions(c) { return { spaces: c.value('spaces'), preserveEncoded: c.value('keep') === 'yes', upper: c.value('hex') === 'upper' }; }
  const plain = (title, inputText, outputText, extra = {}) => ({
    output: outputText,
    metrics: [[title, `${counts(outputText)}`, `Input: ${counts(inputText)}`, true]],
    nodes: [codeBlock(outputText, title, extra.highlight)],
    lines: extra.lines || [],
    warning: extra.warning || '',
    inputs: [['Input length', counts(inputText)]],
    outputs: [[title, outputText]]
  });

  const app = T.mount({
    icon: 'link', name: 'URL Encoder and Decoder', file: 'url', noun: 'encoder', doneWord: 'done',
    modeNames: { encode: 'Encode', decode: 'Decode', url: 'Parse URL', query: 'Edit query', form: 'Form encoding' },
    labels: { submit: 'Run', reset: 'Reset encoder', copy: 'Copy output' },
    persistence: 'none', share: { mode: 'disabled' }, restore: false, print: false,
    limits: { maxInputBytes: LIMIT },
    privacyMessage: 'Text is processed in your browser and never fetched, saved, or put in the page address. URLs can contain tokens or personal data, so share them with care.',
    example: { mode: 'encode', values: { enc: 'café menu/2026?size=large & hot', spaces: '%20', keep: 'yes', hex: 'upper' } },
    exporters: [{ label: 'Download TXT', mime: 'text/plain;charset=utf-8', extension: 'txt', filename: last => `stack-row-url-${last.mode}-${last.date}`, build: last => last.output }],
    copy: last => last.output,
    onReset() { pairsBox.replaceChildren(); loadedFrom = null; },
    onMode(mode) { $('ue-swap').hidden = !['encode', 'decode'].includes(mode); },
    compute(c) {
      const field = { encode: 'enc', decode: 'dec', url: 'full', query: 'qurl', form: 'form' }[c.mode];
      const text = c.text(field, { required: c.mode !== 'query', label: 'The input', maxBytes: LIMIT });
      if (text === null) return null;
      if (c.mode === 'encode') {
        const r = U.encodeUrlComponent(text, encodeOptions(c));
        if (!r.ok) { c.fail('enc', r.message); return null; }
        return plain('Encoded', text, r.value, { highlight: true, lines: c.value('spaces') === '+' ? ['Spaces are written as +. Only form-style query strings read + as a space; anywhere else it stays a plus sign.'] : [] });
      }
      if (c.mode === 'decode') {
        const r = U.decodeUrlComponent(text);
        if (!r.ok) { c.fail('dec', r.message); return null; }
        return plain('Decoded', text, r.value, { lines: text.includes('+') ? ['This text contains + signs, which stay as + in standard decoding. If they mean spaces, use Form encoding.'] : [] });
      }
      if (c.mode === 'form') {
        const r = U.transformUrlText(text, c.value('fdir') === 'decode' ? 'form-decode' : 'form-encode');
        if (!r.ok) { c.fail('form', r.message); return null; }
        return plain(c.value('fdir') === 'decode' ? 'Decoded form data' : 'Form-encoded', text, r.value, { highlight: c.value('fdir') !== 'decode' });
      }
      if (c.mode === 'url') {
        const r = U.parseUrlForDisplay(text);
        if (!r.ok) { c.fail('full', r.message); return null; }
        const rows = [['Scheme', r.scheme], ['Username', r.username || 'None'], ['Password', r.hasPassword ? 'Present (hidden)' : 'None'], ['Host', r.hostname || 'None'], ['Port', r.port || 'Default for the scheme'], ['Path', r.pathname || '/'], ['Query', r.search || 'None'], ['Fragment', r.hash || 'None']];
        const table = T.el('table', 'calc-table');
        const tbody = T.el('tbody');
        for (const [k, v] of rows) { const tr = T.el('tr'); const th = T.el('th', '', k); th.scope = 'row'; tr.append(th, T.el('td', '', v)); tbody.append(tr); }
        if (r.pairs.length) { const tr = T.el('tr'); const th = T.el('th', '', 'Parameters'); th.scope = 'row'; tr.append(th, T.el('td', '', r.pairs.map(p => `${p.key} = ${p.value}`).join('\n'))); tbody.append(tr); }
        table.append(tbody);
        const wrap = T.el('div', 'calc-table-wrap'); wrap.append(table);
        return {
          output: r.href,
          metrics: [['Normalized URL', r.href, 'As parsed by the browser URL API', true]],
          nodes: [wrap],
          warning: r.hasPassword ? 'This URL contains a password. It is hidden here, but anyone you send the URL to can read it.' : '',
          inputs: [['URL length', counts(text)]],
          outputs: rows
        };
      }
      // Edit query: load pairs when the source text changes, then rebuild.
      if (text !== loadedFrom) loadPairs(text);
      const pairs = readPairs();
      const r = U.rebuildUrl(text, pairs, { spaces: c.value('qspaces') });
      if (!r.ok) { c.fail('qurl', r.message); return null; }
      return plain('Rebuilt URL', text, r.value, { highlight: true, lines: [`${pairs.length} parameter${pairs.length === 1 ? '' : 's'}, in the order shown.`] });
    }
  });

  // Swap: send the output to the other mode's input.
  const swap = T.el('button', 'calc-secondary', 'Swap input and output');
  swap.type = 'button'; swap.id = 'ue-swap';
  swap.addEventListener('click', () => {
    const last = app?.last;
    if (!last || !['encode', 'decode'].includes(last.mode)) return;
    const target = last.mode === 'encode' ? 'decode' : 'encode';
    form.elements[target === 'decode' ? 'dec' : 'enc'].value = last.output;
    document.getElementById(`tab-${target}`).click();
    app.calculate();
  });
  document.querySelector('#calculator .calc-actions')?.append(swap);
})();
