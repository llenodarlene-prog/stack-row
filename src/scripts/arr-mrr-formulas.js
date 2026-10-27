// Pure formula functions for the ARR and MRR calculator. They take plain
// values and return results without touching the page, so the same file runs
// in the browser and in the Node test suite.
(function (root) {
  'use strict';

  const MAX_AMOUNT = 999999999999.99;
  const INTERVAL_MONTHS = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 };
  const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  // Parses a user-entered amount. Currency symbols, spaces and thousands
  // separators are ignored; anything else that is not a number is an error.
  // Returns { empty: true } for blank input, { value } or { error }.
  function parseAmount(raw, { whole = false } = {}) {
    const text = String(raw ?? '').trim();
    if (!text) return { empty: true };
    const cleaned = text.replace(/[\s,$€£]/g, '').replace(/^(?:US|CA|AU|C|A)(?=[\d.-])/i, '');
    if (!/^-?\d*\.?\d+$/.test(cleaned) && !/^-?\d+\.$/.test(cleaned)) return { error: 'Enter a number.' };
    const value = Number(cleaned);
    if (!Number.isFinite(value)) return { error: 'Enter a number.' };
    if (value < 0) return { error: 'Use zero or a positive amount.' };
    if (whole && !Number.isInteger(value)) return { error: 'Customer count must be a whole number.' };
    if (!whole && /\.\d{3,}$/.test(cleaned)) return { error: 'Use no more than two decimal places.' };
    if (value > MAX_AMOUNT) return { error: 'Use an amount no larger than 999,999,999,999.99.' };
    return { value };
  }

  function normalizePlanToMrr(customers, price, interval) {
    const months = INTERVAL_MONTHS[interval];
    if (!months) throw new Error(`Unknown billing interval: ${interval}`);
    return (customers * price) / months;
  }

  function calculateQuickConversion(amount, from) {
    if (from === 'arr') return { mrr: amount / 12, arr: amount };
    return { mrr: amount, arr: amount * 12 };
  }

  function calculatePlanRevenue(plans) {
    const rows = plans.map(plan => ({ ...plan, mrr: normalizePlanToMrr(plan.customers, plan.price, plan.interval) }));
    const totalMrr = rows.reduce((sum, row) => sum + row.mrr, 0);
    for (const row of rows) row.share = totalMrr > 0 ? (row.mrr / totalMrr) * 100 : null;
    const largest = totalMrr > 0 ? rows.reduce((best, row, index) => (row.mrr > rows[best].mrr ? index : best), 0) : null;
    return { rows, totalMrr, totalArr: totalMrr * 12, largestIndex: largest };
  }

  // Rates need a starting MRR above zero; they are null when it is zero.
  // GRR and NRR exclude new-customer MRR. Displayed GRR is capped at 100%.
  function calculateMrrMovement({ start = 0, newMrr = 0, expansion = 0, reactivation = 0, contraction = 0, churn = 0 }) {
    const netNew = newMrr + expansion + reactivation - contraction - churn;
    const ending = start + netNew;
    const hasBase = start > 0;
    const losses = contraction + churn;
    return {
      ending,
      netNew,
      endingArr: ending * 12,
      growthRate: hasBase ? (netNew / start) * 100 : null,
      grossChurnRate: hasBase ? (losses / start) * 100 : null,
      grr: hasBase ? Math.min(100, ((start - losses) / start) * 100) : null,
      nrr: hasBase ? ((start + expansion + reactivation - losses) / start) * 100 : null,
      lossesExceedStart: losses > start
    };
  }

  function formatCurrency(value, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  function formatPercentage(value, locale = 'en-US') {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'Not available';
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}%`;
  }

  root.StackRowArrMrr = { MAX_AMOUNT, INTERVAL_MONTHS, CURRENCIES, parseAmount, normalizePlanToMrr, calculateQuickConversion, calculatePlanRevenue, calculateMrrMovement, formatCurrency, formatPercentage };
})(typeof window !== 'undefined' ? window : globalThis);
