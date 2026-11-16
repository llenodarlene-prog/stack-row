// Unix Timestamp Converter interface. Conversion logic lives in
// developer-tool-formulas.js. Persistence is off: nothing is stored, and only
// one timestamp plus display options can enter a share link.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const D = window.StackRowDevTools?.Timestamp;
  if (!T || !D) return;
  const $ = id => document.getElementById(id);

  // Time-zone suggestions from the browser's own IANA list.
  try {
    const list = $('ts-zones');
    for (const zone of Intl.supportedValuesOf('timeZone')) { const option = document.createElement('option'); option.value = zone; list.append(option); }
  } catch { /* older browsers: UTC and local only */ }

  const zoneValue = raw => { const v = String(raw || '').trim(); return v === '' ? 'UTC' : v.toLowerCase() === 'local' ? 'local' : v; };
  const zoneLabel = zone => (zone === 'local' ? `browser local time (${Intl.DateTimeFormat().resolvedOptions().timeZone})` : zone);
  const unitName = unit => D.UNITS[unit].label.toLowerCase();

  function table(rows) {
    const wrap = T.el('div', 'calc-table-wrap');
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Bulk conversion results');
    const tableNode = T.el('table', 'calc-table');
    const head = T.el('tr');
    for (const h of ['Line', 'Input', 'Unit', 'UTC', 'Selected zone', 'Status']) { const th = T.el('th', '', h); th.scope = 'col'; head.append(th); }
    const thead = T.el('thead'); thead.append(head);
    const tbody = T.el('tbody');
    for (const row of rows) {
      const tr = T.el('tr');
      for (const text of [row.line, row.input, row.ok ? D.UNITS[row.unit].label : '', row.ok ? row.utc : '', row.ok ? row.zoned : '', row.ok ? 'Converted' : `Error: ${row.error}`]) tr.append(T.el('td', '', String(text)));
      tbody.append(tr);
    }
    tableNode.append(thead, tbody);
    wrap.append(tableNode);
    return wrap;
  }

  const app = T.mount({
    icon: 'clock-hour-4', name: 'Unix Timestamp Converter', file: 'unix-timestamp', noun: 'converter', doneWord: 'converted',
    modeNames: { single: 'Timestamp to date', reverse: 'Date to timestamp', bulk: 'Bulk convert' },
    labels: { submit: 'Convert', reset: 'Reset converter', copy: 'Copy results' },
    persistence: 'none',
    share: { mode: 'allowlist', fields: ['ts', 'unit', 'zone'] },
    private: ['bulk', 'dt', 'offset'],
    restore: { ts: { pattern: /^[+-]?\d{1,40}$/, maxLength: 41 }, unit: /^(auto|s|ms|us|ns)$/, zone: { pattern: /^[A-Za-z0-9_+\-/]{1,40}$/, maxLength: 40 } },
    limits: { maxInputBytes: 100000, maxRows: 500 },
    privacyMessage: 'Conversions run in your browser. Nothing is saved, and bulk lists never enter the page address.',
    example: { mode: 'single', values: { ts: '1700000000', unit: 'auto', zone: 'America/New_York' } },
    exporters: [
      { label: 'Download CSV', mime: 'text/csv;charset=utf-8', extension: 'csv', modes: ['bulk'], filename: last => `stack-row-timestamps-${last.date}`,
        build: last => [['line', 'input', 'unit', 'utc', 'selected_zone', 'status'], ...last.rows.map(r => [r.line, r.input, r.ok ? r.unit : '', r.ok ? r.utc : '', r.ok ? r.zoned : '', r.ok ? 'ok' : `error: ${r.error}`])].map(row => row.map(T.csvCell).join(',')).join('\r\n') },
      { label: 'Download TXT', mime: 'text/plain;charset=utf-8', extension: 'txt', modes: ['single', 'reverse'], filename: last => `stack-row-timestamp-${last.date}`,
        build: last => last.outputs.map(([k, v]) => `${k}: ${v}`).join('\n') }
    ],
    // Only the single converter has values that may be shared.
    onMode(mode) { const share = document.getElementById('calc-share'); if (share) share.hidden = mode !== 'single'; },
    copy(last) {
      if (last.mode === 'bulk') return last.rows.filter(r => r.ok).map(r => `${r.input}\t${r.utc}`).join('\n');
      return last.outputs.map(([k, v]) => `${k}: ${v}`).join('\n');
    },
    compute(c) {
      if (c.mode === 'bulk') {
        const text = c.text('bulk', { required: true, label: 'The timestamp list', maxBytes: 100000, maxRows: 500 });
        if (text === null) return null;
        const zone = zoneValue(c.value('bzone'));
        if (!D.validZone(zone)) { c.fail('bzone', 'Choose a time zone from the list, such as America/New_York or UTC.'); return null; }
        c.clear('bzone');
        const r = D.convertTimestampBatch(text, { unit: c.value('bunit'), timeZone: zone });
        if (!r.ok) { c.fail('bulk', r.message); return null; }
        return {
          rows: r.rows,
          announce: `${r.valid} of ${r.rows.length} timestamps converted.`,
          metrics: [['Converted', `${r.valid} of ${r.rows.length}`, 'Lines in the order you pasted them', true], ['Errors', String(r.invalid)]],
          nodes: [table(r.rows)],
          warning: r.invalid ? `${r.invalid} line${r.invalid === 1 ? '' : 's'} could not be converted. They stay in the table and the CSV, marked as errors.` : '',
          inputs: [['Lines', String(r.rows.length)], ['Unit', c.value('bunit') === 'auto' ? 'Auto detect' : D.UNITS[c.value('bunit')].label], ['Zone', zoneLabel(zone)]],
          outputs: [['Converted', String(r.valid)], ['Errors', String(r.invalid)]]
        };
      }
      if (c.mode === 'reverse') {
        const interp = c.value('interp');
        const r = D.parseUtcOrOffsetDate(c.value('dt'), interp, c.value('offset'));
        if (!r.ok) {
          const field = ['offset', 'contradiction'].includes(r.code) ? 'offset' : 'dt';
          if (r.code === 'empty' && document.activeElement?.id !== 'ts-date' && !c.value('dt')) { c.fail('dt', r.message); return null; }
          c.fail(field, r.message); return null;
        }
        c.clear('dt'); c.clear('offset');
        const read = interp === 'utc' ? 'UTC' : interp === 'local' ? zoneLabel('local') : `UTC${c.value('offset').trim()}`;
        return {
          metrics: [['Seconds', r.seconds.toString(), 'Whole seconds since 1970-01-01T00:00:00Z', true], ['Milliseconds', r.milliseconds.toString()], ['Microseconds', r.microseconds.toString()], ['Nanoseconds', r.nanos.toString()], ['RFC 3339', r.rfc3339 || 'Not available for this year'], ['ISO 8601 (milliseconds)', r.iso]],
          warning: r.note,
          lines: [`Read as ${read}.`],
          inputs: [['Date and time', c.value('dt')], ['Read as', read]],
          outputs: [['Seconds', r.seconds.toString()], ['Milliseconds', r.milliseconds.toString()], ['Microseconds', r.microseconds.toString()], ['Nanoseconds', r.nanos.toString()], ['RFC 3339', r.rfc3339 || 'Not available'], ['ISO 8601', r.iso]]
        };
      }
      const unit = c.value('unit');
      const zone = zoneValue(c.value('zone'));
      const r = D.convertTimestamp(c.value('ts'), { unit, timeZone: zone });
      if (!r.ok) { c.fail(r.code === 'zone' ? 'zone' : 'ts', r.message); return null; }
      c.clear('ts'); c.clear('zone');
      const remainder = r.unit === 'us' || r.unit === 'ns' ? `${r.remainderNs.toLocaleString('en-US')} ns below the millisecond` : 'None';
      return {
        metrics: [['UTC', r.utc, `Unit: ${unitName(r.unit)}${r.detected ? ' (auto detected)' : ''}`, true], [`Time in ${zoneLabel(zone)}`, r.zoned, `Offset ${r.offset}`], ['RFC 3339', r.rfc3339 || 'Not available for this year'], ['ISO 8601 (milliseconds)', r.iso], ['Exact input', r.input.toString()], ['Sub-millisecond remainder', remainder]],
        lines: r.detected ? [`Auto detect read this as ${unitName(r.unit)} because of its size (10 digits is seconds today, 13 milliseconds, 16 microseconds, 19 nanoseconds). If that is wrong, choose the unit.`] : [],
        inputs: [['Timestamp', r.input.toString()], ['Unit', D.UNITS[r.unit].label + (r.detected ? ' (auto)' : '')], ['Zone', zoneLabel(zone)]],
        outputs: [['UTC', r.utc], [zoneLabel(zone), r.zoned], ['RFC 3339', r.rfc3339 || 'Not available'], ['ISO 8601', r.iso], ['Seconds', r.seconds.toString()], ['Milliseconds', r.milliseconds.toString()]]
      };
    }
  });

  // Examples fill the single converter.
  for (const button of document.querySelectorAll('[data-ts-example]')) {
    button.addEventListener('click', () => {
      const form = document.querySelector('#calculator .calc-form');
      form.elements.ts.value = button.dataset.tsExample;
      form.elements.unit.value = 'auto';
      app?.calculate();
    });
  }

  // Current time: updates every second and pauses while the tab is hidden.
  let timer = null;
  const tick = () => { const now = Date.now(); $('ts-now-s').textContent = String(Math.floor(now / 1000)); $('ts-now-ms').textContent = String(now); };
  const start = () => { tick(); window.clearInterval(timer); timer = window.setInterval(tick, 1000); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.clearInterval(timer); else start(); });
  start();
  $('ts-copy-s').addEventListener('click', event => app?.copyText($('ts-now-s').textContent, event.currentTarget, 'Current Unix time in seconds copied.'));
  $('ts-copy-ms').addEventListener('click', event => app?.copyText($('ts-now-ms').textContent, event.currentTarget, 'Current Unix time in milliseconds copied.'));
})();
