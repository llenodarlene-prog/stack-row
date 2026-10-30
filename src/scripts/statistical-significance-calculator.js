// A/B test significance interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Significance } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Significance || !T) return;
  const pct = v => T.formatPercent(v, 2);
  T.mount({
    name: 'Statistical Significance Calculator', file: 'ab-test-significance', storeKey: 'stackrow:ab-test:v1',
    example: { values: { va: '10000', ca: '500', vb: '10000', cb: '580', confidence: '95', sides: '2' } },
    compute(c) {
      const va = c.number('va', { required: true, whole: true, min: 1, label: 'visitors for A' });
      const ca = c.number('ca', { required: true, whole: true, label: 'conversions for A' });
      const vb = c.number('vb', { required: true, whole: true, min: 1, label: 'visitors for B' });
      const cb = c.number('cb', { required: true, whole: true, label: 'conversions for B' });
      if ([va, ca, vb, cb].some(Number.isNaN)) return null;
      if (ca > va) { c.fail('ca', 'Conversions cannot exceed visitors.'); return null; }
      if (cb > vb) { c.fail('cb', 'Conversions cannot exceed visitors.'); return null; }
      const confidence = Number(c.value('confidence'));
      const sides = Number(c.value('sides'));
      const r = Significance.test({ visitorsA: va, conversionsA: ca, visitorsB: vb, conversionsB: cb, confidence, sides });
      const verdict = r.significant ? `Significant at ${confidence}% confidence` : `Not significant at ${confidence}% confidence`;
      const lines = [r.significant
        ? `B's conversion rate is ${r.diff > 0 ? 'higher' : 'lower'} than A's, and a difference this large would happen by chance less than ${100 - confidence}% of the time if there were no real difference.`
        : `The observed difference could reasonably be random noise at this sample size. Keep the test running to its planned size, or treat the result as inconclusive.`,
        `The ${confidence}% confidence interval for the difference is ${pct(r.ciLow)} to ${pct(r.ciHigh)} percentage points.${r.ciLow < 0 && r.ciHigh > 0 ? ' It includes zero.' : ''}`];
      if (sides === 1 && r.diff < 0) lines.push('A one-sided test only looks for B being better. B performed worse here.');
      return {
        metrics: [
          ['Result', verdict, `p-value ${r.p < 0.0001 ? '< 0.0001' : r.p.toFixed(4)} vs α ${(1 - confidence / 100).toFixed(2)} (${sides === 2 ? 'two-sided' : 'one-sided'})`, true],
          ['Conversion rate A', pct(r.rateA), 'Conversions ÷ visitors'],
          ['Conversion rate B', pct(r.rateB), 'Conversions ÷ visitors'],
          ['Relative uplift', r.uplift === null ? 'Not available' : `${r.uplift >= 0 ? '+' : ''}${T.formatNumber(r.uplift, 2)}%`, '(rate B − rate A) ÷ rate A'],
          ['Z-score', T.formatNumber(r.z, 3), 'Difference ÷ pooled standard error']
        ],
        lines,
        warning: r.smallCells ? 'Some groups have fewer than 5 conversions or non-conversions. The normal approximation is unreliable at this size; collect more data.' : '',
        inputs: [['Visitors A', String(va)], ['Conversions A', String(ca)], ['Visitors B', String(vb)], ['Conversions B', String(cb)], ['Confidence', `${confidence}%`], ['Test', sides === 2 ? 'Two-sided' : 'One-sided']],
        outputs: [['Rate A', pct(r.rateA)], ['Rate B', pct(r.rateB)], ['Relative uplift', r.uplift === null ? 'Not available' : `${T.formatNumber(r.uplift, 2)}%`], ['Z-score', T.formatNumber(r.z, 4)], ['p-value', r.p.toFixed(6)], ['Significant', r.significant ? 'Yes' : 'No'], ['CI low (pp)', T.formatNumber(r.ciLow, 3)], ['CI high (pp)', T.formatNumber(r.ciHigh, 3)]]
      };
    }
  });
})();
