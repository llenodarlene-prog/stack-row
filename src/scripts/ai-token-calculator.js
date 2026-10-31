// AI token counter and cost calculator. Prices live in llm-prices.js with a
// review date; formulas in tool-formulas.js. Pasted text stays in the browser.
(function () {
  'use strict';
  const { Tokens } = window.StackRowFormulas;
  const P = window.StackRowLlmPrices;
  const T = window.StackRowTool;
  if (!Tokens || !P || !T) return;
  const $ = id => document.getElementById(id);
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const usd = v => (v < 0.01 && v > 0 ? `$${v.toFixed(5)}` : T.formatMoney(v, 'USD'));
  const text = $('tk-text');
  const fill = () => { const e = Tokens.estimate(text.value); if (text.value) $('tk-in').value = String(e.tokens); };
  text.addEventListener('input', fill);
  $('tk-file').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 5_000_000) { $('calc-status').textContent = 'File is larger than 5 MB. Paste part of it instead.'; return; }
    const reader = new FileReader();
    reader.onload = () => { text.value = String(reader.result || ''); fill(); text.dispatchEvent(new Event('input', { bubbles: true })); };
    reader.readAsText(file);
  });
  T.mount({
    icon: 'brain',
    name: 'AI Token Counter and Cost Calculator', file: 'ai-token-cost', storeKey: 'stackrow:ai-tokens:v1',
    private: ['text'],
    example: { values: { input: '2000', output: '500', requests: '10000', cached: '0' } },
    compute(c, { viz }) {
      const input = c.number('input', { required: true, whole: true, max: 10_000_000, label: 'input tokens' });
      const output = c.number('output', { required: true, whole: true, max: 1_000_000, label: 'output tokens' });
      const requests = c.number('requests', { whole: true, fallback: 1, min: 1, max: 1e9 });
      const cached = c.number('cached', { max: 100 });
      if ([input, output, requests, cached].some(Number.isNaN)) return null;
      const today = new Date().toISOString().slice(0, 10);
      const rows = P.current(today).map(m => ({ m, cost: Tokens.cost(m, input, output, cached) })).sort((a, b) => a.cost.total - b.cost.total);
      const est = Tokens.estimate(text.value);
      const table = el('table', 'calc-table');
      table.append(el('caption', '', `Cost per request and per month (${T.formatNumber(requests, 0)} requests)`));
      const thead = el('thead'); const hr = el('tr');
      for (const h of ['Model', 'Per request', 'Per month']) { const th = el('th', '', h); th.scope = 'col'; hr.append(th); }
      thead.append(hr);
      const body = el('tbody');
      for (const { m, cost } of rows) {
        const tr = el('tr'); const th = el('th', '', `${m.name} (${m.provider})`); th.scope = 'row';
        if (cost.tier !== 'standard') th.append(el('span', 'calc-hint', ' long-prompt rate'));
        tr.append(th, el('td', '', usd(cost.total)), el('td', '', usd(cost.total * requests)));
        body.append(tr);
      }
      table.append(thead, body);
      const cheapest = rows[0], priciest = rows[rows.length - 1];
      const tied = (target) => rows.filter(r => Math.abs(r.cost.total - target.cost.total) < 1e-12).map(r => r.m.name).join(', ');
      const over = rows.filter(r => r.cost.overShort).map(r => r.m.name);
      const sources = el('p', 'calc-hint', `Prices per million tokens, standard tier, reviewed ${P.REVIEWED} from each provider's pricing page. Batch and cached pricing can be lower.`);
      return {
        metrics: [
          ['Lowest monthly cost', usd(cheapest.cost.total * requests), `${tied(cheapest)}: (input × input price + output × output price) ÷ 1,000,000 × requests`, true],
          ['Highest monthly cost', usd(priciest.cost.total * requests), tied(priciest)],
          ['Tokens per request', `${T.formatNumber(input, 0)} in + ${T.formatNumber(output, 0)} out`, text.value ? `Estimated from ${T.formatNumber(est.chars, 0)} characters (about 4 characters per token)` : 'As entered']
        ],
        nodes: [viz.bars(`Monthly cost by model (${T.formatNumber(requests, 0)} requests)`, rows.map(({ m, cost }) => ({ label: m.name, value: cost.total * requests, display: usd(cost.total * requests), tone: { Anthropic: 'navy', OpenAI: 'blue', Google: 'cyan' }[m.provider] })), { highlight: 0 }), sources],
        lines: [text.value ? 'Token counts from pasted text are estimates. Each model family uses its own tokenizer, so exact counts differ, especially for code and non-English text.' : 'Enter exact token counts from your provider dashboard for the most accurate cost.'],
        warning: over.length ? `Prompts over 272K tokens are priced differently for ${over.join(', ')}. Those rows use the standard rate; check the provider's page.` : '',
        inputs: [['Input tokens per request', String(input)], ['Output tokens per request', String(output)], ['Requests per month', String(requests)], ['Cached input', `${cached}%`], ['Prices reviewed', P.REVIEWED]],
        outputs: rows.map(({ m, cost }) => [`${m.name} monthly`, usd(cost.total * requests)])
      };
    }
  });
})();
