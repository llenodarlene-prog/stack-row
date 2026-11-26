// AI ROI calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { AiRoi } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!AiRoi || !T) return;
  const hrs = v => `${T.formatNumber(v, 0)} hours`;
  T.mount({
    icon: 'robot',
    name: 'AI ROI Calculator', file: 'ai-roi-calculation', storeKey: 'stackrow:airoi:v1',
    example: { values: { users: '50', adopt: '70', hours: '5', rate: '60', low: '-5', base: '15', high: '30', license: '30', usage: '', impl: '10000', train: '200', rework: '10', review: '4', ramp: '3', weeks: '48' } },
    compute(c, { money, viz }) {
      const users = c.number('users', { required: true, label: 'the number of people', max: 1e6 });
      const adoptionPct = c.number('adopt', { required: true, label: 'an adoption rate', max: 100 });
      const hoursPerWeek = c.number('hours', { required: true, label: 'hours per week', max: 80 });
      const rate = c.number('rate', { required: true, label: 'a loaded hourly cost' });
      const base = c.number('base', { required: true, label: 'a base-case time change', negative: true, min: -100, max: 100 });
      const low = c.number('low', { negative: true, min: -100, max: 100, fallback: NaN });
      const high = c.number('high', { negative: true, min: -100, max: 100, fallback: NaN });
      const rest = { licensePerUserMonth: c.number('license'), usagePerMonth: c.number('usage'), implementation: c.number('impl'), trainingPerUser: c.number('train'), reworkPct: c.number('rework', { max: 100 }), reviewHoursPerWeek: c.number('review'), rampMonths: c.number('ramp', { max: 12 }), weeks: c.number('weeks', { fallback: 48, max: 52 }) };
      if ([users, adoptionPct, hoursPerWeek, rate, base, ...Object.values(rest)].some(Number.isNaN)) return null;
      const run = changePct => AiRoi.business({ users, adoptionPct, hoursPerWeek, rate, changePct, ...rest });
      const r = run(base);
      const cases = [['Low', low], ['Base', base], ['High', high]].filter(([, v]) => !Number.isNaN(v)).map(([label, v]) => ({ label, v, r: run(v) }));
      return {
        nodes: [viz.bars('First-year net value by scenario', cases.map(s => ({ label: `${s.label} (${T.formatPercent(s.v)})`, value: Math.abs(s.r.netValue), display: money(s.r.netValue), tone: s.r.netValue < 0 ? 'red' : 'blue' })))],
        metrics: [['First-year net value', money(r.netValue), 'Value of time saved − first-year costs', true], ['First-year ROI', r.roi === null ? 'Not available' : T.formatPercent(r.roi)], ['Net hours saved per year', hrs(r.net), 'Gross saved − rework − review'], ['Payback', r.payback === null ? 'Does not pay back' : `${T.formatNumber(r.payback, 1)} months`], ['Break-even time change', r.breakEven === null ? 'Not available' : T.formatPercent(r.breakEven), 'Smallest time saving that covers running costs']],
        lines: [`${T.formatNumber(r.active, 0)} active users spend ${hrs(r.taskHours)} a year on this task. A ${T.formatPercent(base)} change is worth ${money(r.value)} a year after rework and review.`, `Running costs are ${money(r.recurring)} a year, plus ${money(r.oneTime)} one-time.`, 'Saved hours are capacity, not cash, unless the time goes to revenue work or replaces paid hours.'],
        warning: r.net < 0 ? 'At these inputs the tool costs more time than it saves.' : r.breakEven !== null && base < r.breakEven ? 'The base case is below the break-even time change, so running costs exceed the value of time saved.' : '',
        inputs: [['People with access', T.formatNumber(users, 0)], ['Adoption', T.formatPercent(adoptionPct)], ['Hours per week on task', T.formatNumber(hoursPerWeek, 1)], ['Loaded hourly cost', money(rate)], ['Time change (base)', T.formatPercent(base)], ['License per person per month', money(rest.licensePerUserMonth)], ['One-time costs', money(r.oneTime)], ['Rework', T.formatPercent(rest.reworkPct)], ['Review hours per week', T.formatNumber(rest.reviewHoursPerWeek, 1)], ['Ramp-up months', T.formatNumber(rest.rampMonths, 0)]],
        outputs: [['First-year net value', money(r.netValue)], ['First-year ROI', r.roi === null ? '' : T.formatPercent(r.roi)], ['Net hours saved', T.formatNumber(r.net, 0)], ['Annual running cost', money(r.recurring)], ['Payback months', r.payback === null ? '' : T.formatNumber(r.payback, 1)], ['Break-even time change', r.breakEven === null ? '' : T.formatPercent(r.breakEven)]]
      };
    }
  });
})();
