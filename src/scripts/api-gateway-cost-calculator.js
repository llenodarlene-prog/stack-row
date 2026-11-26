// API Gateway cost calculator interface. Formulas live in tool-formulas.js and
// dated AWS rates in apigw-prices.js.
(function () {
  'use strict';
  const { ApiGateway } = window.StackRowFormulas;
  const P = window.StackRowApiGatewayPrices;
  const T = window.StackRowTool;
  if (!ApiGateway || !P || !T) return;
  const usd = v => `$${T.formatNumber(v, Math.abs(v) < 1000 ? 2 : 0)}`;
  const big = v => T.formatNumber(v, 0);
  T.mount({
    icon: 'api',
    name: 'API Gateway Cost Calculator', file: 'api-gateway-cost', storeKey: 'stackrow:apigw:v1',
    modeNames: { rest: 'REST API', http: 'HTTP API', websocket: 'WebSocket API' },
    example: { mode: 'rest', values: { requests: '5000000', transfer: '14.3', cache: '', hours: '730' } },
    compute(c, { viz }) {
      const requests = c.number('requests', { required: true, label: 'monthly requests', max: 1e13 });
      const transferGb = c.number('transfer', { max: 1e7 });
      const freeTier = c.value('free') === 'yes';
      let sizeKb = 0, minutes = 0, cacheGb = '', cacheHours = 730;
      if (c.mode === 'http') sizeKb = c.number('hsize', { max: 10240 });
      if (c.mode === 'websocket') { sizeKb = c.number('wsize', { max: 128 }); minutes = c.number('minutes', { max: 1e13 }); }
      if (c.mode === 'rest') { cacheGb = c.value('cache'); cacheHours = c.number('hours', { fallback: 730, max: 744 }); }
      if ([requests, transferGb, sizeKb, minutes, cacheHours].some(Number.isNaN)) return null;
      const r = ApiGateway.estimate(P, { type: c.mode, requests, sizeKb, minutes, cacheGb, cacheHours, transferGb, freeTier });
      const parts = [['Requests or messages', r.request, 'blue'], ['Connection minutes', r.connection, 'cyan'], ['Cache', r.cache, 'navy'], ['Data transfer', r.transfer, 'muted']].filter(p => p[1] > 0);
      const metrics = [['Monthly estimate', usd(r.total), 'Requests + cache + connections + transfer', true], ['Annual estimate', usd(r.annual)], ['Cost per million requests', r.perMillion === null ? 'Not available' : usd(r.perMillion)], ['Metered units', big(r.metered), c.mode === 'rest' ? 'REST calls are not metered by size' : `Billed in ${c.mode === 'http' ? '512' : '32'} KB steps`]];
      const lines = [`At ${big(requests)} ${c.mode === 'websocket' ? 'messages' : 'requests'} a month, the ${this.modeNames[c.mode]} costs about ${usd(r.total)} a month in ${P.region}.`];
      if (c.mode !== 'websocket') {
        const other = ApiGateway.estimate(P, { type: c.mode === 'rest' ? 'http' : 'rest', requests, sizeKb, transferGb, freeTier });
        lines.push(c.mode === 'rest' ? `The same traffic on an HTTP API would cost about ${usd(other.total)}, without REST-only features such as caching, usage plans and request validation.` : `The same traffic on a REST API would cost about ${usd(other.total)} before any cache.`);
      }
      lines.push(`Rates from the AWS price list, checked ${P.checked}. Lambda, logs, WAF and private endpoints are billed separately.`);
      return {
        nodes: parts.length ? [viz.stack('Monthly cost breakdown', parts.map(([label, value, tone]) => ({ label, value, display: usd(value), tone })))] : [],
        metrics, lines,
        warning: c.mode === 'websocket' && sizeKb > 128 ? 'WebSocket messages can be at most 128 KB.' : '',
        inputs: [['API type', this.modeNames[c.mode]], ['Requests or messages', big(requests)], ['Data transfer (GB)', T.formatNumber(transferGb, 1)], ['Free tier', freeTier ? 'Applied' : 'Not applied']],
        outputs: [['Monthly estimate (USD)', usd(r.total)], ['Requests or messages', usd(r.request)], ['Connections', usd(r.connection)], ['Cache', usd(r.cache)], ['Data transfer', usd(r.transfer)], ['Annual estimate', usd(r.annual)]]
      };
    }
  });
})();
