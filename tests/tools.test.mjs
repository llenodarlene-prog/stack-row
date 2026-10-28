import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = {};
vm.runInNewContext(await readFile('src/scripts/tool-formulas.js', 'utf8'), context);
const { Markup, Base, Raid, Transfer, Roi } = context.StackRowFormulas;
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
