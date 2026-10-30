// CPM calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Cpm } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Cpm || !T) return;
  const $ = id => document.getElementById(id);
  const toggle = mode => { $('cpm-cost-field').hidden = mode === 'cost'; $('cpm-impr-field').hidden = mode === 'impressions'; $('cpm-rate-field').hidden = mode === 'cpm'; };
  const current = () => document.querySelector('.calc-tabs [aria-selected="true"]').dataset.mode;
  T.mount({
    name: 'CPM Calculator', file: 'cpm-calculation', storeKey: 'stackrow:cpm:v1',
    modeNames: { cpm: 'CPM', cost: 'Total Cost', impressions: 'Impressions' },
    example: { mode: 'cpm', values: { cost: '2500', impressions: '400000', clicks: '3200', conversions: '96' } },
    onMode: toggle, onRestore() { toggle(current()); }, onReset() { toggle('cpm'); },
    compute(c, { money }) {
      const need = k => c.mode !== { cost: 'cost', impressions: 'impressions', cpm: 'cpm' }[k];
      const cost = need('cost') ? c.number('cost', { required: true, label: 'a campaign cost' }) : null;
      const impressions = need('impressions') ? c.number('impressions', { required: true, whole: true, label: 'impressions' }) : null;
      const cpm = need('cpm') ? c.number('cpm', { required: true, label: 'a CPM' }) : null;
      const clicks = c.number('clicks', { whole: true });
      const conversions = c.number('conversions', { whole: true });
      if ([cost, impressions, cpm, clicks, conversions].some(Number.isNaN)) return null;
      let fCost = cost, fImpr = impressions, fCpm = cpm, primary;
      if (c.mode === 'cpm') {
        if (!impressions) { c.fail('impressions', 'Use more than zero impressions.'); return null; }
        fCpm = Cpm.cpm(cost, impressions);
        primary = ['CPM', money(fCpm), 'CPM = cost ÷ impressions × 1,000', true];
      } else if (c.mode === 'cost') {
        fCost = Cpm.cost(cpm, impressions);
        primary = ['Total cost', money(fCost), 'Cost = CPM × impressions ÷ 1,000', true];
      } else {
        if (!cpm) { c.fail('cpm', 'Use a CPM above zero.'); return null; }
        fImpr = Cpm.impressions(cost, cpm);
        primary = ['Impressions', T.formatNumber(fImpr, 0), 'Impressions = cost ÷ CPM × 1,000', true];
      }
      if (clicks > fImpr) { c.fail('clicks', 'Clicks cannot exceed impressions.'); return null; }
      const x = Cpm.extras(fCost, fImpr, clicks, conversions);
      const metrics = [primary, ['Cost per impression', `${money(0).replace(/[0-9.,]+/, '')}${(fCost / fImpr).toFixed(5)}`, 'Cost ÷ impressions']];
      if (x.ctr !== null) metrics.push(['Click-through rate', T.formatPercent(x.ctr), 'Clicks ÷ impressions × 100'], ['Effective cost per click', money(x.cpc), 'Cost ÷ clicks']);
      if (x.cpa !== null) metrics.push(['Cost per acquisition', money(x.cpa), 'Cost ÷ conversions']);
      if (x.conversionRate !== null) metrics.push(['Conversion rate', T.formatPercent(x.conversionRate), 'Conversions ÷ clicks × 100']);
      return {
        metrics,
        lines: [`At a ${money(fCpm)} CPM, every ${money(fCpm)} buys 1,000 impressions. ${x.cpc !== null ? `With ${T.formatPercent(x.ctr)} click-through, that works out to ${money(x.cpc)} per click.` : 'Add clicks to compare this with cost-per-click pricing.'}`],
        inputs: [['Cost', money(fCost)], ['Impressions', T.formatNumber(fImpr, 0)], ['CPM', money(fCpm)], ['Clicks', clicks ? String(clicks) : 'Not entered'], ['Conversions', conversions ? String(conversions) : 'Not entered']],
        outputs: [['CPM', money(fCpm)], ['Total cost', money(fCost)], ['Impressions', T.formatNumber(fImpr, 0)], ['CTR', T.formatPercent(x.ctr)], ['Effective CPC', x.cpc === null ? 'Not available' : money(x.cpc)], ['CPA', x.cpa === null ? 'Not available' : money(x.cpa)]]
      };
    }
  });
})();
