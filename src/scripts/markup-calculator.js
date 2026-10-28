// Markup calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Markup } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Markup || !T) return;
  const pct = T.formatPercent;
  const toggle = mode => { for (const id of ['markup-cost-group', 'markup-options']) document.getElementById(id).hidden = mode === 'convert'; };
  T.mount({
    name: 'Markup Calculator',
    file: 'markup-calculation',
    storeKey: 'stackrow:markup:v1',
    modeNames: { markup: 'Price From Markup', price: 'Markup From Price', margin: 'Price From Margin', convert: 'Markup and Margin' },
    example: { mode: 'markup', values: { cost: '40', markup: '50', qty: '100', discount: '10', tax: '8' } },
    onMode: toggle,
    onRestore() { toggle(document.querySelector('.calc-tabs [aria-selected="true"]').dataset.mode); },
    onReset() { toggle('markup'); },
    compute(c, { money }) {
      if (c.mode === 'convert') {
        const from = c.value('from');
        const percent = c.number('percent', { required: true, label: 'a percentage', max: from === 'margin' ? 99.99 : undefined });
        if (Number.isNaN(percent)) return null;
        const result = from === 'markup' ? Markup.markupToMargin(percent) : Markup.marginToMarkup(percent);
        const label = from === 'markup' ? 'Gross margin' : 'Markup';
        return {
          metrics: [[label, pct(result), from === 'markup' ? 'Margin = markup ÷ (100 + markup) × 100' : 'Markup = margin ÷ (100 - margin) × 100', true]],
          lines: [from === 'markup' ? `A ${pct(percent)} markup on cost leaves ${pct(result)} of the selling price as gross profit.` : `A ${pct(percent)} gross margin requires a ${pct(result)} markup on cost.`],
          inputs: [[from === 'markup' ? 'Markup' : 'Margin', pct(percent)]],
          outputs: [[label, pct(result)]]
        };
      }
      const cost = c.number('cost', { required: true, label: 'a cost' });
      const markup = c.mode === 'markup' ? c.number('markup', { required: true, label: 'a markup percentage' }) : 0;
      const price = c.mode === 'price' ? c.number('price', { required: true, label: 'a selling price' }) : 0;
      const margin = c.mode === 'margin' ? c.number('margin', { required: true, label: 'a margin percentage', max: 99.99 }) : 0;
      const qty = c.number('qty', { whole: true, fallback: 1, min: 1 });
      const discount = c.number('discount', { max: 100 });
      const tax = c.number('tax', { max: 100 });
      if ([cost, markup, price, margin, qty, discount, tax].some(Number.isNaN)) return null;
      const r = Markup.calculate({ mode: c.mode, cost, markup, price, margin, quantity: qty, discount, tax });
      const metrics = [
        c.mode === 'price' ? ['Markup', pct(r.markup), 'Markup = (price - cost) ÷ cost × 100', true] : ['Selling price', money(r.price), c.mode === 'markup' ? 'Price = cost × (1 + markup ÷ 100)' : 'Price = cost ÷ (1 - margin ÷ 100)', true],
        ['Gross profit per item', money(r.profit), 'Profit = price - cost'],
        c.mode === 'price' ? ['Gross margin', pct(r.margin), 'Margin = profit ÷ price × 100'] : c.mode === 'markup' ? ['Gross margin', pct(r.margin), 'Margin = profit ÷ price × 100'] : ['Markup', pct(r.markup), 'Markup = profit ÷ cost × 100']
      ];
      if (discount) metrics.push(['Price after discount', money(r.discounted), 'Price × (1 - discount ÷ 100)'], ['Profit after discount', money(r.discountedProfit), `Margin after discount: ${pct(r.discountedMargin)}`]);
      if (tax) metrics.push(['Customer pays (with tax)', money(r.customerPrice), `Includes ${money(r.taxAmount)} sales tax, which is not profit`]);
      if (qty > 1) metrics.push(['Total gross profit', money(r.totalProfit), `${qty} items: revenue ${money(r.totalRevenue)} - cost ${money(r.totalCost)}`]);
      const lines = [];
      if (r.profit < 0) lines.push('The selling price is below cost, so each sale loses money.');
      else if (r.markup !== null && r.margin !== null) lines.push(`Markup is measured against cost and margin against price, so a ${pct(r.markup)} markup equals a ${pct(r.margin)} margin.`);
      if (cost === 0) lines.push('Markup is not available when cost is zero.');
      const inputs = [['Cost per item', money(cost)]];
      if (c.mode === 'markup') inputs.push(['Markup', pct(markup)]);
      if (c.mode === 'price') inputs.push(['Selling price', money(price)]);
      if (c.mode === 'margin') inputs.push(['Target margin', pct(margin)]);
      inputs.push(['Quantity', String(qty)], ['Discount', pct(discount)], ['Sales tax', pct(tax)]);
      return {
        metrics, lines, inputs,
        warning: r.discountedProfit < 0 && r.profit >= 0 ? 'The discount pushes the price below cost.' : '',
        outputs: [['Selling price', money(r.price)], ['Gross profit per item', money(r.profit)], ['Markup', pct(r.markup)], ['Gross margin', pct(r.margin)], ['Price after discount', money(r.discounted)], ['Customer price with tax', money(r.customerPrice)], ['Total gross profit', money(r.totalProfit)]]
      };
    }
  });
})();
