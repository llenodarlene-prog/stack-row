// Pure logic for Stack Row business utilities: the invoice generator and the
// customer lifetime value calculator. No DOM access. Money uses BigInt fixed
// point, so 0.1 × 0.2 is exactly 0.02 and totals always reconcile.
(function (root) {
  'use strict';
  const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });

  // ------------------------------------------------------------ Decimal math
  // Values are BigInt at 8 decimal places. Rounding is half away from zero.
  const SCALE = 100000000n;
  const DEC = 8;
  function parseDecimal(raw, { maxDecimals = 4, allowNegative = false, max = 1000000000000 } = {}) {
    const text = String(raw ?? '').trim().replace(/,/g, '');
    if (!text) return { ok: true, value: 0n, empty: true };
    const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(text);
    if (!m) return fail('number', 'Enter a number using digits and an optional decimal point.');
    if (m[1] && !allowNegative) return fail('negative', 'Use zero or a positive number.');
    if ((m[3] || '').length > maxDecimals) return fail('decimals', `Use at most ${maxDecimals} decimal place${maxDecimals === 1 ? '' : 's'}.`);
    if (Number(m[2]) > max) return fail('range', 'This number is too large.');
    const value = BigInt(m[2]) * SCALE + BigInt((m[3] || '').padEnd(DEC, '0'));
    return { ok: true, value: m[1] ? -value : value };
  }
  // Integer division rounded half away from zero.
  function divHalf(n, d) {
    const q = n / d; const r = n % d;
    const neg = (n < 0n) !== (d < 0n);
    return 2n * (r < 0n ? -r : r) >= (d < 0n ? -d : d) ? q + (neg ? -1n : 1n) : q;
  }
  const mul = (a, b) => divHalf(a * b, SCALE);            // exact for inputs with up to 4 decimals
  const pctOf = (a, pct) => divHalf(a * pct, SCALE * 100n); // a × pct%
  function roundTo(value, digits) { const step = 10n ** BigInt(DEC - digits); return divHalf(value, step) * step; }
  function formatDecimal(value, digits) {
    const neg = value < 0n; const abs = neg ? -value : value;
    const units = abs / SCALE; const frac = String(abs % SCALE).padStart(DEC, '0').slice(0, digits);
    return `${neg ? '-' : ''}${units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${digits ? `.${frac}` : ''}`;
  }

  // Currencies with their common minor units. Rounding uses these digits.
  const CURRENCIES = {
    USD: { digits: 2, symbol: '$' }, EUR: { digits: 2, symbol: '€' }, GBP: { digits: 2, symbol: '£' }, CAD: { digits: 2, symbol: 'CA$' },
    AUD: { digits: 2, symbol: 'A$' }, NZD: { digits: 2, symbol: 'NZ$' }, CHF: { digits: 2, symbol: 'CHF ' }, SGD: { digits: 2, symbol: 'S$' },
    INR: { digits: 2, symbol: '₹' }, PHP: { digits: 2, symbol: '₱' }, MXN: { digits: 2, symbol: 'MX$' }, BRL: { digits: 2, symbol: 'R$' },
    ZAR: { digits: 2, symbol: 'R ' }, SEK: { digits: 2, symbol: 'SEK ' }, JPY: { digits: 0, symbol: '¥' }, KRW: { digits: 0, symbol: '₩' }
  };
  const formatMoney = (value, currency) => { const c = CURRENCIES[currency]; return `${value < 0n ? '-' : ''}${c.symbol}${formatDecimal(value < 0n ? -value : value, c.digits)}`; };

  // ----------------------------------------------------------------- Invoice
  const INVOICE_LIMITS = { maxLines: 100, maxText: 500, maxLongText: 2000, maxDraftBytes: 400000, maxLogoBytes: 1048576, maxLogoSide: 4000 };

  // input: { currency, taxMode: 'none'|'line'|'invoice', taxRate, taxShipping,
  //   discount, discountType: 'percent'|'amount', shipping, charge, paid,
  //   lines: [{ quantity, rate, discount, discountType, tax }] } with string values.
  // Returns per-line amounts, totals, and field-level errors.
  function calculateInvoice(input) {
    const currency = CURRENCIES[input.currency] ? input.currency : null;
    if (!currency) return fail('currency', 'Choose a supported currency.', { errors: [{ field: 'currency', message: 'Choose a supported currency.' }] });
    const digits = CURRENCIES[currency].digits;
    const errors = [];
    const num = (field, raw, options) => { const r = parseDecimal(raw, options); if (!r.ok) { errors.push({ field, message: r.message }); return 0n; } return r.value; };
    const lines = (input.lines || []).slice(0, INVOICE_LIMITS.maxLines + 1);
    if (lines.length > INVOICE_LIMITS.maxLines) errors.push({ field: 'lines', message: `An invoice can have at most ${INVOICE_LIMITS.maxLines} lines.` });
    const out = lines.map((line, index) => {
      const quantity = num(`line-${index}-quantity`, line.quantity, { maxDecimals: 4 });
      const rate = num(`line-${index}-rate`, line.rate, { maxDecimals: 4 });
      const base = mul(quantity, rate);
      const discountRaw = num(`line-${index}-discount`, line.discount, { maxDecimals: 4 });
      let discount = 0n;
      if (line.discountType === 'amount') discount = discountRaw;
      else { if (discountRaw > 100n * SCALE) errors.push({ field: `line-${index}-discount`, message: 'A percentage discount cannot be more than 100%.' }); discount = pctOf(base, discountRaw); }
      if (discount > base) errors.push({ field: `line-${index}-discount`, message: 'The discount is larger than the line amount.' });
      const net = roundTo(base - discount, digits);
      const taxRate = input.taxMode === 'line' ? num(`line-${index}-tax`, line.tax, { maxDecimals: 4 }) : 0n;
      if (taxRate > 100n * SCALE) errors.push({ field: `line-${index}-tax`, message: 'Use a tax rate of 100% or less.' });
      return { base, discount, net, taxRate };
    });
    const subtotal = out.reduce((sum, l) => sum + l.net, 0n);
    const discountInput = num('discount', input.discount, { maxDecimals: 4 });
    let invoiceDiscount = input.discountType === 'amount' ? roundTo(discountInput, digits) : roundTo(pctOf(subtotal, discountInput), digits);
    if (input.discountType !== 'amount' && discountInput > 100n * SCALE) errors.push({ field: 'discount', message: 'A percentage discount cannot be more than 100%.' });
    if (invoiceDiscount > subtotal) errors.push({ field: 'discount', message: 'The invoice discount is larger than the subtotal.' });
    const shipping = roundTo(num('shipping', input.shipping, { maxDecimals: digits }), digits);
    const charge = roundTo(num('charge', input.charge, { maxDecimals: digits }), digits);
    const paid = roundTo(num('paid', input.paid, { maxDecimals: digits }), digits);
    let tax = 0n; let taxableBase = 0n;
    if (input.taxMode === 'line') {
      // The invoice discount is shared across lines in proportion to their
      // net amounts, then each line's tax is rounded separately.
      for (const l of out) {
        const share = subtotal > 0n ? divHalf(invoiceDiscount * l.net, subtotal) : 0n;
        l.taxable = l.net - share;
        l.tax = roundTo(pctOf(l.taxable, l.taxRate), digits);
        taxableBase += l.taxable; tax += l.tax;
      }
    } else if (input.taxMode === 'invoice') {
      const rate = num('taxRate', input.taxRate, { maxDecimals: 4 });
      if (rate > 100n * SCALE) errors.push({ field: 'taxRate', message: 'Use a tax rate of 100% or less.' });
      taxableBase = subtotal - invoiceDiscount + (input.taxShipping ? shipping + charge : 0n);
      tax = roundTo(pctOf(taxableBase, rate), digits);
    }
    if (errors.length) return fail('fields', errors[0].message, { errors });
    const total = subtotal - invoiceDiscount + shipping + charge + tax;
    const balance = total - paid;
    return { ok: true, currency, digits, lines: out, subtotal, invoiceDiscount, shipping, charge, taxableBase, tax, total, paid, balance, credit: balance < 0n };
  }

  // Next invoice number for Duplicate: increments the last group of digits
  // and keeps its zero padding (INV-0099 becomes INV-0100).
  function nextInvoiceNumber(number) {
    const m = /^(.*?)(\d+)(\D*)$/.exec(String(number ?? '').trim());
    if (!m) return `${String(number ?? '').trim() || 'INV'}-2`;
    const next = (BigInt(m[2]) + 1n).toString().padStart(m[2].length, '0');
    return `${m[1]}${next}${m[3]}`;
  }

  // ----------------------------------------------------------- Draft files
  const DRAFT_VERSION = 1;
  const TEXT_FIELDS = ['sellerName', 'sellerAddress', 'sellerEmail', 'sellerPhone', 'sellerTaxLabel', 'sellerTaxId', 'customerName', 'customerAddress', 'customerEmail', 'customerPhone', 'customerTaxLabel', 'customerTaxId', 'number', 'issueDate', 'dueDate', 'po', 'currency', 'terms', 'taxMode', 'taxRate', 'taxShipping', 'discount', 'discountType', 'shipping', 'chargeLabel', 'charge', 'paid', 'notes', 'termsText', 'payment'];
  const LONG_FIELDS = new Set(['sellerAddress', 'customerAddress', 'notes', 'termsText', 'payment']);
  const LINE_FIELDS = ['description', 'quantity', 'unit', 'rate', 'discount', 'discountType', 'tax'];

  // Older drafts (version 0) used "items" with numeric amounts. They are
  // upgraded to version 1 before validation.
  function migrateDraft(data) {
    if (data && typeof data === 'object' && !Array.isArray(data) && data.version === undefined && Array.isArray(data.items)) {
      const { items, ...rest } = data;
      return { ...rest, version: 1, app: 'stack-row-invoice', lines: items.map(i => ({ description: i.description ?? i.name ?? '', quantity: String(i.quantity ?? i.qty ?? ''), unit: i.unit ?? '', rate: String(i.rate ?? i.price ?? ''), discount: '', discountType: 'percent', tax: '' })) };
    }
    return data;
  }
  function validateDraft(raw, { maxBytes = INVOICE_LIMITS.maxDraftBytes } = {}) {
    const text = String(raw ?? '');
    if (new TextEncoder().encode(text).length > maxBytes) return fail('size', `The draft file is larger than ${Math.round(maxBytes / 1000)} KB.`);
    let data;
    try { data = JSON.parse(text); } catch { return fail('json', 'This file is not a valid Stack Row invoice draft (it is not JSON).'); }
    data = migrateDraft(data);
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.app !== 'stack-row-invoice') return fail('shape', 'This file is not a Stack Row invoice draft.');
    if (data.version !== DRAFT_VERSION) return fail('version', `This draft uses version ${String(data.version).slice(0, 10)}, which this page cannot read.`);
    const fields = {};
    for (const key of Object.keys(data.fields || {})) if (!TEXT_FIELDS.includes(key)) return fail('field', `The draft has an unknown field "${key.slice(0, 40)}".`);
    for (const key of TEXT_FIELDS) {
      const value = data.fields?.[key] ?? '';
      if (typeof value !== 'string') return fail('field', `The field "${key}" must be text.`);
      if (value.length > (LONG_FIELDS.has(key) ? INVOICE_LIMITS.maxLongText : INVOICE_LIMITS.maxText)) return fail('length', `The field "${key}" is too long.`);
      fields[key] = value;
    }
    if (!Array.isArray(data.lines)) return fail('lines', 'The draft has no list of line items.');
    if (data.lines.length > INVOICE_LIMITS.maxLines) return fail('lines', `The draft has more than ${INVOICE_LIMITS.maxLines} line items.`);
    const lines = [];
    for (const line of data.lines) {
      if (!line || typeof line !== 'object' || Array.isArray(line)) return fail('lines', 'A line item in the draft is not valid.');
      const clean = {};
      for (const key of LINE_FIELDS) {
        const value = line[key] ?? '';
        if (typeof value !== 'string' || value.length > INVOICE_LIMITS.maxText) return fail('lines', `A line item field "${key}" is not valid text.`);
        clean[key] = value;
      }
      for (const key of ['quantity', 'rate', 'discount', 'tax']) if (clean[key] && !parseDecimal(clean[key]).ok) return fail('lines', `A line item has an invalid ${key}: "${clean[key].slice(0, 20)}".`);
      lines.push(clean);
    }
    let logo = '';
    if (data.logo) {
      if (typeof data.logo !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.logo) || data.logo.length > 400000) return fail('logo', 'The logo in the draft is not a valid PNG image.');
      logo = data.logo;
    }
    return { ok: true, draft: { version: DRAFT_VERSION, app: 'stack-row-invoice', fields, lines, logo } };
  }
  const draftToJson = draft => JSON.stringify({ app: 'stack-row-invoice', version: DRAFT_VERSION, savedAt: new Date().toISOString(), fields: draft.fields, lines: draft.lines, logo: draft.logo || '' }, null, 2);

  // Logo checks by file signature: PNG, JPEG, WebP or GIF only. SVG and
  // anything else is rejected; accepted images are redrawn through a canvas.
  function sniffImage(bytes) {
    const b = bytes;
    if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
    if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
    return null;
  }


  // --------------------------------------------------------------------- CLV
  // Planning estimates, not accounting valuations. Each model states its own
  // assumptions; inputs are plain numbers with percentages as 0 to 100.
  const monthlyFromAnnualChurn = annualPct => (1 - Math.pow(1 - annualPct / 100, 1 / 12)) * 100;
  const monthlyRateFromAnnual = annualPct => (Math.pow(1 + annualPct / 100, 1 / 12) - 1) * 100;
  const clvFail = (field, message) => fail('field', message, { field });

  function historicalClv({ revenue, costs = 0, customers }) {
    if (!(customers >= 1)) return clvFail('h_customers', 'Enter at least one customer.');
    const contribution = revenue - costs;
    return { ok: true, model: 'historical', perCustomer: contribution / customers, contribution, revenuePerCustomer: revenue / customers };
  }

  function simpleClv({ revenue, orders, customers, periodMonths, marginPct, lifespanYears }) {
    if (!(orders > 0)) return clvFail('s_orders', 'Enter the number of orders, more than zero.');
    if (!(customers > 0)) return clvFail('s_customers', 'Enter the number of unique customers, more than zero.');
    if (orders < customers) return clvFail('s_orders', 'Orders cannot be fewer than unique customers, because each customer ordered at least once.');
    if (!(periodMonths > 0)) return clvFail('s_period', 'Choose the period your data covers.');
    if (marginPct > 100) return clvFail('s_margin', 'Use a gross margin of 100% or less.');
    if (!(lifespanYears > 0)) return clvFail('s_lifespan', 'Enter an expected customer lifespan, more than zero.');
    const aov = revenue / orders;
    const frequency = orders / customers;
    const annualFrequency = frequency * (12 / periodMonths);
    const annualContribution = aov * annualFrequency * (marginPct / 100);
    return { ok: true, model: 'simple', aov, frequency, annualFrequency, annualContribution, monthlyContribution: annualContribution / 12, clv: annualContribution * lifespanYears };
  }

  // Constant churn, constant contribution. With zero churn the simple formula
  // has no finite answer, so a finite horizon in months is required instead.
  function subscriptionClv({ arpaMonthly, marginPct, churnMonthlyPct, horizonMonths = 0 }) {
    if (!(arpaMonthly >= 0)) return clvFail('sub_arpa', 'Enter revenue per account.');
    if (marginPct > 100) return clvFail('sub_margin', 'Use a gross margin of 100% or less.');
    if (churnMonthlyPct >= 100) return clvFail('sub_churn', 'Churn of 100% or more means every customer leaves in the first period. Use a lower rate.');
    const monthlyContribution = arpaMonthly * (marginPct / 100);
    if (churnMonthlyPct <= 0) {
      if (!(horizonMonths > 0)) return clvFail('sub_horizon', 'With zero churn the simple formula has no limit. Enter a horizon in months, or a churn rate above zero.');
      return { ok: true, model: 'subscription', monthlyContribution, lifetimeMonths: horizonMonths, ltv: monthlyContribution * horizonMonths, horizonUsed: true };
    }
    const c = churnMonthlyPct / 100;
    return { ok: true, model: 'subscription', monthlyContribution, lifetimeMonths: 1 / c, ltv: monthlyContribution / c, horizonUsed: false };
  }

  // Period-by-period expected contribution: contribution × retention^(t−1),
  // discounted by (1 + monthly discount rate)^t, summed over the horizon.
  function discountedClv({ arpaMonthly, marginPct, churnMonthlyPct, annualDiscountPct, horizonMonths }) {
    if (marginPct > 100) return clvFail('d_margin', 'Use a gross margin of 100% or less.');
    if (churnMonthlyPct < 0 || churnMonthlyPct >= 100) return clvFail('d_churn', 'Use a monthly churn rate from 0% to just under 100%.');
    if (!(horizonMonths >= 1) || horizonMonths > 600 || !Number.isInteger(horizonMonths)) return clvFail('d_horizon', 'Use a whole number of months from 1 to 600.');
    if (annualDiscountPct < 0 || annualDiscountPct > 100) return clvFail('d_discount', 'Use an annual discount rate from 0% to 100%.');
    const m = arpaMonthly * (marginPct / 100);
    const r = 1 - churnMonthlyPct / 100;
    const i = monthlyRateFromAnnual(annualDiscountPct) / 100;
    let total = 0; let survival = 1; const periods = [];
    for (let t = 1; t <= horizonMonths; t += 1) {
      const value = m * survival / Math.pow(1 + i, t);
      total += value;
      periods.push({ month: t, retained: survival, value, cumulative: total });
      survival *= r;
    }
    return { ok: true, model: 'discounted', monthlyContribution: m, monthlyDiscountPct: i * 100, ltv: total, periods };
  }

  const unitEconomics = (ltv, cac, monthlyContribution) => (cac > 0 ? { ratio: ltv / cac, paybackMonths: monthlyContribution > 0 ? cac / monthlyContribution : null } : null);

  root.StackRowBusinessTools = Object.assign(root.StackRowBusinessTools || {}, {
    Decimal: { SCALE, parseDecimal, roundTo, formatDecimal, mul, pctOf, divHalf },
    Invoice: { CURRENCIES, INVOICE_LIMITS, calculateInvoice, formatMoney, nextInvoiceNumber, migrateDraft, validateDraft, draftToJson, sniffImage, TEXT_FIELDS, LINE_FIELDS, DRAFT_VERSION },
    Clv: { historicalClv, simpleClv, subscriptionClv, discountedClv, unitEconomics, monthlyFromAnnualChurn, monthlyRateFromAnnual }
  });
})(typeof window !== 'undefined' ? window : globalThis);
