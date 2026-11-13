// Burn rate and runway calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Runway } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Runway || !T) return;
  const months = v => `${T.formatNumber(v, 1)} months`;
  T.mount({
    icon: 'flame',
    name: 'Burn Rate and Runway Calculator', file: 'runway-calculation', storeKey: 'stackrow:runway:v1',
    example: { values: { cash: '900000', expenses: '85000', revenue: '25000', revgrowth: '5', expgrowth: '1' } },
    compute(c, { money, viz }) {
      const cash = c.number('cash', { required: true, label: 'your cash balance' });
      const expenses = c.number('expenses', { required: true, label: 'monthly expenses' });
      const revenue = c.number('revenue');
      const revgrowth = c.number('revgrowth', { negative: true, min: -50, max: 100 });
      const expgrowth = c.number('expgrowth', { negative: true, min: -50, max: 100 });
      if ([cash, expenses, revenue, revgrowth, expgrowth].some(Number.isNaN)) return null;
      const r = Runway.simulate({ cash, revenue, expenses, revenueGrowth: revgrowth, expenseGrowth: expgrowth });
      const zero = r.runway === null ? null : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + Math.floor(r.runway), 1));
      const dateText = zero ? zero.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
      const sample = r.months.filter((row, i) => i % Math.max(1, Math.ceil(r.months.length / 8)) === 0).slice(0, 8);
      return {
        nodes: r.months.length ? [viz.bars('Projected cash balance', sample.map(row => ({ label: `Month ${row.month}`, value: Math.max(row.balance, 0), display: money(row.balance), tone: row.balance < cash * 0.25 ? 'red' : 'blue' })))] : [],
        metrics: [['Runway', r.runway === null ? 'Cash-flow positive within 10 years' : months(r.runway), 'Cash ÷ net burn, adjusted for growth', true], ['Net burn this month', money(r.netBurn), 'Expenses − revenue'], ['Gross burn this month', money(r.grossBurn)], ['Cash runs out', r.runway === null ? 'Not projected' : `Around ${dateText}`]],
        lines: [r.netBurn <= 0 && !revgrowth && !expgrowth ? 'Revenue covers expenses, so cash is not falling.' : r.runway === null ? 'With these growth rates, revenue overtakes expenses before cash runs out.' : `At this pace, ${money(cash)} lasts about ${months(r.runway)}.`, 'Many founders start raising money with 9 to 12 months of runway left, because rounds take months to close.'],
        warning: r.runway !== null && r.runway < 6 ? 'Less than six months of runway leaves little time to raise money or cut costs.' : '',
        inputs: [['Cash', money(cash)], ['Monthly expenses', money(expenses)], ['Monthly revenue', money(revenue)], ['Revenue growth', T.formatPercent(revgrowth)], ['Expense growth', T.formatPercent(expgrowth)]],
        outputs: [['Net burn', money(r.netBurn)], ['Gross burn', money(r.grossBurn)], ['Runway', r.runway === null ? 'Not projected' : months(r.runway)]]
      };
    }
  });
})();
