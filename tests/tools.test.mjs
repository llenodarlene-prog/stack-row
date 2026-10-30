import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = {};
vm.runInNewContext((await readFile('src/scripts/tool-formulas.js', 'utf8')) + (await readFile('src/scripts/llm-prices.js', 'utf8')), context);
const { Markup, Base, Raid, Transfer, Roi, Cpm, Roas, Significance, Valuation, Tokens } = context.StackRowFormulas;
const Prices = context.StackRowLlmPrices;
const close = (actual, expected, digits = 2) => assert.equal(Number(actual.toFixed(digits)), expected);

test('markup: price, margin, discount, tax, and quantity match the worked example', () => {
  const r = Markup.calculate({ mode: 'markup', cost: 40, markup: 50, quantity: 100, discount: 10, tax: 8 });
  assert.equal(r.price, 60);
  close(r.margin, 33.33);
  assert.equal(r.discounted, 54);
  close(r.discountedMargin, 25.93);
  close(r.customerPrice, 58.32);
  assert.equal(r.totalProfit, 1400);
});

test('markup: reverse calculations and conversions', () => {
  assert.equal(Markup.calculate({ mode: 'price', cost: 40, price: 60 }).markup, 50);
  close(Markup.calculate({ mode: 'margin', cost: 40, margin: 50 }).price, 80);
  close(Markup.markupToMargin(50), 33.33);
  close(Markup.marginToMarkup(40), 66.67);
  assert.equal(Markup.marginToMarkup(100), null);
  assert.equal(Markup.calculate({ mode: 'price', cost: 0, price: 10 }).markup, null);
});

test('base: parsing, conversion, and validation', () => {
  assert.equal(Base.parse('0xFF', 16).value, 255n);
  assert.equal(Base.parse('1010_1010', 2).value, 170n);
  assert.ok(Base.parse('12', 2).error);
  assert.ok(Base.parse('G', 16).error);
  assert.equal(Base.format(255n, 16), 'ff');
  assert.equal(Base.format(4096n, 8), '10000');
  assert.equal(Base.group('11111111', 4), '1111 1111');
});

test('base: two\'s complement, widths, and arithmetic', () => {
  assert.equal(Base.fromTwos(255n, 8), -1n);
  assert.equal(Base.twos(-1n, 8), '11111111');
  assert.equal(Base.twos(-128n, 8), '10000000');
  assert.equal(Base.fits(127n, 8, true), true);
  assert.equal(Base.fits(128n, 8, true), false);
  assert.equal(Base.fitWidth(256n, false), 16);
  assert.equal(Base.operate(255n, 1n, 'add').value, 256n);
  assert.deepEqual({ ...Base.operate(7n, 2n, 'divide') }, { value: 3n, remainder: 1n });
  assert.ok(Base.operate(1n, 0n, 'divide').error);
  assert.equal(Base.parse('9007199254740993', 10).value, 9007199254740993n);
});

test('raid: capacity, tolerance, and validation for every level', () => {
  const expected = { 0: 16, 1: 4, 5: 12, 6: 8, 10: 8, jbod: 16 };
  for (const [level, usable] of Object.entries(expected)) assert.equal(Raid.calculate({ level, disks: 4, size: 4 }).usable, usable);
  const r = Raid.calculate({ level: '6', disks: 8, size: 12, spares: 1 });
  assert.equal(r.usable, 60);
  assert.equal(r.efficiency, 62.5);
  close(r.usableTib, 54.57);
  assert.equal(r.guaranteed, 2);
  assert.equal(Raid.calculate({ level: '50', disks: 6, size: 4, groups: 2 }).usable, 16);
  assert.equal(Raid.calculate({ level: '60', disks: 8, size: 4, groups: 2 }).usable, 16);
  assert.ok(Raid.calculate({ level: '5', disks: 2, size: 4 }).error);
  assert.ok(Raid.calculate({ level: '10', disks: 5, size: 4 }).error);
  assert.ok(Raid.calculate({ level: '50', disks: 7, size: 4, groups: 2 }).error);
});

test('transfer: time, required speed, and data moved', () => {
  close(Transfer.time(50e9, 100e6, 0), 4000);
  close(Transfer.time(50e9, 100e6, 10), 4444.44);
  assert.equal(Transfer.duration(4000), '1 hour 6 minutes 40 seconds');
  close(Transfer.speed(2e12, 8 * 3600, 15) / 1e6, 653.59);
  assert.equal(Transfer.data(1e9, 3600, 0), 450e9);
  assert.equal(Transfer.time(1e9, 100e6, 0), 80);
});

test('roi: simple, annualized, project, and payback', () => {
  const simple = Roi.simple({ cost: 10000, value: 13000, years: 2 });
  assert.equal(simple.roi, 30);
  close(simple.annualized, 14.02);
  const project = Roi.project({ implementation: 25000, training: 5000, licensing: 2000, operating: 500, revenue: 1500, hours: 120, hourly: 45, months: 36 });
  assert.equal(project.totalCost, 120000);
  assert.equal(project.totalBenefit, 248400);
  assert.equal(project.roi, 107);
  close(project.payback, 6.82);
  close(project.annualized, 27.45);
  assert.equal(Roi.project({ implementation: 1000, licensing: 500, revenue: 400, months: 12 }).payback, null);
});

test('cpm: three directions and click metrics match the worked example', () => {
  assert.equal(Cpm.cpm(2500, 400000), 6.25);
  assert.equal(Cpm.cost(6.25, 400000), 2500);
  assert.equal(Cpm.impressions(2500, 6.25), 400000);
  const x = Cpm.extras(2500, 400000, 3200, 96);
  close(x.ctr, 0.8);
  close(x.cpc, 0.78);
  close(x.cpa, 26.04);
  assert.equal(Cpm.cpm(10, 0), null);
});

test('roas: ratio, break-even, and profit after ad spend', () => {
  const r = Roas.calculate({ revenue: 12000, spend: 3000, margin: 40 });
  assert.equal(r.roas, 4);
  assert.equal(r.breakEven, 2.5);
  assert.equal(r.profitAfterAds, 1800);
  assert.equal(r.aboveBreakEven, true);
  assert.equal(Roas.calculate({ revenue: 2000, spend: 1000, margin: 25 }).aboveBreakEven, false);
  assert.equal(Roas.targetRevenue(2000, 5), 10000);
});

test('significance: z-test matches the worked example and normal CDF is accurate', () => {
  close(Significance.normalCdf(1.959964), 0.975, 5);
  close(Significance.normalCdf(0), 0.5, 6);
  const r = Significance.test({ visitorsA: 10000, conversionsA: 500, visitorsB: 10000, conversionsB: 580, confidence: 95, sides: 2 });
  close(r.z, 2.5, 2);
  close(r.p, 0.0123, 4);
  assert.equal(r.significant, true);
  close(r.uplift, 16);
  close(r.ciLow, 0.17);
  close(r.ciHigh, 1.43);
  const same = Significance.test({ visitorsA: 1000, conversionsA: 50, visitorsB: 1000, conversionsB: 50, confidence: 95, sides: 2 });
  assert.equal(same.significant, false);
  assert.equal(Significance.test({ visitorsA: 20, conversionsA: 1, visitorsB: 20, conversionsB: 3 }).smallCells, true);
});

test('valuation: multiples and DCF match the worked examples', () => {
  const m = Valuation.multiple(400000, 2.5, 3.5);
  assert.equal(m.low, 1000000);
  assert.equal(m.high, 1400000);
  const d = Valuation.dcf({ cashFlow: 200000, growth: 10, discount: 15, years: 5, terminalGrowth: 3 });
  close(d.total, 2251433, 0);
  close(d.pv, 876884, 0);
  assert.ok(Valuation.dcf({ cashFlow: 1, growth: 0, discount: 3, years: 5, terminalGrowth: 3 }).error);
});

test('tokens: estimate, cost, long-prompt tier, and dated price switch', () => {
  assert.equal(Tokens.estimate('abcdefgh').tokens, 2);
  const sonnet = Prices.current('2026-10-30').find(m => m.id === 'claude-sonnet-5-5');
  close(Tokens.cost(sonnet, 2000, 500).total * 10000, 90);
  const haiku = Prices.current('2026-10-30').find(m => m.id === 'claude-haiku-5-5');
  assert.equal(Tokens.cost(haiku, 150000, 0).tier, 'long prompt');
  close(Tokens.cost(sonnet, 1000000, 0, 50).input, 1.05);
  assert.equal(Prices.current('2026-11-15').find(m => m.id === 'gemini-4-argon').input, 2);
  assert.equal(Prices.current('2026-12-01').find(m => m.id === 'gemini-4-argon').input, 4);
  assert.equal(Prices.current('2027-01-01').filter(m => m.id === 'gemini-3.8-flash').length, 1);
});
