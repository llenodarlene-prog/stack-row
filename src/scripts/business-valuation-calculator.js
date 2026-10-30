// Business valuation interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Valuation } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Valuation || !T) return;
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  T.mount({
    name: 'Business Valuation Calculator', file: 'business-valuation', storeKey: 'stackrow:valuation:v1',
    modeNames: { revenue: 'Revenue Multiple', earnings: 'Earnings Multiple', dcf: 'Discounted Cash Flow' },
    example: { mode: 'earnings', values: { basis: 'sde', earnings: '400000', elow: '2.5', ehigh: '3.5' } },
    compute(c, { money }) {
      if (c.mode === 'dcf') {
        const cf = c.number('cashflow', { required: true, label: 'free cash flow' });
        const g = c.number('growth', { required: true, negative: true, min: -50, max: 100, label: 'a growth rate' });
        const r = c.number('discount', { required: true, min: 0.1, max: 100, label: 'a discount rate' });
        const years = c.number('years', { whole: true, fallback: 5, min: 1, max: 20 });
        const tg = c.number('terminal', { required: true, negative: true, min: -5, max: 10, label: 'a terminal growth rate' });
        if ([cf, g, r, years, tg].some(Number.isNaN)) return null;
        const d = Valuation.dcf({ cashFlow: cf, growth: g, discount: r, years, terminalGrowth: tg });
        if (d.error) { c.fail('terminal', d.error); return null; }
        const table = el('table', 'calc-table');
        table.append(el('caption', '', 'Projected cash flows'));
        const head = el('tr'); for (const h of ['Year', 'Cash flow', 'Present value']) { const th = el('th', '', h); th.scope = 'col'; head.append(th); }
        const body = el('tbody');
        for (const row of d.rows) { const tr = el('tr'); const th = el('th', '', String(row.year)); th.scope = 'row'; tr.append(th, el('td', '', money(row.cashFlow)), el('td', '', money(row.presentValue))); body.append(tr); }
        const thead = el('thead'); thead.append(head); table.append(thead, body);
        return {
          metrics: [['Estimated value (DCF)', money(d.total), 'Present value of forecast cash flows + present value of terminal value', true], ['Forecast cash flows (present value)', money(d.pv), `${years} years discounted at ${r}%`], ['Terminal value (present value)', money(d.terminalPv), `Final cash flow × (1 + ${tg}%) ÷ (${r}% − ${tg}%), discounted`]],
          nodes: [table],
          lines: [`The terminal value makes up ${T.formatNumber(d.terminalShare, 0)}% of the total, so the result is very sensitive to the discount rate and terminal growth you choose.`],
          warning: d.terminalShare > 75 ? 'More than three quarters of the value comes from the terminal value. Small changes in assumptions will move the result a lot.' : '',
          inputs: [['Free cash flow', money(cf)], ['Growth', `${g}%`], ['Discount rate', `${r}%`], ['Years', String(years)], ['Terminal growth', `${tg}%`]],
          outputs: [['DCF value', money(d.total)], ['PV of forecast', money(d.pv)], ['PV of terminal value', money(d.terminalPv)], ['Terminal share', `${T.formatNumber(d.terminalShare, 1)}%`]]
        };
      }
      const rev = c.mode === 'revenue';
      const base = c.number(rev ? 'revenue' : 'earnings', { required: true, label: rev ? 'annual revenue' : 'annual earnings' });
      const low = c.number(rev ? 'rlow' : 'elow', { required: true, label: 'a low multiple' });
      const high = c.number(rev ? 'rhigh' : 'ehigh', { required: true, label: 'a high multiple' });
      if ([base, low, high].some(Number.isNaN)) return null;
      if (high < low) { c.fail(rev ? 'rhigh' : 'ehigh', 'Use a high multiple at or above the low multiple.'); return null; }
      const v = Valuation.multiple(base, low, high);
      const label = rev ? 'revenue' : c.value('basis') === 'sde' ? 'SDE' : 'EBITDA';
      return {
        metrics: [['Estimated value range', `${money(v.low)} to ${money(v.high)}`, `${label} × ${low} to ${label} × ${high}`, true], ['Midpoint', money((v.low + v.high) / 2), 'Average of the low and high values']],
        lines: [rev ? 'Revenue multiples ignore profitability, so two companies with equal revenue can deserve very different values.' : `${label === 'SDE' ? 'SDE (seller’s discretionary earnings) is typical for owner-run small businesses.' : 'EBITDA multiples are typical for larger companies with professional management.'} The multiple you choose drives the result.`],
        inputs: [[rev ? 'Annual revenue' : `Annual ${label}`, money(base)], ['Low multiple', String(low)], ['High multiple', String(high)]],
        outputs: [['Low value', money(v.low)], ['High value', money(v.high)], ['Midpoint', money((v.low + v.high) / 2)]]
      };
    }
  });
})();
