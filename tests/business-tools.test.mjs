import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = { TextEncoder, JSON };
vm.runInNewContext(await readFile('src/scripts/business-tool-formulas.js', 'utf8'), context);
const { Invoice: I, Decimal: D } = context.StackRowBusinessTools;
const money = (v, c = 'USD') => I.formatMoney(v, c);
const base = { currency: 'USD', taxMode: 'none', discount: '', discountType: 'percent', shipping: '', charge: '', paid: '' };

test('invoice: decimal multiplication has no floating-point artifacts', () => {
  assert.equal(D.formatDecimal(D.mul(D.parseDecimal('0.1').value, D.parseDecimal('0.2').value), 8), '0.02000000');
  const r = I.calculateInvoice({ ...base, lines: [{ quantity: '0.1', rate: '0.2' }, { quantity: '3', rate: '0.1' }] });
  assert.equal(money(r.subtotal), '$0.32');
});

test('invoice: worked example reconciles exactly', () => {
  const r = I.calculateInvoice({ ...base, taxMode: 'invoice', taxRate: '8.25', taxShipping: false, discount: '10', shipping: '15', paid: '100', lines: [{ quantity: '3', rate: '49.99' }, { quantity: '1.5', rate: '120', discount: '20', discountType: 'amount' }] });
  assert.deepEqual([...r.lines].map(l => money(l.net)), ['$149.97', '$160.00']);
  assert.equal(money(r.subtotal), '$309.97'); assert.equal(money(r.invoiceDiscount), '$31.00');
  assert.equal(money(r.tax), '$23.02'); assert.equal(money(r.total), '$316.99'); assert.equal(money(r.balance), '$216.99');
  assert.equal(r.total, r.subtotal - r.invoiceDiscount + r.shipping + r.charge + r.tax);
});

test('invoice: per-line tax shares the invoice discount and rounds per line', () => {
  const r = I.calculateInvoice({ ...base, taxMode: 'line', discount: '10', discountType: 'amount', lines: [{ quantity: '1', rate: '100', tax: '10' }, { quantity: '1', rate: '50', tax: '0' }] });
  assert.equal(money(r.lines[0].tax), '$9.33'); assert.equal(money(r.tax), '$9.33'); assert.equal(money(r.total), '$149.33');
  const ship = I.calculateInvoice({ ...base, taxMode: 'invoice', taxRate: '10', taxShipping: true, shipping: '10', lines: [{ quantity: '1', rate: '100' }] });
  assert.equal(money(ship.tax), '$11.00');
});

test('invoice: zero tax, zero lines, credit balance and currency rounding', () => {
  assert.equal(money(I.calculateInvoice({ ...base, taxMode: 'invoice', taxRate: '0', lines: [{ quantity: '1', rate: '10' }] }).tax), '$0.00');
  assert.equal(money(I.calculateInvoice({ ...base, lines: [{ quantity: '0', rate: '10' }] }).total), '$0.00');
  const credit = I.calculateInvoice({ ...base, paid: '200', lines: [{ quantity: '1', rate: '150' }] });
  assert.equal(credit.credit, true); assert.equal(money(credit.balance), '-$50.00'); assert.equal(money(credit.total), '$150.00');
  const yen = I.calculateInvoice({ ...base, currency: 'JPY', taxMode: 'invoice', taxRate: '10', lines: [{ quantity: '3', rate: '333.5' }] });
  assert.equal(money(yen.subtotal, 'JPY'), '¥1,001'); assert.equal(money(yen.total, 'JPY'), '¥1,101');
  assert.equal(money(I.calculateInvoice({ ...base, lines: [{ quantity: '1', rate: '0.005' }] }).total), '$0.01');
});

test('invoice: negative input and excessive discounts are rejected with field names', () => {
  const neg = I.calculateInvoice({ ...base, lines: [{ quantity: '-1', rate: '5' }] });
  assert.equal(neg.ok, false); assert.equal(neg.errors[0].field, 'line-0-quantity');
  assert.equal(I.calculateInvoice({ ...base, lines: [{ quantity: '1', rate: '10', discount: '20', discountType: 'amount' }] }).errors[0].field, 'line-0-discount');
  assert.equal(I.calculateInvoice({ ...base, lines: [{ quantity: '1', rate: '10', discount: '120' }] }).errors[0].field, 'line-0-discount');
  assert.equal(I.calculateInvoice({ ...base, discount: '50', discountType: 'amount', lines: [{ quantity: '1', rate: '10' }] }).errors[0].field, 'discount');
  assert.equal(I.calculateInvoice({ ...base, currency: 'XXX', lines: [] }).code, 'currency');
  assert.equal(I.calculateInvoice({ ...base, lines: Array(101).fill({ quantity: '1', rate: '1' }) }).errors[0].field, 'lines');
});

test('invoice: numbering and draft migration, validation and hostile input', () => {
  assert.equal(I.nextInvoiceNumber('INV-0099'), 'INV-0100');
  assert.equal(I.nextInvoiceNumber('2026-7'), '2026-8');
  const draft = { fields: Object.fromEntries(I.TEXT_FIELDS.map(k => [k, ''])), lines: [{ description: '<script>x</script>', quantity: '1', unit: '', rate: '5', discount: '', discountType: 'percent', tax: '' }], logo: '' };
  draft.fields.currency = 'USD';
  const ok = I.validateDraft(I.draftToJson(draft));
  assert.equal(ok.ok, true); assert.equal(ok.draft.lines[0].description, '<script>x</script>');
  const v0 = I.validateDraft(JSON.stringify({ fields: { number: 'A-1' }, items: [{ name: 'Old item', qty: 2, price: 3.5 }] }));
  assert.equal(v0.ok, true); assert.equal(v0.draft.lines[0].rate, '3.5'); assert.equal(v0.draft.fields.number, 'A-1');
  for (const [raw, code] of [['not json', 'json'], ['[]', 'shape'], [JSON.stringify({ app: 'stack-row-invoice', version: 9, fields: {}, lines: [] }), 'version'], [JSON.stringify({ app: 'stack-row-invoice', version: 1, fields: { evil: 'x' }, lines: [] }), 'field'], [JSON.stringify({ app: 'stack-row-invoice', version: 1, fields: { notes: 'x'.repeat(2001) }, lines: [] }), 'length'], [JSON.stringify({ app: 'stack-row-invoice', version: 1, fields: {}, lines: [{ quantity: '1e9' }] }), 'lines'], [JSON.stringify({ app: 'stack-row-invoice', version: 1, fields: {}, lines: [], logo: 'data:image/svg+xml;base64,PHN2Zz4=' }), 'logo'], ['x'.repeat(400001), 'size']]) assert.equal(I.validateDraft(raw).code, code, code);
});

test('invoice: logo signatures accept raster images and reject SVG', () => {
  assert.equal(I.sniffImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  assert.equal(I.sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(I.sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
});

test('invoice page: opt-in persistence, no sharing, no innerHTML, no network', async () => {
  const page = await readFile('src/scripts/invoice-generator.js', 'utf8');
  assert.match(page, /persistence: 'opt-in', share: \{ mode: 'disabled' \}/);
  assert.doesNotMatch(page, /innerHTML|insertAdjacentHTML|fetch\(|XMLHttpRequest|sendBeacon/);
});

const { Clv: C } = context.StackRowBusinessTools;
const near = (a, b, d = 2) => assert.equal(Number(a.toFixed(d)), b);

test('clv: historical, repeat purchase, subscription and discounted models match fixtures', () => {
  assert.equal(C.historicalClv({ revenue: 500000, costs: 300000, customers: 1000 }).perCustomer, 200);
  const s = C.simpleClv({ revenue: 240000, orders: 4000, customers: 1600, periodMonths: 6, marginPct: 40, lifespanYears: 3 });
  assert.equal(s.aov, 60); assert.equal(s.annualFrequency, 5); near(s.annualContribution, 120); near(s.clv, 360);
  const sub = C.subscriptionClv({ arpaMonthly: 100, marginPct: 80, churnMonthlyPct: 2 });
  near(sub.ltv, 4000); near(sub.lifetimeMonths, 50);
  const d = C.discountedClv({ arpaMonthly: 100, marginPct: 80, churnMonthlyPct: 0, annualDiscountPct: 0, horizonMonths: 12 });
  near(d.ltv, 960);
  const d2 = C.discountedClv({ arpaMonthly: 100, marginPct: 80, churnMonthlyPct: 2, annualDiscountPct: 10, horizonMonths: 60 });
  near(d2.ltv, 2331.42); assert.equal(d2.periods.length, 60); near(d2.periods[59].cumulative, 2331.42);
});

test('clv: LTV to CAC and payback', () => {
  const ue = C.unitEconomics(4000, 1200, 80);
  near(ue.ratio, 3.33); assert.equal(ue.paybackMonths, 15);
  assert.equal(C.unitEconomics(4000, 0, 80), null);
  assert.equal(C.unitEconomics(4000, 100, 0).paybackMonths, null);
});

test('clv: monthly and annual conversions are consistent', () => {
  near(C.monthlyFromAnnualChurn(20), 1.84, 2);
  const m = C.monthlyFromAnnualChurn(20) / 100;
  near(1 - Math.pow(1 - m, 12), 0.2, 6);
  near(C.monthlyRateFromAnnual(10), 0.80, 2);
  near(C.subscriptionClv({ arpaMonthly: 1200 / 12, marginPct: 80, churnMonthlyPct: 2 }).ltv, 4000);
});

test('clv: zero churn, 100% churn, bad margins and counts are handled', () => {
  assert.equal(C.subscriptionClv({ arpaMonthly: 100, marginPct: 80, churnMonthlyPct: 0 }).field, 'sub_horizon');
  const finite = C.subscriptionClv({ arpaMonthly: 100, marginPct: 80, churnMonthlyPct: 0, horizonMonths: 36 });
  assert.equal(finite.ltv, 2880); assert.equal(finite.horizonUsed, true); assert.ok(Number.isFinite(finite.ltv));
  assert.equal(C.subscriptionClv({ arpaMonthly: 100, marginPct: 80, churnMonthlyPct: 100 }).field, 'sub_churn');
  assert.equal(C.subscriptionClv({ arpaMonthly: 100, marginPct: 120, churnMonthlyPct: 2 }).field, 'sub_margin');
  assert.equal(C.simpleClv({ revenue: 1, orders: 5, customers: 10, periodMonths: 12, marginPct: 40, lifespanYears: 1 }).field, 's_orders');
  assert.equal(C.historicalClv({ revenue: 1, customers: 0 }).field, 'h_customers');
  assert.ok(C.historicalClv({ revenue: 100, costs: 300, customers: 2 }).perCustomer < 0);
  assert.equal(C.discountedClv({ arpaMonthly: 1, marginPct: 1, churnMonthlyPct: 1, annualDiscountPct: 1, horizonMonths: 601 }).field, 'd_horizon');
});

test('clv page: allowlisted numeric sharing with restore rules and auto persistence', async () => {
  const page = await readFile('src/scripts/customer-lifetime-value-calculator.js', 'utf8');
  assert.match(page, /share: \{ mode: 'allowlist'/);
  assert.match(page, /storeKey: 'stackrow:clv:v1'/);
  assert.doesNotMatch(page, /persistence: 'none'/);
});
