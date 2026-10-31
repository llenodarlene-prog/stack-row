// ROAS calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Roas } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Roas || !T) return;
  const ratio = v => (v === null ? 'Not available' : `${T.formatNumber(v, 2)}:1`);
  T.mount({
    icon: 'target-arrow',
    name: 'ROAS Calculator', file: 'roas-calculation', storeKey: 'stackrow:roas:v1',
    modeNames: { roas: 'ROAS', target: 'Target Planning' },
    example: { mode: 'roas', values: { revenue: '12000', spend: '3000', margin: '40' } },
    compute(c, { money, viz }) {
      const margin = c.number('margin', { max: 100 });
      if (Number.isNaN(margin)) return null;
      const m = margin || null;
      if (c.mode === 'target') {
        const budget = c.number('budget', { required: true, label: 'a planned ad spend' });
        const target = c.number('target', { required: true, label: 'a target ROAS' });
        if ([budget, target].some(Number.isNaN)) return null;
        const needed = Roas.targetRevenue(budget, target);
        const r = Roas.calculate({ revenue: needed, spend: budget, margin: m });
        const metrics = [['Revenue needed', money(needed), 'Revenue = ad spend × target ROAS', true]];
        if (r.breakEven !== null) metrics.push(['Break-even ROAS', ratio(r.breakEven), 'Break-even ROAS = 1 ÷ gross margin'], ['Profit after ad spend at target', money(r.profitAfterAds), 'Revenue × margin − ad spend']);
        return {
          metrics,
          lines: [r.breakEven === null ? 'Add your gross margin to see whether this target is profitable.' : r.aboveBreakEven ? `A ${ratio(target)} target is above your ${ratio(r.breakEven)} break-even, so it covers product costs and ad spend.` : `A ${ratio(target)} target is below your ${ratio(r.breakEven)} break-even, so ads at this level lose money after product costs.`],
          inputs: [['Planned ad spend', money(budget)], ['Target ROAS', ratio(target)], ['Gross margin', m === null ? 'Not entered' : T.formatPercent(m)]],
          outputs: [['Revenue needed', money(needed)], ['Break-even ROAS', ratio(r.breakEven)], ['Profit after ad spend', r.profitAfterAds === null ? 'Not available' : money(r.profitAfterAds)]]
        };
      }
      const revenue = c.number('revenue', { required: true, label: 'revenue' });
      const spend = c.number('spend', { required: true, label: 'ad spend' });
      if ([revenue, spend].some(Number.isNaN)) return null;
      if (!spend) { c.fail('spend', 'Use ad spend above zero.'); return null; }
      const r = Roas.calculate({ revenue, spend, margin: m });
      const metrics = [['ROAS', ratio(r.roas), 'ROAS = revenue ÷ ad spend', true], ['ROAS as a percentage', T.formatPercent(r.roasPct, 0), 'Revenue ÷ ad spend × 100']];
      if (r.breakEven !== null) metrics.push(['Break-even ROAS', ratio(r.breakEven), 'Break-even ROAS = 1 ÷ gross margin'], ['Profit after ad spend', money(r.profitAfterAds), 'Revenue × margin − ad spend']);
      const scaleMax = Math.max(r.roas, r.breakEven || 0, 1) * 1.4;
      return {
        nodes: [viz.gauge('ROAS against break-even', { value: r.roas, max: scaleMax, display: ratio(r.roas), marker: r.breakEven, markerLabel: r.breakEven === null ? '' : `Break-even ${ratio(r.breakEven)}`, good: r.aboveBreakEven })],
        metrics,
        lines: [`Every ${money(1)} of ad spend returned ${money(r.roas)} in revenue.`, r.breakEven === null ? 'ROAS counts revenue, not profit. Add your gross margin to check whether the ads paid for themselves.' : r.aboveBreakEven ? 'ROAS is at or above break-even, so the ads covered product costs and their own spend.' : 'ROAS is below break-even, so the ads lost money once product costs are counted.'],
        warning: r.profitAfterAds !== null && r.profitAfterAds < 0 && r.roas >= 1 ? 'Revenue exceeds ad spend, but the campaign still loses money after product costs.' : '',
        inputs: [['Revenue', money(revenue)], ['Ad spend', money(spend)], ['Gross margin', m === null ? 'Not entered' : T.formatPercent(m)]],
        outputs: [['ROAS', ratio(r.roas)], ['ROAS %', T.formatPercent(r.roasPct, 0)], ['Break-even ROAS', ratio(r.breakEven)], ['Profit after ad spend', r.profitAfterAds === null ? 'Not available' : money(r.profitAfterAds)]]
      };
    }
  });
})();
