import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = { TextEncoder, Intl, Date };
vm.runInNewContext(await readFile('src/scripts/developer-tool-formulas.js', 'utf8'), context);
const { Timestamp: TS } = context.StackRowDevTools;

test('timestamp: epoch zero is 1970-01-01T00:00:00Z', () => {
  const r = TS.convertTimestamp('0');
  assert.equal(r.ok, true);
  assert.equal(r.unit, 's');
  assert.equal(r.iso, '1970-01-01T00:00:00.000Z');
  assert.equal(r.rfc3339, '1970-01-01T00:00:00Z');
});

test('timestamp: seconds, ms, us and ns of the same instant agree', () => {
  const values = ['1700000000', '1700000000000', '1700000000000000', '1700000000000000000'];
  const units = values.map(v => TS.convertTimestamp(v));
  assert.deepEqual([...units].map(r => r.unit), ['s', 'ms', 'us', 'ns']);
  for (const r of units) { assert.equal(r.iso, '2023-11-14T22:13:20.000Z'); assert.equal(r.nanos, 1700000000000000000n); }
});

test('timestamp: negative time and exact sub-millisecond remainders', () => {
  assert.equal(TS.convertTimestamp('-86400').iso, '1969-12-31T00:00:00.000Z');
  const r = TS.convertTimestamp('1700000000123456789');
  assert.equal(r.remainderNs, 456789);
  assert.equal(r.rfc3339, '2023-11-14T22:13:20.123456789Z');
  assert.equal(r.microseconds, 1700000000123456n);
  const neg = TS.convertTimestamp('-1', { unit: 'ns' });
  assert.equal(neg.ms, -1);
  assert.equal(neg.remainderNs, 999999);
  assert.equal(neg.rfc3339, '1969-12-31T23:59:59.999999999Z');
  const back = TS.parseUtcOrOffsetDate('2023-11-14T22:13:20.123456789', 'utc');
  assert.equal(back.nanos, 1700000000123456789n);
});

test('timestamp: invalid input fails with structured codes', () => {
  for (const [input, code] of [['', 'empty'], ['   ', 'empty'], ['1.5', 'decimal'], ['1e9', 'exponent'], ['1.7E+9', 'exponent'], ['12a', 'format'], ['0x1F', 'format']]) assert.equal(TS.convertTimestamp(input).code, code, input);
  assert.equal(TS.convertTimestamp('1', { unit: 'years' }).code, 'unit');
});

test('timestamp: values outside the Date range return a range error', () => {
  assert.equal(TS.convertTimestamp('8640000000000001', { unit: 'ms' }).code, 'range');
  assert.equal(TS.convertTimestamp('8640000000000000', { unit: 'ms' }).ok, true);
  assert.equal(TS.convertTimestamp('-99999999999999999999', { unit: 's' }).code, 'range');
  assert.equal(TS.convertTimestamp('253402300800', { unit: 's' }).rfc3339, null);
});

test('timestamp: named zones give the right winter and summer offsets', () => {
  const winter = TS.convertTimestamp('1700000000', { timeZone: 'America/New_York' });
  assert.equal(winter.offset, '-05:00');
  assert.match(winter.zoned, /Nov 14, 2023, 17:13:20/);
  const summer = TS.convertTimestamp('1688169600', { timeZone: 'America/New_York' });
  assert.equal(summer.offset, '-04:00');
  assert.equal(TS.convertTimestamp('0', { timeZone: 'Asia/Kolkata' }).offset, '+05:30');
  assert.equal(TS.convertTimestamp('0', { timeZone: 'Mars/Olympus' }).code, 'zone');
  assert.match(TS.convertTimestamp('0').utc, /Jan 1, 1970, 00:00:00 UTC/);
});

test('timestamp: auto detection reports its unit and can be overridden', () => {
  assert.equal(TS.convertTimestamp('1700000000').detected, true);
  const forced = TS.convertTimestamp('1700000000', { unit: 'ms' });
  assert.equal(forced.detected, false);
  assert.equal(forced.iso, '1970-01-20T16:13:20.000Z');
  assert.equal(TS.detectTimestampUnit(-1700000000000n), 'ms');
});

test('timestamp: reverse conversion with UTC, offsets and bad input', () => {
  assert.equal(TS.parseUtcOrOffsetDate('2023-11-14T22:13:20', 'utc').seconds, 1700000000n);
  assert.equal(TS.parseUtcOrOffsetDate('2023-11-15T03:43:20', 'offset', '+05:30').seconds, 1700000000n);
  assert.equal(TS.parseUtcOrOffsetDate('2023-11-14T17:13:20', 'offset', '-0500').seconds, 1700000000n);
  assert.equal(TS.parseUtcOrOffsetDate('2023-11-14T22:13', 'local', '+01:00').code, 'contradiction');
  assert.equal(TS.parseUtcOrOffsetDate('2023-02-30T00:00', 'utc').code, 'date');
  assert.equal(TS.parseUtcOrOffsetDate('2023-11-14T22:13', 'offset', '5:30').code, 'offset');
  assert.equal(TS.parseUtcOrOffsetDate('', 'utc').code, 'empty');
  assert.equal(TS.parseUtcOrOffsetDate('yesterday', 'utc').code, 'format');
});

test('timestamp: batch keeps order and reports line-specific errors', () => {
  const r = TS.convertTimestampBatch('1700000000\n\nabc\n-86400\n1.5\n', { timeZone: 'UTC' });
  assert.equal(r.ok, true);
  assert.deepEqual([...r.rows].map(x => x.line), [1, 3, 4, 5]);
  assert.deepEqual([...r.rows].map(x => x.ok), [true, false, true, false]);
  assert.equal(r.rows[1].code, 'format');
  assert.equal(r.valid, 2);
});

test('timestamp: batch limits are enforced without truncating', () => {
  assert.equal(TS.convertTimestampBatch(Array(501).fill('1').join('\n')).code, 'rows');
  assert.equal(TS.convertTimestampBatch(Array(500).fill('1').join('\n')).rows.length, 500);
  assert.equal(TS.convertTimestampBatch('1'.repeat(100001)).code, 'bytes');
  assert.equal(TS.convertTimestampBatch('').code, 'empty');
});

test('timestamp page: bulk input, dates and offsets are private and persistence is off', async () => {
  const script = await readFile('src/scripts/unix-timestamp-converter.js', 'utf8');
  assert.match(script, /persistence: 'none'/);
  assert.match(script, /share: \{ mode: 'allowlist', fields: \['ts', 'unit', 'zone'\] \}/);
  assert.match(script, /private: \['bulk', 'dt', 'offset'\]/);
  assert.doesNotMatch(script, /localStorage/);
});
