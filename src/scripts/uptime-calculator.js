// Uptime and SLA Calculator interface. Formulas live in utility-tool-formulas.js.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const U = window.StackRowUtilityTools?.Uptime;
  if (!T || !U) return;
  const d = U.formatDuration;
  const pct = (v, digits = 4) => `${Number(v.toFixed(digits))}%`;
  const PERIOD_NAMES = { day: 'day', week: 'week', month: 'month', quarter: 'quarter', year: 'year' };
  T.mount({
    icon: 'clock-check', name: 'Uptime and SLA Calculator', file: 'uptime', storeKey: 'stackrow:uptime:v1',
    modeNames: { sla: 'Allowed downtime', down: 'Uptime from downtime', budget: 'Error budget', incidents: 'Incidents and MTTR', system: 'Combined systems' },
    example: { mode: 'sla', values: { sla: '99.9' } },
    compute(c, { viz }) {
      if (c.mode === 'sla') {
        const sla = c.number('sla', { required: true, label: 'an availability target', max: 100, decimals: 6 });
        if (Number.isNaN(sla)) return null;
        const r = U.allowedDowntime(sla);
        const rows = Object.entries(r.seconds);
        return {
          metrics: [['Allowed downtime per month', d(r.seconds.month), `(1 − ${pct(sla)}) × 30.44 days`, true], ...rows.filter(([k]) => k !== 'month').map(([k, s]) => [`Per ${PERIOD_NAMES[k]}`, d(s)])],
          nodes: [viz.bars('Downtime allowed by period', rows.map(([k, s]) => ({ label: `Per ${k}`, value: s, display: d(s), tone: 'blue' })))],
          lines: ['A month here is one twelfth of an average year (30.44 days). Check how your contract defines the month and what counts as downtime.'],
          inputs: [['Availability target', pct(sla)]],
          outputs: rows.map(([k, s]) => [`Downtime per ${k}`, d(s)])
        };
      }
      if (c.mode === 'down') {
        const down = c.number('down', { required: true, label: 'the downtime' });
        if (Number.isNaN(down)) return null;
        const seconds = down * Number(c.value('down_unit'));
        const period = c.value('down_period');
        const r = U.availabilityFromDowntime(seconds, U.PERIODS[period]);
        if (!r.ok) { c.fail('down', r.message); return null; }
        return {
          metrics: [['Availability', pct(r.pct), `1 − ${d(seconds)} ÷ one ${period}`, true], ['Downtime', d(seconds)]],
          inputs: [['Downtime', d(seconds)], ['Period', period]],
          outputs: [['Availability', pct(r.pct)]]
        };
      }
      if (c.mode === 'budget') {
        const sla = c.number('b_sla', { required: true, label: 'an availability target', max: 100, decimals: 6 });
        const used = c.number('b_used', { label: 'downtime used' });
        if ([sla, used].some(Number.isNaN)) return null;
        const period = c.value('b_period');
        const b = U.errorBudget(sla, U.PERIODS[period], used * 60);
        return {
          metrics: [['Error budget left', b.remaining >= 0 ? d(b.remaining) : `Over by ${d(-b.remaining)}`, `${d(b.allowed)} allowed − ${d(b.used)} used`, true], ['Budget used', Number.isFinite(b.consumedPct) ? `${T.formatNumber(b.consumedPct, 1)}%` : 'All of it'], ['Allowed this ' + period, d(b.allowed)]],
          nodes: [viz.gauge('Error budget used', { value: Math.min(b.consumedPct, 150), max: 150, display: Number.isFinite(b.consumedPct) ? `${T.formatNumber(b.consumedPct, 0)}%` : 'Over', marker: 100, markerLabel: 'Budget', good: b.consumedPct <= 100 })],
          warning: b.remaining < 0 ? 'Downtime has exceeded the budget for this period, so the availability target is already missed.' : '',
          inputs: [['Target', pct(sla)], ['Period', period], ['Downtime used', d(used * 60)]],
          outputs: [['Allowed', d(b.allowed)], ['Remaining', d(b.remaining)], ['Used', `${T.formatNumber(b.consumedPct, 1)}%`]]
        };
      }
      if (c.mode === 'incidents') {
        const count = c.number('i_count', { required: true, label: 'the number of incidents', whole: true });
        const mttr = c.number('i_mttr', { required: true, label: 'the repair time' });
        if ([count, mttr].some(Number.isNaN)) return null;
        const period = c.value('i_period');
        const r = U.availabilityFromIncidents(count, mttr * 60, U.PERIODS[period]);
        if (!r.ok) { c.fail('i_mttr', r.message); return null; }
        return {
          metrics: [['Availability', pct(r.pct), `1 − (${count} × ${d(mttr * 60)}) ÷ one ${period}`, true], ['Total downtime', d(r.downSeconds)], ['Mean time between failures', r.mtbfSeconds ? d(r.mtbfSeconds) : 'No failures']],
          inputs: [['Incidents', String(count)], ['MTTR', d(mttr * 60)], ['Period', period]],
          outputs: [['Availability', pct(r.pct)], ['Downtime', d(r.downSeconds)]]
        };
      }
      const list = c.value('s_list').split(',').map(s => s.trim()).filter(Boolean);
      if (!list.length) { c.fail('s_list', 'Enter at least one availability, such as 99.9.'); return null; }
      const values = list.map(Number);
      if (list.length > 50 || values.some(v => !Number.isFinite(v) || v < 0 || v > 100)) { c.fail('s_list', 'Use up to 50 percentages from 0 to 100, separated by commas.'); return null; }
      c.clear('s_list');
      const copies = c.number('s_copies', { required: true, label: 'the number of copies', whole: true, min: 1, max: 10 });
      if (Number.isNaN(copies)) return null;
      const serial = U.serialAvailability(values);
      const total = U.parallelAvailability(serial, copies);
      const month = U.allowedDowntime(total).seconds.month;
      return {
        metrics: [['Combined availability', pct(total), copies > 1 ? `1 − (1 − ${pct(serial)})^${copies}` : `${values.map(v => pct(v)).join(' × ')}`, true], ['One path', pct(serial), 'Every component must be up'], ['Expected downtime per month', d(month)]],
        lines: ['This assumes failures are independent. Shared dependencies, such as one database or one region, make real systems less available than the math suggests.'],
        inputs: [['Components', values.map(v => pct(v)).join(', ')], ['Redundant copies', String(copies)]],
        outputs: [['Single path', pct(serial)], ['Combined', pct(total)], ['Downtime per month', d(month)]]
      };
    }
  });
})();
