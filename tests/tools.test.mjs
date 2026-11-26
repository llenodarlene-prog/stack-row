import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = {};
vm.runInNewContext((await readFile('src/scripts/tool-formulas.js', 'utf8')) + (await readFile('src/scripts/llm-prices.js', 'utf8')) + (await readFile('src/scripts/apigw-prices.js', 'utf8')), context);
const { Markup, Base, Raid, Transfer, Roi, Cpm, Roas, Significance, Valuation, Tokens, Subnet, Margin, Employee, Runway, Billable } = context.StackRowFormulas;
const Prices = context.StackRowLlmPrices;
const { ApiGateway, AiRoi, Automation } = context.StackRowFormulas;
const Gw = context.StackRowApiGatewayPrices;
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

test('subnet calculator handles IPv4 ranges, /31, /32 and IPv6 compression', () => {
  const r = Subnet.ipv4(Subnet.parse4('192.168.10.77'), 26);
  assert.equal(Subnet.format4(r.network), '192.168.10.64');
  assert.equal(Subnet.format4(r.broadcast), '192.168.10.127');
  assert.equal(r.usable, 62);
  assert.equal(Subnet.format4(r.wildcard), '0.0.0.63');
  assert.equal(Subnet.ipv4(Subnet.parse4('10.0.0.0'), 31).usable, 2);
  assert.equal(Subnet.ipv4(Subnet.parse4('10.0.0.9'), 32).usable, 1);
  assert.equal(Subnet.parse4('256.1.1.1'), null);
  assert.equal(Subnet.prefixFromMask(Subnet.parse4('255.255.240.0')), 20);
  assert.equal(Subnet.prefixFromMask(Subnet.parse4('255.0.255.0')), null);
  assert.equal(Subnet.format6(Subnet.ipv6(Subnet.parse6('2001:db8:abcd:12::1'), 48).network), '2001:db8:abcd::');
  assert.equal(Subnet.ipv6(Subnet.parse6('::1'), 64).size, 2n ** 64n);
});

test('profit margin separates gross, operating and net margin', () => {
  assert.equal(Margin.fromCost(100, 60).margin, 40);
  const s = Margin.statement({ revenue: 1000, cogs: 400, opex: 300, interest: 50, taxes: 50 });
  assert.deepEqual([s.grossMargin, s.operatingMargin, s.netMargin], [60, 30, 20]);
  assert.equal(Margin.priceForMargin(60, 40), 100);
  assert.equal(Margin.priceForMargin(60, 100), null);
});

test('employee cost caps Social Security and FUTA at their 2026 wage bases', () => {
  const low = Employee.cost({ wages: 80000 });
  assert.equal(Math.round(low.ss), 4960);
  assert.equal(low.futa, 42);
  const high = Employee.cost({ wages: 250000 });
  assert.equal(Math.round(high.ss), 11439);
  assert.equal(Math.round(high.medicare), 3625);
});

test('runway divides cash by net burn and stops when the company is profitable', () => {
  assert.equal(Runway.simulate({ cash: 500000, revenue: 20000, expenses: 60000 }).runway, 12.5);
  assert.equal(Runway.simulate({ cash: 1000, revenue: 5000, expenses: 4000 }).profitable, true);
});

test('billable hours and required rate', () => {
  assert.equal(Billable.hours({ weeklyHours: 40, weeks: 46, utilization: 75 }).billable, 1380);
  assert.equal(Billable.requiredRate({ income: 100000, expenses: 20000, billableHours: 1200, taxPct: 25 }).rate.toFixed(2), '133.33');
});

test('subnet: CIDR parsing, boundaries, leading zeros and zone identifiers', () => {
  const p = c => Subnet.parseCidr(c);
  assert.equal(p('0.0.0.0/0').last, 4294967295n);
  assert.equal(p('10.1.2.3/32').network, p('10.1.2.3/32').last);
  assert.equal(p('10.0.0.5/30').network, BigInt(Subnet.parse4('10.0.0.4')));
  assert.equal(p('192.168.1.10/24').hostBitsSet, true);
  assert.equal(p('010.0.0.1/8').error, 'address');
  assert.equal(Subnet.parse4('010.0.0.1'), null);
  assert.equal(p('fe80::1%eth0/64').error, 'zone');
  assert.equal(p('10.0.0.0/33').error, 'prefix');
  assert.equal(p('::/0').last, (1n << 128n) - 1n);
  assert.equal(p('2001:db8::1/127').last - p('2001:db8::1/127').network, 1n);
  assert.equal(p('2001:db8::1/128').network, p('2001:db8::1/128').last);
  assert.equal(Subnet.expand6(Subnet.parse6('2001:db8::1')), '2001:0db8:0000:0000:0000:0000:0000:0001');
});

test('subnet: splitting with exact large counts and caps', () => {
  const r = Subnet.split(Subnet.parseCidr('10.0.0.0/22'), 24);
  assert.equal(r.total, 4n);
  assert.deepEqual([...r.subnets].map(s => Subnet.formatBig(4, s.network)), ['10.0.0.0', '10.0.1.0', '10.0.2.0', '10.0.3.0']);
  const big = Subnet.split(Subnet.parseCidr('2001:db8::/32'), 96, 1024);
  assert.equal(big.total, 2n ** 64n); assert.equal(big.subnets.length, 1024); assert.equal(big.truncated, true);
  assert.equal(Subnet.split(Subnet.parseCidr('10.0.0.0/24'), 24).error, 'split');
  assert.equal(Subnet.split(Subnet.parseCidr('10.0.0.0/24'), 33).error, 'split');
});

test('subnet: multi-step aggregation, overlaps and mixed families', () => {
  const r = Subnet.aggregate(['10.0.3.0/24', '10.0.1.0/24', '10.0.0.0/24', '10.0.2.0/24', '10.0.5.0/24']);
  assert.deepEqual([...r.blocks].map(b => `${Subnet.formatBig(4, b.network)}/${b.prefix}`), ['10.0.0.0/22', '10.0.5.0/24']);
  assert.deepEqual([...Subnet.aggregate(['10.0.1.0/24', '10.0.2.0/24']).blocks].map(b => b.prefix), [24, 24]);
  const v6 = Subnet.aggregate(['2001:db8::/33', '2001:db8:8000::/33']);
  assert.equal(`${Subnet.formatBig(6, v6.blocks[0].network)}/${v6.blocks[0].prefix}`, '2001:db8::/32');
  assert.equal(Subnet.aggregate(['10.0.0.0/24', '10.0.0.128/25']).error, 'overlap');
  assert.equal(Subnet.aggregate(['10.0.0.0/24', '::/64']).error, 'family');
  assert.equal(Subnet.aggregate(['nonsense']).line, 1);
});

test('bandwidth: peak demand, headroom and monthly data', () => {
  const { Bandwidth } = context.StackRowFormulas;
  const r = Bandwidth.plan({ users: 40, rateMbps: 3, peakPct: 60, headroomPct: 25 });
  assert.equal(Number(r.peakMbps.toFixed(6)), 72); assert.equal(Number(r.required.toFixed(6)), 90);
  const m = Bandwidth.plan({ users: 1, rateMbps: 8, peakPct: 100, averagePct: 100 });
  assert.equal(Math.round(m.monthlyBytes), 2629746000000);
});

test('api gateway: matches the worked examples on the AWS pricing page', () => {
  close(ApiGateway.estimate(Gw, { type: 'rest', requests: 5e6 }).request, 17.5);
  close(ApiGateway.estimate(Gw, { type: 'rest', requests: 15e9 }).request, 36353.1);
  close(ApiGateway.estimate(Gw, { type: 'http', requests: 432e6 }).request, 418.8);
  close(ApiGateway.estimate(Gw, { type: 'http', requests: 1080000, sizeKb: 4608 }).request, 9.72);
  const ws = ApiGateway.estimate(Gw, { type: 'websocket', requests: 18e6, minutes: 21.6e6 });
  close(ws.request, 18); close(ws.connection, 5.4);
  close(ApiGateway.estimate(Gw, { type: 'rest', requests: 0, cacheGb: '1.6', cacheHours: 730 }).cache, 27.74);
  close(ApiGateway.estimate(Gw, { type: 'rest', requests: 1.5e6, freeTier: true }).request, 1.75);
});

test('ai roi: worked example, negative cases and break-even', () => {
  const r = AiRoi.business({ users: 50, adoptionPct: 70, hoursPerWeek: 5, changePct: 15, reworkPct: 10, reviewHoursPerWeek: 4, rate: 60, licensePerUserMonth: 30, implementation: 10000, trainingPerUser: 200, rampMonths: 3, weeks: 48 });
  assert.equal(r.net, 942); assert.equal(r.value, 56520); assert.equal(r.netValue, 11455); close(r.breakEven, 6.51);
  const slow = AiRoi.business({ users: 10, adoptionPct: 100, hoursPerWeek: 10, changePct: -19, rate: 50, weeks: 48 });
  assert.ok(slow.net < 0); assert.equal(slow.rework, 0); assert.equal(slow.payback, null);
});

test('workflow automation roi: worked example and break-even volume', () => {
  const r = Automation.roi({ volume: 2000, minutes: 6, rate: 45, automatablePct: 80, exceptionPct: 10, exceptionMinutes: 10, errorPct: 3, errorCost: 40, errorReductionPct: 70, software: 12000, implementation: 15000, maintenance: 3000, rampMonths: 3, years: 3 });
  assert.equal(r.hoursReturned, 1600); assert.equal(r.errorSavings, 20160); assert.equal(r.net, 204960); close(r.payback, 3.83); close(r.breakEvenVolume, 325.52);
  assert.equal(Automation.roi({ volume: 10, minutes: 1, rate: 20, automatablePct: 100, software: 5000 }).payback, null);
});
