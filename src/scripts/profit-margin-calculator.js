// Profit margin calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Margin } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Margin || !T) return;
  const pct = v => T.formatPercent(v);
  T.mount({
    icon: 'percentage',
    name: 'Profit Margin Calculator', file: 'profit-margin-calculation', storeKey: 'stackrow:margin:v1',
    modeNames: { gross: 'Gross Margin', net: 'Net Margin', price: 'Price From Margin' },
    example: { mode: 'net', values: { nrevenue: '250000', cogs: '100000', opex: '90000', interest: '5000', taxes: '11000' } },
    compute(c, { money, viz }) {
      if (c.mode === 'price') {
        const cost = c.number('pcost', { required: true, label: 'a cost' });
        const target = c.number('target', { required: true, label: 'a target margin', max: 99.99 });
        if ([cost, target].some(Number.isNaN)) return null;
        const price = Margin.priceForMargin(cost, target);
        return {
          metrics: [['Selling price', money(price), 'Price = cost ÷ (1 − margin ÷ 100)', true], ['Gross profit per unit', money(price - cost)], ['Equivalent markup', pct(((price - cost) / cost) * 100 || 0)]],
          lines: [`To keep ${pct(target)} of each sale as gross profit, sell at ${money(price)}.`],
          inputs: [['Cost', money(cost)], ['Target margin', pct(target)]],
          outputs: [['Selling price', money(price)], ['Gross profit', money(price - cost)]]
        };
      }
      if (c.mode === 'net') {
        const revenue = c.number('nrevenue', { required: true, label: 'revenue' });
        const cogs = c.number('cogs', { required: true, label: 'cost of goods sold' });
        const opex = c.number('opex'), interest = c.number('interest'), taxes = c.number('taxes');
        if ([revenue, cogs, opex, interest, taxes].some(Number.isNaN)) return null;
        if (!revenue) { c.fail('nrevenue', 'Use revenue above zero.'); return null; }
        const s = Margin.statement({ revenue, cogs, opex, interest, taxes });
        return {
          nodes: [viz.bars('Margins as a share of revenue', [{ label: 'Gross', value: s.grossMargin, display: pct(s.grossMargin) }, { label: 'Operating', value: s.operatingMargin, display: pct(s.operatingMargin) }, { label: 'Net', value: s.netMargin, display: pct(s.netMargin), tone: s.net < 0 ? 'red' : 'cyan' }])],
          metrics: [['Net profit margin', pct(s.netMargin), 'Net profit ÷ revenue × 100', true], ['Net profit', money(s.net)], ['Operating margin', pct(s.operatingMargin), '(Gross profit − operating expenses) ÷ revenue'], ['Gross margin', pct(s.grossMargin), '(Revenue − COGS) ÷ revenue']],
          lines: [`Out of every ${money(1)} of revenue, ${money(s.netMargin / 100)} remains after all listed costs.`],
          warning: s.net < 0 ? 'Costs exceed revenue, so the business made a loss in this period.' : '',
          inputs: [['Revenue', money(revenue)], ['COGS', money(cogs)], ['Operating expenses', money(opex)], ['Interest', money(interest)], ['Taxes', money(taxes)]],
          outputs: [['Gross margin', pct(s.grossMargin)], ['Operating margin', pct(s.operatingMargin)], ['Net margin', pct(s.netMargin)], ['Net profit', money(s.net)]]
        };
      }
      const revenue = c.number('revenue', { required: true, label: 'revenue' });
      const cost = c.number('cost', { required: true, label: 'cost' });
      if ([revenue, cost].some(Number.isNaN)) return null;
      if (!revenue) { c.fail('revenue', 'Use revenue above zero.'); return null; }
      const r = Margin.fromCost(revenue, cost);
      return {
        nodes: [viz.stack('Where revenue goes', [{ label: 'Cost', value: Math.min(cost, revenue), display: money(cost), tone: 'slate' }, { label: 'Gross profit', value: Math.max(r.profit, 0), display: money(r.profit), tone: 'blue' }])],
        metrics: [['Gross profit margin', pct(r.margin), 'Margin = (revenue − cost) ÷ revenue × 100', true], ['Gross profit', money(r.profit)], ['Markup', r.markup === null ? 'Not available' : pct(r.markup), '(Revenue − cost) ÷ cost × 100']],
        lines: [`You keep ${pct(r.margin)} of the selling price as gross profit, a ${r.markup === null ? 'not available' : pct(r.markup)} markup on cost.`],
        warning: r.profit < 0 ? 'Cost is higher than revenue, so this sale loses money.' : '',
        inputs: [['Revenue', money(revenue)], ['Cost', money(cost)]],
        outputs: [['Gross margin', pct(r.margin)], ['Gross profit', money(r.profit)], ['Markup', pct(r.markup)]]
      };
    }
  });
})();
