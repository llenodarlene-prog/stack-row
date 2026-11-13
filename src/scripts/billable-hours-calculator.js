// Billable hours and rate calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Billable } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Billable || !T) return;
  const hrs = v => `${T.formatNumber(v, 0)} hours`;
  T.mount({
    icon: 'clock-hour-4',
    name: 'Billable Hours Calculator', file: 'billable-hours-calculation', storeKey: 'stackrow:billable:v1',
    modeNames: { hours: 'Billable Hours', rate: 'Required Rate' },
    example: { mode: 'rate', values: { week: '40', weeks: '46', util: '70', income: '95000', costs: '12000', tax: '25' } },
    compute(c, { money, viz }) {
      const week = c.number('week', { required: true, label: 'hours per week', max: 168 });
      const weeks = c.number('weeks', { required: true, label: 'working weeks', max: 52 });
      const util = c.number('util', { required: true, label: 'a utilization rate', max: 100 });
      if ([week, weeks, util].some(Number.isNaN)) return null;
      const h = Billable.hours({ weeklyHours: week, weeks, utilization: util });
      const chart = viz.stack('Working hours per year', [{ label: 'Billable', value: h.billable, display: hrs(h.billable), tone: 'blue' }, { label: 'Non-billable', value: h.nonBillable, display: hrs(h.nonBillable), tone: 'muted' }]);
      if (c.mode === 'rate') {
        const income = c.number('income', { required: true, label: 'a target income' });
        const costs = c.number('costs'), tax = c.number('tax', { max: 90 });
        if ([income, costs, tax].some(Number.isNaN)) return null;
        if (!h.billable) { c.fail('util', 'Use a utilization above zero.'); return null; }
        const r = Billable.requiredRate({ income, expenses: costs, billableHours: h.billable, taxPct: tax });
        return {
          nodes: [chart],
          metrics: [['Minimum hourly rate', money(r.rate), '(Income + expenses) ÷ (1 − tax) ÷ billable hours', true], ['Revenue needed', money(r.needed)], ['Billable hours per year', hrs(h.billable)]],
          lines: [`You need to bill ${money(r.rate)} an hour across ${hrs(h.billable)} to take home ${money(income)}.`, 'This is a floor. Add a margin for slow months, unpaid invoices and rate reviews.'],
          inputs: [['Hours per week', T.formatNumber(week, 1)], ['Working weeks', T.formatNumber(weeks, 0)], ['Utilization', T.formatPercent(util, 0)], ['Target income', money(income)], ['Business expenses', money(costs)], ['Tax set-aside', T.formatPercent(tax, 0)]],
          outputs: [['Minimum hourly rate', money(r.rate)], ['Revenue needed', money(r.needed)], ['Billable hours', T.formatNumber(h.billable, 0)]]
        };
      }
      const rate = c.number('rate');
      if (Number.isNaN(rate)) return null;
      const metrics = [['Billable hours per year', hrs(h.billable), 'Hours per week × weeks × utilization', true], ['Billable hours per week', `${T.formatNumber(week * util / 100, 1)} hours`], ['Non-billable hours per year', hrs(h.nonBillable)]];
      if (rate) metrics.push(['Annual billings', money(h.billable * rate), 'Billable hours × rate']);
      return {
        nodes: [chart],
        metrics,
        lines: [`At ${T.formatPercent(util, 0)} utilization, ${hrs(h.available)} of work produce ${hrs(h.billable)} you can invoice.`],
        inputs: [['Hours per week', T.formatNumber(week, 1)], ['Working weeks', T.formatNumber(weeks, 0)], ['Utilization', T.formatPercent(util, 0)], ['Hourly rate', rate ? money(rate) : 'Not entered']],
        outputs: [['Billable hours', T.formatNumber(h.billable, 0)], ['Non-billable hours', T.formatNumber(h.nonBillable, 0)], ...(rate ? [['Annual billings', money(h.billable * rate)]] : [])]
      };
    }
  });
})();
