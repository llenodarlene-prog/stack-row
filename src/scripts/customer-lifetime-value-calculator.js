// Customer Lifetime Value Calculator interface. Models live in
// business-tool-formulas.js. Inputs are non-sensitive numbers, so they save
// in this browser like the other calculators and can be shared.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const C = window.StackRowBusinessTools?.Clv;
  if (!T || !C) return;
  const NUM = /^-?[\d,]{0,15}(\.\d{0,6})?$/;
  const numeric = ['sub_arpa', 'sub_margin', 'sub_churn', 'sub_horizon', 's_revenue', 's_orders', 's_customers', 's_margin', 's_lifespan', 'd_arpa', 'd_margin', 'd_churn', 'd_discount', 'd_horizon', 'h_revenue', 'h_costs', 'h_customers', 'cac', 'spread'];
  const restore = Object.fromEntries(numeric.map(n => [n, { pattern: NUM, maxLength: 24 }]));
  Object.assign(restore, { sub_arpa_unit: /^(month|year)$/, sub_churn_unit: /^(month|year)$/, s_period: /^(1|3|6|12)$/, currency: /^(USD|EUR|GBP|CAD|AUD)$/ });
  const pct = v => `${T.formatNumber(v, 2)}%`;
  const n2 = v => T.formatNumber(v, 2);

  T.mount({
    icon: 'heart-handshake', name: 'Customer Lifetime Value Calculator', file: 'clv', storeKey: 'stackrow:clv:v1',
    modeNames: { subscription: 'Subscription LTV', simple: 'Repeat purchase CLV', discounted: 'Discounted CLV', historical: 'Historical CLV' },
    share: { mode: 'allowlist', fields: [...numeric, 'sub_arpa_unit', 'sub_churn_unit', 's_period', 'currency'] },
    restore,
    example: { mode: 'subscription', values: { sub_arpa: '100', sub_arpa_unit: 'month', sub_margin: '80', sub_churn: '2', sub_churn_unit: 'month', cac: '1200', spread: '20' } },
    compute(c, { money, viz }) {
      const cac = c.number('cac', { label: 'acquisition cost' });
      const spread = c.number('spread', { label: 'a scenario range', fallback: 20, max: 90 });
      const s = spread / 100;
      if (c.mode === 'historical') {
        const revenue = c.number('h_revenue', { required: true, label: 'revenue to date' });
        const costs = c.number('h_costs', { label: 'direct costs' });
        const customers = c.number('h_customers', { required: true, label: 'the number of customers', whole: true, min: 1 });
        if ([revenue, costs, customers, cac, spread].some(Number.isNaN)) return null;
        const r = C.historicalClv({ revenue, costs, customers });
        if (!r.ok) { c.fail(r.field, r.message); return null; }
        const ue = C.unitEconomics(r.perCustomer, cac, 0);
        return {
          metrics: [['Historical CLV per customer', money(r.perCustomer), `(${money(revenue)} − ${money(costs)}) ÷ ${n2(customers)}`, true], ['Revenue per customer', money(r.revenuePerCustomer)], ['Total contribution', money(r.contribution)], ...(ue ? [['Contribution to CAC', `${n2(ue.ratio)} : 1`, `${money(r.perCustomer)} ÷ ${money(cac)}`]] : [])],
          lines: ['This is what customers have contributed so far, after direct costs. It does not predict future value.'],
          warning: r.perCustomer < 0 ? 'Direct costs are higher than revenue, so these customers have lost money so far.' : '',
          inputs: [['Model', 'Historical contribution'], ['Revenue to date', money(revenue)], ['Direct costs to date', money(costs)], ['Customers', n2(customers)], ['CAC', cac ? money(cac) : 'Not entered']],
          outputs: [['Historical CLV per customer', money(r.perCustomer)], ['Revenue per customer', money(r.revenuePerCustomer)], ...(ue ? [['Contribution to CAC', `${n2(ue.ratio)}:1`]] : [])]
        };
      }
      if (c.mode === 'simple') {
        const revenue = c.number('s_revenue', { required: true, label: 'revenue' });
        const orders = c.number('s_orders', { required: true, label: 'the number of orders', min: 1 });
        const customers = c.number('s_customers', { required: true, label: 'the number of customers', min: 1 });
        const margin = c.number('s_margin', { required: true, label: 'gross margin', max: 100 });
        const life = c.number('s_lifespan', { required: true, label: 'a lifespan in years', max: 100 });
        if ([revenue, orders, customers, margin, life, cac, spread].some(Number.isNaN)) return null;
        const period = Number(c.value('s_period'));
        const run = (m, l) => C.simpleClv({ revenue, orders, customers, periodMonths: period, marginPct: m, lifespanYears: l });
        const r = run(margin, life);
        if (!r.ok) { c.fail(r.field, r.message); return null; }
        const low = run(Math.max(0, margin * (1 - s)), life * (1 - s)); const high = run(Math.min(100, margin * (1 + s)), life * (1 + s));
        const ue = C.unitEconomics(r.clv, cac, r.monthlyContribution);
        return {
          metrics: [['Customer lifetime value', money(r.clv), `${money(r.annualContribution)} a year × ${n2(life)} years`, true], ['Average order value', money(r.aov), `${money(revenue)} ÷ ${n2(orders)} orders`], ['Purchases per customer per year', n2(r.annualFrequency), `${n2(r.frequency)} in ${period} month${period === 1 ? '' : 's'} × ${12 / period}`], ['Annual profit per customer', money(r.annualContribution), `${money(r.aov)} × ${n2(r.annualFrequency)} × ${pct(margin)}`], ...(ue ? [['LTV to CAC', `${n2(ue.ratio)} : 1`], ['CAC payback', `${n2(ue.paybackMonths)} months`, `${money(cac)} ÷ ${money(r.monthlyContribution)} a month`]] : [])],
          nodes: [viz.range('Scenario range', { low: low.clv, high: high.clv, max: Math.max(high.clv, 1), lowDisplay: `Conservative ${money(low.clv)}`, highDisplay: `Optimistic ${money(high.clv)}` })],
          lines: [`Conservative and optimistic cases move margin and lifespan ${pct(spread)} down and up together.`],
          inputs: [['Model', 'Repeat purchase'], ['Revenue', money(revenue)], ['Orders', n2(orders)], ['Customers', n2(customers)], ['Period', `${period} months`], ['Gross margin', pct(margin)], ['Lifespan', `${n2(life)} years`], ['CAC', cac ? money(cac) : 'Not entered'], ['Scenario range', `±${pct(spread)}`]],
          outputs: [['CLV (base)', money(r.clv)], ['CLV (conservative)', money(low.clv)], ['CLV (optimistic)', money(high.clv)], ['Average order value', money(r.aov)], ['Annual frequency', n2(r.annualFrequency)], ['Annual contribution', money(r.annualContribution)], ...(ue ? [['LTV:CAC', `${n2(ue.ratio)}:1`], ['Payback months', n2(ue.paybackMonths)]] : [])]
        };
      }
      if (c.mode === 'discounted') {
        const arpa = c.number('d_arpa', { required: true, label: 'monthly revenue' });
        const margin = c.number('d_margin', { required: true, label: 'gross margin', max: 100 });
        const churn = c.number('d_churn', { required: true, label: 'monthly churn' });
        const rate = c.number('d_discount', { required: true, label: 'a discount rate' });
        const horizon = c.number('d_horizon', { required: true, label: 'a horizon in months', whole: true, min: 1, max: 600 });
        if ([arpa, margin, churn, rate, horizon, cac, spread].some(Number.isNaN)) return null;
        const run = (m, ch) => C.discountedClv({ arpaMonthly: arpa, marginPct: m, churnMonthlyPct: ch, annualDiscountPct: rate, horizonMonths: horizon });
        const r = run(margin, churn);
        if (!r.ok) { c.fail(r.field, r.message); return null; }
        const low = run(Math.max(0, margin * (1 - s)), Math.min(99.99, churn * (1 + s))); const high = run(Math.min(100, margin * (1 + s)), churn * (1 - s));
        const ue = C.unitEconomics(r.ltv, cac, r.monthlyContribution);
        const yearly = r.periods.filter(p => p.month % 12 === 0 || p.month === horizon);
        const shown = yearly.length > 12 ? yearly.filter((_, i) => i % Math.ceil(yearly.length / 12) === 0 || i === yearly.length - 1) : yearly;
        return {
          metrics: [['Discounted lifetime value', money(r.ltv), `Sum over ${horizon} months of contribution × retention^(t−1) ÷ (1 + ${n2(r.monthlyDiscountPct)}%)^t`, true], ['Monthly contribution', money(r.monthlyContribution), `${money(arpa)} × ${pct(margin)}`], ['Still active at the end', pct(r.periods[r.periods.length - 1].retained * 100)], ...(ue ? [['LTV to CAC', `${n2(ue.ratio)} : 1`], ['CAC payback (undiscounted)', `${n2(ue.paybackMonths)} months`, `${money(cac)} ÷ ${money(r.monthlyContribution)}`]] : [])],
          nodes: [viz.bars('Cumulative expected contribution', shown.map(p => ({ label: `Month ${p.month}`, value: p.cumulative, display: money(p.cumulative), tone: 'blue' }))), viz.range('Scenario range', { low: low.ltv, high: high.ltv, max: Math.max(high.ltv, 1), lowDisplay: `Conservative ${money(low.ltv)}`, highDisplay: `Optimistic ${money(high.ltv)}` })],
          lines: [`Conservative raises churn and lowers margin by ${pct(spread)}; optimistic does the opposite.`],
          inputs: [['Model', 'Discounted finite horizon'], ['Monthly revenue', money(arpa)], ['Gross margin', pct(margin)], ['Monthly churn', pct(churn)], ['Annual discount rate', pct(rate)], ['Horizon', `${horizon} months`], ['CAC', cac ? money(cac) : 'Not entered'], ['Scenario range', `±${pct(spread)}`]],
          outputs: [['LTV (base)', money(r.ltv)], ['LTV (conservative)', money(low.ltv)], ['LTV (optimistic)', money(high.ltv)], ...shown.map(p => [`Cumulative at month ${p.month}`, money(p.cumulative)]), ...(ue ? [['LTV:CAC', `${n2(ue.ratio)}:1`], ['Payback months', n2(ue.paybackMonths)]] : [])]
        };
      }
      const arpaRaw = c.number('sub_arpa', { required: true, label: 'revenue per account' });
      const margin = c.number('sub_margin', { required: true, label: 'gross margin', max: 100 });
      const churnRaw = c.number('sub_churn', { required: true, label: 'a churn rate' });
      const horizon = c.number('sub_horizon', { label: 'a horizon', whole: true, max: 600 });
      if ([arpaRaw, margin, churnRaw, horizon, cac, spread].some(Number.isNaN)) return null;
      const arpa = c.value('sub_arpa_unit') === 'year' ? arpaRaw / 12 : arpaRaw;
      if (churnRaw >= 100) { c.fail('sub_churn', 'Churn of 100% or more means every customer leaves in the first period. Use a lower rate.'); return null; }
      const churn = c.value('sub_churn_unit') === 'year' ? C.monthlyFromAnnualChurn(churnRaw) : churnRaw;
      const run = (m, ch) => C.subscriptionClv({ arpaMonthly: arpa, marginPct: m, churnMonthlyPct: ch, horizonMonths: horizon });
      const r = run(margin, churn);
      if (!r.ok) { c.fail(r.field, r.message); return null; }
      const low = run(Math.max(0, margin * (1 - s)), churn * (1 + s)); const high = run(Math.min(100, margin * (1 + s)), churn * (1 - s));
      const ue = C.unitEconomics(r.ltv, cac, r.monthlyContribution);
      return {
        metrics: [['Customer lifetime value', money(r.ltv), r.horizonUsed ? `${money(r.monthlyContribution)} × ${horizon} months (zero churn, finite horizon)` : `${money(r.monthlyContribution)} ÷ ${pct(churn)} monthly churn`, true], ['Monthly contribution', money(r.monthlyContribution), `${money(arpa)} × ${pct(margin)}`], ['Average lifetime', `${n2(r.lifetimeMonths)} months`, r.horizonUsed ? 'Horizon you entered' : `1 ÷ ${pct(churn)}`], ...(ue ? [['LTV to CAC', `${n2(ue.ratio)} : 1`, `${money(r.ltv)} ÷ ${money(cac)}`], ['CAC payback', `${n2(ue.paybackMonths)} months`, `${money(cac)} ÷ ${money(r.monthlyContribution)}`]] : [])],
        nodes: [viz.range('Scenario range', { low: low.ok ? low.ltv : 0, high: high.ok ? high.ltv : 0, max: Math.max(high.ok ? high.ltv : 1, 1), lowDisplay: `Conservative ${low.ok ? money(low.ltv) : 'n/a'}`, highDisplay: `Optimistic ${high.ok ? money(high.ltv) : 'n/a'}` })],
        lines: [c.value('sub_churn_unit') === 'year' ? `${pct(churnRaw)} annual churn equals ${pct(churn)} a month, assuming a steady rate.` : '', 'This simple formula assumes churn and revenue stay constant. Real cohorts usually churn faster at first.'].filter(Boolean),
        warning: !high.ok && churn * (1 - s) <= 0 ? 'The optimistic case reaches zero churn, which needs a horizon. Enter one to see it.' : '',
        inputs: [['Model', 'Subscription'], ['Revenue per account (monthly)', money(arpa)], ['Gross margin', pct(margin)], ['Monthly churn', pct(churn)], ['Horizon', horizon ? `${horizon} months` : 'Not used'], ['CAC', cac ? money(cac) : 'Not entered'], ['Scenario range', `±${pct(spread)}`]],
        outputs: [['LTV (base)', money(r.ltv)], ['LTV (conservative)', low.ok ? money(low.ltv) : 'n/a'], ['LTV (optimistic)', high.ok ? money(high.ltv) : 'n/a'], ['Monthly contribution', money(r.monthlyContribution)], ['Lifetime months', n2(r.lifetimeMonths)], ...(ue ? [['LTV:CAC', `${n2(ue.ratio)}:1`], ['Payback months', n2(ue.paybackMonths)]] : [])]
      };
    }
  });
})();
