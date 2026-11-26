// Workflow automation ROI calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Automation } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Automation || !T) return;
  const hrs = v => `${T.formatNumber(v, 0)} hours`;
  T.mount({
    icon: 'git-merge',
    name: 'Workflow Automation ROI Calculator', file: 'workflow-automation-roi', storeKey: 'stackrow:autoroi:v1',
    example: { values: { volume: '2000', minutes: '6', rate: '45', auto: '80', exc: '10', excmin: '10', err: '3', errcost: '40', errcut: '70', soft: '12000', impl: '15000', maint: '3000', ramp: '3', years: '3' } },
    compute(c, { money, viz }) {
      const volume = c.number('volume', { required: true, label: 'monthly volume', max: 1e9 });
      const minutes = c.number('minutes', { required: true, label: 'minutes per item', max: 1440 });
      const rate = c.number('rate', { required: true, label: 'a loaded hourly cost' });
      const automatablePct = c.number('auto', { required: true, label: 'the automatable share', max: 100 });
      const rest = { exceptionPct: c.number('exc', { max: 100 }), exceptionMinutes: c.number('excmin', { max: 1440 }), errorPct: c.number('err', { max: 100 }), errorCost: c.number('errcost'), errorReductionPct: c.number('errcut', { max: 100 }), software: c.number('soft'), implementation: c.number('impl'), maintenance: c.number('maint'), rampMonths: c.number('ramp', { max: 12 }), years: c.number('years', { fallback: 3, min: 1, max: 5 }) };
      if ([volume, minutes, rate, automatablePct, ...Object.values(rest)].some(Number.isNaN)) return null;
      const r = Automation.roi({ volume, minutes, rate, automatablePct, ...rest, years: Math.round(rest.years) });
      return {
        nodes: [viz.bars('Cumulative net value', r.yearly.map(y => ({ label: `Year ${y.year}`, value: Math.abs(y.cumulative), display: money(y.cumulative), tone: y.cumulative < 0 ? 'red' : 'blue' })))],
        metrics: [[`${r.yearly.length}-year net value`, money(r.net), 'Benefits − software, maintenance and implementation', true], ['ROI', r.roi === null ? 'Not available' : T.formatPercent(r.roi)], ['Payback', r.payback === null ? 'Does not pay back' : `${T.formatNumber(r.payback, 1)} months`], ['Hours returned per year', hrs(r.hoursReturned), 'Automated time − exception handling'], ['Annual benefit', money(r.benefit), 'Labor value + errors avoided'], ['Break-even volume', r.breakEvenVolume === null ? 'Not available' : `${T.formatNumber(r.breakEvenVolume, 0)} items a month`]],
        lines: [`The process takes ${hrs(r.manualHours)} a year by hand, costing ${money(r.manualCost)}.`, `Automation returns ${hrs(r.hoursReturned)} after ${hrs(r.exceptionHours)} of exception handling, and avoids ${money(r.errorSavings)} of error costs.`, 'Returned hours are capacity. They only become cash savings if the time is redeployed or paid hours fall.'],
        warning: r.hoursReturned < 0 ? 'Exception handling uses more time than automation saves.' : '',
        inputs: [['Items per month', T.formatNumber(volume, 0)], ['Minutes per item', T.formatNumber(minutes, 1)], ['Loaded hourly cost', money(rate)], ['Automatable share', T.formatPercent(automatablePct)], ['Exception rate', T.formatPercent(rest.exceptionPct)], ['Software per year', money(rest.software)], ['Implementation', money(rest.implementation)], ['Maintenance per year', money(rest.maintenance)]],
        outputs: [['Net value', money(r.net)], ['ROI', r.roi === null ? '' : T.formatPercent(r.roi)], ['Payback months', r.payback === null ? '' : T.formatNumber(r.payback, 1)], ['Hours returned per year', T.formatNumber(r.hoursReturned, 0)], ['Annual benefit', money(r.benefit)], ['Break-even items per month', r.breakEvenVolume === null ? '' : T.formatNumber(r.breakEvenVolume, 0)]]
      };
    }
  });
})();
