// ROI calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Roi } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Roi || !T) return;
  const pct = T.formatPercent;
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };

  // Cumulative net value at a few checkpoints, drawn as labeled bars.
  function chart(cumulative, money) {
    const points = [...new Set([3, 6, 12, 18, 24, 36, 48, 60, cumulative.length].filter(m => m <= cumulative.length))];
    const max = Math.max(...points.map(m => Math.abs(cumulative[m - 1])), 1);
    const figure = el('figure', 'calc-figure');
    const list = el('ul', 'calc-bars');
    for (const month of points) {
      const value = cumulative[month - 1];
      const item = el('li', value < 0 ? 'calc-bar calc-bar-negative' : 'calc-bar');
      const bar = el('span', 'calc-bar-fill');
      bar.style.setProperty('--w', `${(Math.abs(value) / max) * 100}%`);
      item.append(el('span', 'calc-bar-label', `Month ${month}`), bar, el('span', 'calc-bar-value', money(value)));
      list.append(item);
    }
    figure.append(el('figcaption', 'calc-table-caption', 'Cumulative net value'), list);
    return figure;
  }

  T.mount({
    icon: 'trending-up',
    name: 'ROI Calculator',
    file: 'roi-calculation',
    storeKey: 'stackrow:roi:v1',
    modeNames: { simple: 'Simple ROI', project: 'Technology Project' },
    example: { mode: 'project', values: { implementation: '25000', training: '5000', licensing: '2000', operating: '500', revenue: '1500', hours: '120', hourly: '45', months: '36', sensitivity: '20' } },
    compute(c, { money, viz }) {
      if (c.mode === 'simple') {
        const cost = c.number('cost', { required: true, label: 'the amount invested' });
        const value = c.number('value', { required: true, label: 'the final value' });
        const years = c.number('years', { max: 100 });
        if ([cost, value, years].some(Number.isNaN)) return null;
        if (cost <= 0) { c.fail('cost', 'Use an amount above zero.'); return null; }
        const r = Roi.simple({ cost, value, years });
        const metrics = [['ROI', pct(r.roi), 'ROI = (final value - amount invested) ÷ amount invested × 100', true], ['Net gain', money(r.gain), 'Final value - amount invested']];
        if (years) metrics.push(['Annualized ROI', pct(r.annualized), `((final ÷ invested)^(1 ÷ ${T.formatNumber(years, 2)} years) - 1) × 100`]);
        return {
          nodes: [viz.bars('Invested versus returned', [{ label: 'Invested', value: cost, display: money(cost), tone: 'navy' }, { label: 'Final value', value: value, display: money(value), tone: r.gain >= 0 ? 'green' : 'red' }])],
          metrics,
          lines: [r.gain >= 0 ? `Every ${money(1)} invested returned ${money(value / cost)}.` : 'The investment lost value over the period.', ...(years ? [] : ['Add a holding period to compare investments of different lengths.'])],
          inputs: [['Amount invested', money(cost)], ['Final value', money(value)], ['Years', years ? String(years) : 'Not entered']],
          outputs: [['ROI', pct(r.roi)], ['Net gain', money(r.gain)], ['Annualized ROI', pct(r.annualized)]]
        };
      }
      const values = {};
      for (const name of ['implementation', 'training', 'licensing', 'operating', 'revenue', 'hours', 'hourly']) values[name] = c.number(name);
      values.months = c.number('months', { whole: true, fallback: 36, min: 1, max: 120 });
      const sensitivity = c.number('sensitivity', { fallback: 20, max: 100 });
      if ([...Object.values(values), sensitivity].some(Number.isNaN)) return null;
      const r = Roi.project(values);
      if (r.totalCost <= 0) { c.fail('implementation', 'Enter at least one cost.'); return null; }
      if (r.monthlyBenefit <= 0) { c.fail('revenue', 'Enter added revenue, savings, or hours saved.'); return null; }
      const low = Roi.project({ ...values, revenue: values.revenue * (1 - sensitivity / 100), hourly: values.hourly * (1 - sensitivity / 100) });
      const high = Roi.project({ ...values, revenue: values.revenue * (1 + sensitivity / 100), hourly: values.hourly * (1 + sensitivity / 100) });
      const payback = r.payback === null ? 'Not reached' : r.payback === 0 ? 'Immediate' : `${T.formatNumber(r.payback, 1)} months`;
      const lines = [];
      if (r.payback === null) lines.push('Monthly costs are equal to or higher than monthly benefits, so the project never pays back.');
      else if (r.payback > values.months) lines.push(`Payback takes longer than the ${values.months}-month period, so ROI is negative within it.`);
      else lines.push(`The project recovers its one-time costs in ${payback} and adds ${money(r.monthlyNet)} of net value each month after that.`);
      lines.push(`With benefits ${sensitivity}% lower, ROI is ${pct(low.roi)}. With benefits ${sensitivity}% higher, ROI is ${pct(high.roi)}.`);
      return {
        metrics: [
          ['ROI over the period', pct(r.roi), '(Total benefits - total costs) ÷ total costs × 100', true],
          ['Net value', money(r.net), `Benefits ${money(r.totalBenefit)} - costs ${money(r.totalCost)}`],
          ['Payback period', payback, 'One-time costs ÷ (monthly benefit - monthly cost)'],
          ['Annualized ROI', pct(r.annualized), `(1 + ROI)^(12 ÷ ${values.months}) - 1`],
          ['Monthly benefit', money(r.monthlyBenefit), 'Revenue or savings + hours saved × hourly cost']
        ],
        nodes: [chart(r.cumulative, money)],
        lines,
        inputs: [['Implementation', money(values.implementation)], ['Training', money(values.training)], ['Licensing per month', money(values.licensing)], ['Other operating cost per month', money(values.operating)], ['Revenue or savings per month', money(values.revenue)], ['Hours saved per month', T.formatNumber(values.hours, 1)], ['Cost per hour', money(values.hourly)], ['Period', `${values.months} months`]],
        outputs: [['ROI', pct(r.roi)], ['Net value', money(r.net)], ['Total benefits', money(r.totalBenefit)], ['Total costs', money(r.totalCost)], ['Payback period', payback], ['Annualized ROI', pct(r.annualized)], [`ROI with benefits ${sensitivity}% lower`, pct(low.roi)], [`ROI with benefits ${sensitivity}% higher`, pct(high.roi)]]
      };
    }
  });
})();
