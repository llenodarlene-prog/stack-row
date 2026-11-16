// UUID Generator and Validator interface. Logic lives in
// developer-tool-formulas.js. Values are generated with the browser's Web
// Cryptography API, never stored, and never placed in a URL.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const U = window.StackRowDevTools?.Uuid;
  if (!T || !U) return;
  const cryptoApi = window.crypto;
  const randomBytes = cryptoApi?.getRandomValues ? n => cryptoApi.getRandomValues(new Uint8Array(n)) : null;
  const nativeV4 = typeof cryptoApi?.randomUUID === 'function' ? () => cryptoApi.randomUUID() : null;
  const state = U.createV7State(); // one ordering sequence per page instance

  function list(values, copyButton) {
    const box = T.el('ol', 'calc-uuid-list');
    box.setAttribute('aria-label', 'Generated UUIDs');
    for (const value of values) {
      const item = T.el('li');
      item.append(T.el('code', '', value), copyButton(value, `UUID ${value}`));
      box.append(item);
    }
    return box;
  }
  const yesNo = v => (v ? 'Yes' : 'No');

  const app = T.mount({
    icon: 'fingerprint', name: 'UUID Generator', file: 'uuids', noun: 'generator', doneWord: 'ready',
    modeNames: { generate: 'Generate UUIDs', validate: 'Validate a UUID' },
    labels: { submit: 'Generate', reset: 'Reset generator', copy: 'Copy all' },
    persistence: 'none', share: { mode: 'disabled' }, restore: false, print: false,
    liveModes: ['validate'],
    limits: { maxItems: U.MAX_UUIDS },
    privacyMessage: 'UUIDs are generated in your browser with the Web Cryptography API. They are not sent to Stack Row, saved, or added to the page address.',
    example: { mode: 'validate', values: { check: '{019A8C2E-1234-7ABC-8DEF-0123456789AB}' } },
    exporters: [
      { label: 'Download TXT', mime: 'text/plain;charset=utf-8', extension: 'txt', modes: ['generate'], filename: last => `stack-row-uuids-${last.date}`, build: last => `${last.values.join('\n')}\n` },
      { label: 'Download CSV', mime: 'text/csv;charset=utf-8', extension: 'csv', modes: ['generate'], filename: last => `stack-row-uuids-${last.date}`, build: last => ['uuid', ...last.values].map(T.csvCell).join('\r\n') }
    ],
    onMode(mode) {
      const submit = document.querySelector('#calculator button[type="submit"]');
      if (submit) { const svg = submit.querySelector('svg'); submit.replaceChildren(...(svg ? [svg] : []), document.createTextNode(mode === 'validate' ? 'Check UUID' : 'Generate')); }
    },
    copy(last) { return last.mode === 'generate' ? last.values.join('\n') : last.outputs.map(([k, v]) => `${k}: ${v}`).join('\n'); },
    compute(c, { copyButton }) {
      if (c.mode === 'validate') {
        const r = U.inspectUuid(c.value('check'));
        if (!r.ok) { c.fail('check', r.message); return null; }
        c.clear('check');
        const kind = r.special || `Version ${r.version}${r.version === 4 ? ' (random)' : r.version === 7 ? ' (Unix time ordered)' : ''}`;
        const metrics = [['Result', r.alternate ? 'Valid, alternate form' : 'Valid, canonical form', r.alternate ? 'Accepted and normalized below' : 'Matches RFC 9562 canonical text', true], ['Canonical form', r.canonical], ['Version', kind], ['Variant', r.variant]];
        if (r.timestamp?.ok) metrics.push(['Embedded time (UTC)', r.timestamp.iso, `${r.timestamp.ms} ms since the Unix epoch`]);
        const notes = [];
        if (r.form.braces) notes.push('Input used braces.');
        if (r.form.urn) notes.push('Input used the urn:uuid: prefix.');
        if (r.form.upper) notes.push('Input used uppercase letters. RFC 9562 output is lowercase.');
        if (!r.form.hyphens) notes.push('Input had no hyphens.');
        return {
          metrics, lines: notes,
          announce: `Valid UUID. ${kind}.`,
          inputs: [['UUID', c.value('check').trim()]],
          outputs: [['Canonical', r.canonical], ['Version', kind], ['Variant', r.variant], ['Braces', yesNo(r.form.braces)], ['Uppercase', yesNo(r.form.upper)], ['Hyphens', yesNo(r.form.hyphens)], ...(r.timestamp?.ok ? [['Embedded time', r.timestamp.iso]] : [])]
        };
      }
      const raw = c.value('quantity').trim();
      if (!/^\d+$/.test(raw)) { c.fail('quantity', raw.startsWith('-') ? 'Use a number from 1 to 1,000.' : 'Enter a whole number from 1 to 1,000.'); return null; }
      const quantity = Number(raw);
      const countError = c.policy.checkCount(quantity, U.MAX_UUIDS, 'Quantity');
      if (countError) { c.fail('quantity', countError); return null; }
      c.clear('quantity');
      const version = c.value('version');
      const r = U.generateUuidBatch({ version, quantity, upper: c.value('case') === 'upper', hyphens: c.value('hyphens') === 'yes', braces: c.value('braces') === 'yes' }, { randomBytes, nativeV4, state });
      if (!r.ok) { c.fail('quantity', r.message); return null; }
      return {
        values: r.values,
        announce: `${quantity} UUID${quantity === 1 ? '' : 's'} generated.`,
        metrics: [[quantity === 1 ? 'Your UUID' : `${quantity.toLocaleString('en-US')} UUIDs`, quantity === 1 ? r.values[0] : `Version ${version.slice(1)}`, version === 'v7' ? 'Time ordered within this page' : '122 random bits each', true]],
        nodes: [list(r.values, copyButton)],
        lines: version === 'v7' ? ['Version 7 values from this page sort in creation order. Ordering is not coordinated with other tabs, browsers, or servers.'] : [],
        inputs: [['Version', version], ['Quantity', String(quantity)]],
        outputs: r.values.map((v, i) => [`UUID ${i + 1}`, v])
      };
    }
  });
  // Start with one standard UUID so the page is useful straight away.
  app?.calculate({ explicit: false, save: false });
})();
