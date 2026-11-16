// Cron Expression Generator and Explainer. Parsing, wording and next-run
// search live in utility-tool-formulas.js. Expressions are not sensitive, so
// one expression and zone can be shared; nothing is saved.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const C = window.StackRowUtilityTools?.Cron;
  if (!T || !C) return;
  const form = document.querySelector('#calculator .calc-form');
  try { const list = document.getElementById('cr-zones'); for (const z of Intl.supportedValuesOf('timeZone')) { const o = document.createElement('option'); o.value = z; list.append(o); } } catch { /* UTC and local only */ }
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function zoneTools(zone) {
    const opts = { hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short', ...(zone === 'local' ? {} : { timeZone: zone }) };
    const fmt = new Intl.DateTimeFormat('en-US', opts);
    const parts = ms => { const o = {}; for (const p of fmt.formatToParts(ms)) o[p.type] = p.value; return { year: +o.year, month: +o.month, day: +o.day, hour: +o.hour % 24, minute: +o.minute, weekday: WEEKDAYS.indexOf(o.weekday) }; };
    const show = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23', ...(zone === 'local' ? {} : { timeZone: zone }) });
    return { parts, show: ms => show.format(ms) };
  }
  const FIELD_INPUTS = ['b_min', 'b_hour', 'b_dom', 'b_month', 'b_dow'];
  T.mount({
    icon: 'calendar-time', name: 'Cron Expression Generator', file: 'cron', noun: 'generator', doneWord: 'explained',
    modeNames: { explain: 'Explain an expression', build: 'Build an expression' },
    labels: { submit: 'Show schedule', reset: 'Reset generator', copy: 'Copy expression' },
    persistence: 'none', print: false,
    share: { mode: 'allowlist', fields: ['expr', 'zone'] },
    restore: { expr: { pattern: /^[0-9A-Za-z*,/@\- ]{1,100}$/, maxLength: 100 }, zone: { pattern: /^[A-Za-z0-9_+\-/]{1,40}$/, maxLength: 40 } },
    privacyMessage: 'Schedules are worked out in your browser. Nothing is saved, and only the expression and time zone can go in a share link.',
    example: { mode: 'explain', values: { expr: '*/15 9-17 * * MON-FRI', zone: 'America/New_York' } },
    exporters: [{ label: 'Download TXT', mime: 'text/plain;charset=utf-8', extension: 'txt', filename: last => `stack-row-cron-${last.date}`, build: last => `${last.expression}\n# ${last.description}\n` }],
    copy: last => last.expression,
    onMode(mode) { const share = document.getElementById('calc-share'); if (share) share.hidden = mode !== 'explain'; },
    compute(c, { copyButton }) {
      const expression = c.mode === 'build' ? FIELD_INPUTS.map(n => c.value(n).trim() || '*').join(' ') : c.value('expr');
      const p = C.parseCron(expression);
      if (!p.ok) {
        if (c.mode === 'build') c.fail(p.field !== undefined ? FIELD_INPUTS[p.field] : 'b_min', p.message); else c.fail('expr', p.message);
        return null;
      }
      for (const n of [...FIELD_INPUTS, 'expr']) c.clear(n);
      const rawZone = c.value('zone').trim() || 'UTC';
      const zone = rawZone.toLowerCase() === 'local' ? 'local' : rawZone;
      let tools;
      try { tools = zoneTools(zone); } catch { c.fail('zone', 'Choose a time zone from the list, such as Europe/London or UTC.'); return null; }
      c.clear('zone');
      const description = C.describeCron(p);
      const runs = C.nextCronRuns(p, { from: Date.now(), count: 5, zoneParts: tools.parts });
      const list = T.el('ol', 'calc-uuid-list'); list.setAttribute('aria-label', 'Next run times');
      for (const t of runs) list.append(T.el('li', '', tools.show(t)));
      const zoneName = zone === 'local' ? `browser local time (${Intl.DateTimeFormat().resolvedOptions().timeZone})` : zone;
      const expr = T.el('p', 'calc-code'); expr.textContent = p.expression; expr.append(' ', copyButton(p.expression, 'cron expression'));
      return {
        expression: p.expression, description,
        announce: description,
        metrics: [['Schedule', description, `Expression: ${p.expression}`, true], ['Next run', runs[0] ? tools.show(runs[0]) : 'None in the next five years', `Times in ${zoneName}`]],
        nodes: [expr, T.el('p', 'calc-tree-title', 'Next five runs'), list],
        warning: !runs.length ? 'This schedule never matches a real date, for example February 30.' : (!p.domStar && !p.dowStar ? 'Both day fields are set, so the job runs when EITHER the day of month OR the day of week matches.' : ''),
        lines: ['Jobs scheduled during a daylight saving change may be skipped or run twice, depending on the cron implementation. Schedule critical jobs in UTC to avoid this.'],
        inputs: [['Expression', p.expression], ['Time zone', zoneName]],
        outputs: [['Schedule', description], ...runs.map((t, i) => [`Run ${i + 1}`, tools.show(t)])]
      };
    }
  });
  form.elements.preset.addEventListener('change', () => {
    const value = form.elements.preset.value;
    if (!value) return;
    value.split(' ').forEach((part, i) => { form.elements[FIELD_INPUTS[i]].value = part; });
    form.dispatchEvent(new Event('input'));
  });
})();
