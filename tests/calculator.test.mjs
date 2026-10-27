import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = {};
vm.runInNewContext(await readFile('src/scripts/arr-mrr-formulas.js', 'utf8'), context);
const f = context.StackRowArrMrr;

test('quick conversion: MRR to ARR and ARR to MRR', () => {
  assert.equal(f.calculateQuickConversion(10000, 'mrr').arr, 120000);
  assert.equal(f.calculateQuickConversion(120000, 'arr').mrr, 10000);
});

test('plan normalization: annual and mixed billing intervals', () => {
  const annual = f.calculatePlanRevenue([{ customers: 10, price: 1200, interval: 'annual' }]);
  assert.equal(annual.totalMrr, 1000);
  assert.equal(annual.totalArr, 12000);
  const mixed = f.calculatePlanRevenue([
    { customers: 10, price: 100, interval: 'monthly' },
    { customers: 12, price: 300, interval: 'quarterly' },
    { customers: 5, price: 1200, interval: 'annual' }
  ]);
  assert.equal(mixed.totalMrr, 2700);
  assert.equal(mixed.totalArr, 32400);
  assert.equal(mixed.largestIndex, 1);
});

test('MRR movement matches the published example', () => {
  const r = f.calculateMrrMovement({ start: 50000, newMrr: 6000, expansion: 3000, reactivation: 1000, contraction: 1500, churn: 2500 });
  assert.equal(r.ending, 56000);
  assert.equal(r.netNew, 6000);
  assert.equal(r.endingArr, 672000);
  assert.equal(f.formatPercentage(r.growthRate), '12.00%');
  assert.equal(f.formatPercentage(r.grossChurnRate), '8.00%');
  assert.equal(f.formatPercentage(r.grr), '92.00%');
  assert.equal(f.formatPercentage(r.nrr), '100.00%');
});

test('zero starting MRR leaves every rate unavailable', () => {
  const r = f.calculateMrrMovement({ start: 0, newMrr: 5000 });
  assert.equal(r.ending, 5000);
  for (const key of ['growthRate', 'grossChurnRate', 'grr', 'nrr']) assert.equal(f.formatPercentage(r[key]), 'Not available');
});

test('empty optional movement fields count as zero', () => {
  assert.equal(f.calculateMrrMovement({ start: 10000 }).ending, 10000);
});

test('input parsing rejects negatives and text, accepts separators and symbols', () => {
  assert.equal(f.parseAmount('-500').error, 'Use zero or a positive amount.');
  assert.ok(f.parseAmount('abc').error);
  assert.ok(f.parseAmount('12.345').error);
  assert.equal(f.parseAmount('$50,000.50').value, 50000.5);
  assert.equal(f.parseAmount('').empty, true);
  assert.equal(f.parseAmount('2.5', { whole: true }).error, 'Customer count must be a whole number.');
  assert.ok(f.parseAmount('1000000000000').error);
});

test('GRR is capped at 100% and losses above the base are flagged', () => {
  const r = f.calculateMrrMovement({ start: 1000, contraction: 800, churn: 400 });
  assert.equal(r.lossesExceedStart, true);
  assert.ok(r.grr <= 100);
});

test('currency formatting supports every listed currency', () => {
  for (const code of f.CURRENCIES) assert.match(f.formatCurrency(1234.5, code), /1,234\.50/);
});
