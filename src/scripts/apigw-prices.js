// Amazon API Gateway list prices, US East (N. Virginia). Source: AWS Price List
// API offer file for AmazonApiGateway (publication 2026-11-23), checked
// 2026-11-24. Data transfer out uses the first-10-TB internet rate shown in the
// AWS API Gateway pricing examples. Update every rate and the dates together.
(function (root) {
  'use strict';
  root.StackRowApiGatewayPrices = {
    region: 'US East (N. Virginia)',
    checked: '2026-11-24',
    published: '2026-11-23',
    source: 'https://aws.amazon.com/api-gateway/pricing/',
    rest: [[333e6, 3.5], [667e6, 2.8], [19e9, 2.38], [Infinity, 1.51]],
    http: [[300e6, 1.0], [Infinity, 0.9]],
    httpMeterKb: 512,
    websocketMessages: [[1e9, 1.0], [Infinity, 0.8]],
    websocketMeterKb: 32,
    websocketMinutes: 0.25,
    cache: { '0.5': 0.02, '1.6': 0.038, '6.1': 0.2, '13.5': 0.25, '28.4': 0.5, '58.2': 1.0, '118': 1.9, '237': 3.8 },
    transferPerGb: 0.09,
    freeTier: { rest: 1e6, http: 1e6, messages: 1e6, minutes: 750000 }
  };
})(typeof window !== 'undefined' ? window : globalThis);
