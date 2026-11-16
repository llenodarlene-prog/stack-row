import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = { TextEncoder, JSON, Intl, Date };
vm.createContext(context);
for (const file of ['src/scripts/vendor/js-yaml.min.js', 'src/scripts/eff-wordlist.js', 'src/scripts/utility-tool-formulas.js']) vm.runInContext(await readFile(file, 'utf8'), context);
const { Passphrase: P, Yaml: Y, Uptime: U, Cron: C } = context.StackRowUtilityTools;
const yaml = context.jsyaml;
const W = context.StackRowWordlist;
const seq = start => { let n = start; return k => Uint8Array.from({ length: k }, () => (n++) & 255); };
const near = (a, b, d = 2) => assert.equal(Number(a.toFixed(d)), b);

test('passphrase: EFF list, word counts, separators and options', () => {
  assert.equal(W.length, 7776); assert.equal(new Set(W).size, 7776);
  const r = P.generatePassphrase({ words: 6, separator: 'hyphen' }, { wordlist: W, randomBytes: seq(1) });
  assert.equal(r.words.length, 6); assert.ok(r.value.split('-').length >= 6);
  const cap = P.generatePassphrase({ words: 4, separator: 'space', capitalize: 'first', addNumber: true }, { wordlist: W, randomBytes: seq(9) });
  assert.ok(cap.words.every(w => /^[A-Z]/.test(w))); assert.equal(cap.words.filter(w => /\d$/.test(w)).length, 1);
  for (const words of [2, 13, 6.5]) assert.equal(P.generatePassphrase({ words }, { wordlist: W, randomBytes: seq(0) }).code, 'words');
  assert.equal(P.generatePassphrases({ words: 6, count: 51 }, { wordlist: W, randomBytes: seq(0) }).code, 'count');
  assert.equal(P.generatePassphrase({ words: 6 }, { wordlist: W }).code, 'random');
});

test('passphrase: rejection sampling is unbiased and entropy is counted correctly', () => {
  // 2^32 is not a multiple of 7776, so values at the top of the range must be rejected.
  const top = [255, 255, 255, 255]; const ok = [0, 0, 0, 5];
  let calls = 0; const rb = () => Uint8Array.from(calls++ === 0 ? top : ok);
  assert.equal(P.randomIndex(7776, rb), 5); assert.equal(calls, 2);
  near(P.passphraseEntropy({ words: 6, listSize: 7776 }), 77.55);
  near(P.passphraseEntropy({ words: 6, listSize: 7776, capitalize: 'random' }), 83.55);
  near(P.passphraseEntropy({ words: 6, listSize: 7776, capitalize: 'first', addNumber: true }), 83.46);
  assert.equal(P.strengthBand(77.5), 'Strong');
});

test('passphrase: no Math.random and no storage', async () => {
  const logic = (await readFile('src/scripts/utility-tool-formulas.js', 'utf8')).replace(/\/\/.*$/gm, '');
  const page = (await readFile('src/scripts/passphrase-generator.js', 'utf8')).replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(logic + page, /Math\.random|localStorage/);
  assert.match(page, /persistence: 'none', share: \{ mode: 'disabled' \}, restore: false/);
});

test('yaml: format, validate and convert', () => {
  assert.equal(Y.formatYaml('a: 1\nb: [1, 2]\nc: {x: y}\n', yaml).value, "a: 1\nb:\n  - 1\n  - 2\nc:\n  x: 'y'\n");
  assert.equal(Y.formatYaml('b: 1\na: 2\n', yaml, { sortKeys: true }).value, 'a: 2\nb: 1\n');
  assert.equal(Y.formatYaml('a:\n  b: 1\n', yaml, { indent: 4 }).value, 'a:\n    b: 1\n');
  assert.equal(Y.yamlToJson('a: yes\nb: true\nc: 2026-11-16\nd: ~\n', yaml).value, '{\n  "a": "yes",\n  "b": true,\n  "c": "2026-11-16",\n  "d": null\n}\n');
  assert.equal(Y.jsonToYaml('{"a":[1,{"b":"x"}]}', yaml).value, 'a:\n  - 1\n  - b: x\n');
  assert.equal(Y.jsonToYaml('{bad}', yaml).code, 'json');
  const multi = Y.yamlToJson('a: 1\n---\nb: 2\n', yaml);
  assert.equal(multi.stats.documents, 2); assert.equal(multi.value, '[\n  {\n    "a": 1\n  },\n  {\n    "b": 2\n  }\n]\n');
  assert.equal(Y.formatYaml('# note\na: 1\n', yaml).hasComments, true);
  assert.equal(Y.yamlToJson('d: &d {a: 1, b: 2}\np:\n  <<: *d\n  b: 5\n', yaml).value, '{\n  "d": {\n    "a": 1,\n    "b": 2\n  },\n  "p": {\n    "a": 1,\n    "b": 5\n  }\n}\n');
});

test('yaml: errors carry line and column; unsafe tags and alias bombs are refused', () => {
  const r = Y.parseYamlSafely('a: [1\nb: 2', yaml);
  assert.equal(r.code, 'syntax'); assert.equal(r.line, 2); assert.ok(r.column >= 1);
  assert.equal(Y.parseYamlSafely('a:\n\tb: 1', yaml).code, 'syntax');
  assert.equal(Y.parseYamlSafely('x: !!js/function "function(){}"', yaml).code, 'syntax');
  const bomb = ['a: &a [x,x,x,x,x,x,x,x,x,x]', ...'bcde'.split('').map((k, i) => `${k}: &${k} [${Array(10).fill(`*${'abcde'[i]}`).join(',')}]`), `f: [${Array(10).fill('*e').join(',')}]`].join('\n');
  assert.equal(Y.formatYaml(bomb, yaml).code, 'nodes');
  assert.equal(Y.parseYamlSafely('', yaml).code, 'empty');
  assert.equal(Y.parseYamlSafely(`a: "${'x'.repeat(1048577)}"`, yaml).code, 'bytes');
  assert.equal(Y.parseYamlSafely('a: ' + '['.repeat(150) + ']'.repeat(150), yaml).code, 'depth');
});

test('uptime: allowed downtime, availability and error budgets', () => {
  const s = U.allowedDowntime(99.9).seconds;
  near(s.day, 86.4); near(s.year, 31556.95); near(s.month, 2629.75);
  assert.equal(U.formatDuration(s.month), '43m 50s');
  assert.equal(U.formatDuration(U.allowedDowntime(99.999).seconds.day), '864 ms');
  near(U.availabilityFromDowntime(2629.746, U.PERIODS.month).pct, 99.9, 4);
  assert.equal(U.availabilityFromDowntime(10, 5).code, 'downtime');
  assert.equal(U.allowedDowntime(101).code, 'sla');
  const b = U.errorBudget(99.9, U.PERIODS.month, 1800);
  near(b.remaining, 829.75); near(b.consumedPct, 68.45);
  assert.ok(U.errorBudget(100, U.PERIODS.month, 10).consumedPct === Infinity);
});

test('uptime: incidents, series and redundancy', () => {
  const r = U.availabilityFromIncidents(3, 1800, U.PERIODS.month);
  near(r.pct, 99.79, 2); assert.equal(r.downSeconds, 5400);
  near(U.serialAvailability([99.9, 99.9, 99.9]), 99.7, 2);
  near(U.parallelAvailability(99, 2), 99.99, 4);
  assert.equal(U.availabilityFromIncidents(1000, 86400, U.PERIODS.month).code, 'incidents');
});

const zone = tz => { const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' }); const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return ms => { const o = {}; for (const p of f.formatToParts(ms)) o[p.type] = p.value; return { year: +o.year, month: +o.month, day: +o.day, hour: +o.hour % 24, minute: +o.minute, weekday: D.indexOf(o.weekday) }; }; };

test('cron: parsing, shortcuts, names and errors', () => {
  const p = C.parseCron('*/15 9-17 * * MON-FRI');
  assert.deepEqual([...p.fields[0].values], [0, 15, 30, 45]);
  assert.deepEqual([...p.fields[4].values], [1, 2, 3, 4, 5]);
  assert.equal(C.parseCron('@daily').expression, '0 0 * * *');
  assert.deepEqual([...C.parseCron('0 0 * * 7').fields[4].values], [0]);
  assert.deepEqual([...C.parseCron('0 0 * JAN-MAR *').fields[3].values], [1, 2, 3]);
  for (const [expr, code] of [['', 'empty'], ['* * * *', 'fields'], ['0 * * * * *', 'fields'], ['60 * * * *', 'field'], ['* 5-2 * * *', 'field'], ['*/0 * * * *', 'field'], ['@reboot', 'reboot'], ['@sometimes', 'macro'], ['1,,2 * * * *', 'field']]) assert.equal(C.parseCron(expr).code, code, expr);
});

test('cron: plain-English descriptions', () => {
  assert.equal(C.describeCron(C.parseCron('*/15 9-17 * * MON-FRI')), 'At minute 0, 15, 30 and 45 past hour 9 to 17, on Monday to Friday.');
  assert.equal(C.describeCron(C.parseCron('* * * * *')), 'Every minute.');
  assert.equal(C.describeCron(C.parseCron('0 9 * * *')), 'At 09:00.');
  assert.equal(C.describeCron(C.parseCron('0 0 1,15 * 5')), 'At 00:00, on day 1 and 15 of the month or on Friday.');
});

test('cron: next runs in UTC and in a zone, with OR day semantics', () => {
  const from = Date.UTC(2026, 10, 14, 12, 0); // Saturday 14 Nov 2026 12:00 UTC
  const ny = C.nextCronRuns(C.parseCron('*/15 9-17 * * MON-FRI'), { from, zoneParts: zone('America/New_York') });
  assert.equal(new Date(ny[0]).toISOString(), '2026-11-16T14:00:00.000Z');
  const utc = C.nextCronRuns(C.parseCron('0 0 1 * MON'), { from, count: 3, zoneParts: zone('UTC') });
  assert.deepEqual([...utc].map(t => new Date(t).toISOString().slice(0, 10)), ['2026-11-16', '2026-11-23', '2026-11-30']);
  assert.equal(C.nextCronRuns(C.parseCron('0 0 30 2 *'), { from, zoneParts: zone('UTC'), maxHours: 24 * 400 }).length, 0);
  // 02:30 does not exist in New York on 8 March 2026, so that day is skipped.
  const gap = C.nextCronRuns(C.parseCron('30 2 * * *'), { from: Date.UTC(2026, 2, 7, 12, 0), count: 2, zoneParts: zone('America/New_York') });
  assert.deepEqual([...gap].map(t => new Date(t).toISOString()), ['2026-03-09T06:30:00.000Z', '2026-03-10T06:30:00.000Z']);
});
