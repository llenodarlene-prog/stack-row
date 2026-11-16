import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = { TextEncoder, TextDecoder, URL, Intl, Date };
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

const { Uuid: U } = context.StackRowDevTools;
const seq = start => { let n = start; return k => Uint8Array.from({ length: k }, () => (n++) & 255); };
const fixed = byte => k => new Uint8Array(k).fill(byte);
const CANON = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test('uuid: v4 layout, version and variant bits', () => {
  const r = U.generateUuidBatch({ version: 'v4', quantity: 50 }, { randomBytes: seq(0) });
  for (const v of r.values) { assert.match(v, CANON); assert.equal(v[14], '4'); assert.match(v[19], /[89ab]/); }
  assert.equal(U.formatUuid(U.generateUuidV4(fixed(0xff))), 'ffffffff-ffff-4fff-bfff-ffffffffffff');
  assert.equal(U.formatUuid(U.generateUuidV4(fixed(0))), '00000000-0000-4000-8000-000000000000');
});

test('uuid: v7 is deterministic for a fixed time and random source', () => {
  const r = U.generateUuidV7(0x0123456789ab, fixed(0), U.createV7State());
  assert.equal(U.formatUuid(r.bytes), '01234567-89ab-7000-8000-000000000000');
  const s = U.generateUuidV7(1700000000000, fixed(0xff), U.createV7State());
  const text = U.formatUuid(s.bytes);
  assert.equal(text[14], '7'); assert.match(text[19], /[89ab]/);
  assert.equal(text, '018bcfe5-6800-77ff-bfff-ffffffffffff');
  assert.equal(U.extractUuidV7Timestamp(text).ms, 1700000000000);
});

test('uuid: v7 sorts by time and stays monotonic within a millisecond', () => {
  const state = U.createV7State();
  let t = 1700000000000;
  const across = U.generateUuidBatch({ version: 'v7', quantity: 20 }, { randomBytes: seq(7), now: () => (t += 1), state }).values;
  assert.deepEqual([...across].sort(), [...across]);
  const same = U.generateUuidBatch({ version: 'v7', quantity: 1000 }, { randomBytes: seq(3), now: () => 1800000000000, state: U.createV7State() }).values;
  assert.equal(new Set(same).size, 1000);
  assert.deepEqual([...same].sort(), [...same]);
  const back = U.createV7State();
  const a = U.formatUuid(U.generateUuidV7(1800000000005, seq(1), back).bytes);
  const b = U.formatUuid(U.generateUuidV7(1800000000001, seq(1), back).bytes);
  assert.ok(b > a, 'a clock step backwards keeps order');
});

test('uuid: counter exhaustion returns an error instead of wrapping', () => {
  const state = U.createV7State();
  const r = U.generateUuidBatch({ version: 'v7', quantity: 1000 }, { randomBytes: fixed(0xff), now: () => 1800000000000, state });
  assert.equal(r.ok, true);
  const more = [];
  let last;
  for (let i = 0; i < 4000; i += 1) { last = U.generateUuidV7(1800000000000, fixed(0xff), state); if (!last.ok) break; more.push(U.formatUuid(last.bytes)); }
  assert.equal(last.code, 'exhausted');
  assert.deepEqual([...more].sort(), more);
  const all = [...r.values, ...more];
  assert.equal(new Set(all).size, all.length);
});

test('uuid: formatting options change presentation, not bits', () => {
  const bytes = U.generateUuidV7(1700000000000, fixed(0x12), U.createV7State()).bytes;
  const plain = U.formatUuid(bytes);
  const fancy = U.formatUuid(bytes, { upper: true, hyphens: false, braces: true });
  assert.equal(fancy, `{${plain.replaceAll('-', '').toUpperCase()}}`);
  assert.equal(U.inspectUuid(fancy).canonical, plain);
});

test('uuid: validator normalizes accepted forms and names special values', () => {
  const canonical = '019a8c2e-1234-7abc-8def-0123456789ab';
  for (const form of [canonical, canonical.toUpperCase(), `{${canonical}}`, canonical.replaceAll('-', ''), `urn:uuid:${canonical}`]) {
    const r = U.inspectUuid(form);
    assert.equal(r.ok, true, form); assert.equal(r.canonical, canonical); assert.equal(r.version, 7);
  }
  assert.equal(U.inspectUuid(canonical).alternate, false);
  assert.equal(U.inspectUuid(`{${canonical}}`).alternate, true);
  assert.equal(U.inspectUuid('00000000-0000-0000-0000-000000000000').special, 'Nil UUID');
  assert.equal(U.inspectUuid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF').special, 'Max UUID');
});

test('uuid: malformed input gets specific errors', () => {
  const cases = [['', 'empty'], ['019a8c2e-1234-7abc-8def-0123456789a', 'length'], ['019a8c2e-1234-7abc-8def-0123456789ag', 'hex'], ['019a8c2e1-234-7abc-8def-0123456789ab', 'hyphens'], ['019a8c2e-1234-fabc-8def-0123456789ab', 'version'], ['019a8c2e-1234-0abc-8def-0123456789ab', 'version'], ['019a8c2e-1234-7abc-cdef-0123456789ab', 'variant'], ['019a8c2e-1234-7abc-0def-0123456789ab', 'variant'], ['{019a8c2e-1234-7abc-8def-0123456789ab', 'braces']];
  for (const [input, code] of cases) assert.equal(U.inspectUuid(input).code, code, input);
});

test('uuid: quantity limits', () => {
  const deps = { randomBytes: seq(0) };
  for (const q of [0, -1, 2.5, 1001, NaN]) assert.equal(U.generateUuidBatch({ quantity: q }, deps).code, 'quantity', String(q));
  assert.equal(U.generateUuidBatch({ quantity: 1000 }, deps).values.length, 1000);
  assert.equal(U.generateUuidBatch({ quantity: 1 }, {}).code, 'random');
});

test('uuid: no Math.random, no storage, no share links', async () => {
  const logic = await readFile('src/scripts/developer-tool-formulas.js', 'utf8');
  const page = await readFile('src/scripts/uuid-generator.js', 'utf8');
  assert.doesNotMatch(logic.replace(/\/\/.*$/gm, ''), /Math\.random/);
  assert.doesNotMatch(page.replace(/\/\/.*$/gm, ''), /Math\.random|localStorage/);
  assert.match(page, /persistence: 'none', share: \{ mode: 'disabled' \}, restore: false/);
});

const { Url: URLT } = context.StackRowDevTools;

test('url: ASCII and Unicode round trips', () => {
  for (const text of ['hello world', 'café menu/2026?size=large & hot', '😀 東京 ñ', "a-_.!~*'()b"]) {
    const enc = URLT.encodeUrlComponent(text);
    assert.equal(URLT.decodeUrlComponent(enc.value).value, text);
    const form = URLT.encodeFormValue(text);
    assert.equal(URLT.decodeUrlComponent(form.value, { form: true }).value, text);
  }
  assert.equal(URLT.encodeUrlComponent('café menu/2026?size=large & hot').value, 'caf%C3%A9%20menu%2F2026%3Fsize%3Dlarge%20%26%20hot');
});

test('url: spaces and plus signs differ by mode', () => {
  assert.equal(URLT.encodeUrlComponent('a b').value, 'a%20b');
  assert.equal(URLT.encodeUrlComponent('a b', { spaces: '+' }).value, 'a+b');
  assert.equal(URLT.encodeFormValue('a b').value, 'a+b');
  assert.equal(URLT.decodeUrlComponent('a+b').value, 'a+b');
  assert.equal(URLT.decodeUrlComponent('a+b', { form: true }).value, 'a b');
  assert.equal(URLT.encodeUrlComponent('1+1').value, '1%2B1');
});

test('url: reserved delimiters and form-safe characters', () => {
  assert.equal(URLT.encodeUrlComponent('/?#[]@!$&=+,;:').value, '%2F%3F%23%5B%5D%40!%24%26%3D%2B%2C%3B%3A');
  assert.equal(URLT.encodeFormValue("*-._~!'()").value, "*-._%7E%21%27%28%29");
  assert.equal(URLT.encodeUrlComponent('a b', { upper: false, spaces: '%20' }).value, 'a%20b');
  assert.equal(URLT.encodeUrlComponent('/', { upper: false }).value, '%2f');
});

test('url: existing triplets are not double-encoded unless requested', () => {
  assert.equal(URLT.encodeUrlComponent('100%25 sure').value, '100%25%20sure');
  assert.equal(URLT.encodeUrlComponent('100%25', { preserveEncoded: false }).value, '100%2525');
  assert.equal(URLT.encodeUrlComponent('50% off').value, '50%25%20off');
});

test('url: invalid triplets and malformed UTF-8 fail specifically', () => {
  const t = URLT.decodeUrlComponent('100%');
  assert.equal(t.code, 'triplet'); assert.equal(t.index, 3);
  assert.equal(URLT.decodeUrlComponent('%G1').code, 'triplet');
  assert.equal(URLT.decodeUrlComponent('%E2%82').code, 'utf8');
  assert.equal(URLT.decodeUrlComponent('%FF').code, 'utf8');
  assert.equal(URLT.encodeUrlComponent('\uD800').code, 'utf8');
});

test('url: duplicate keys keep order and fragments stay out of the query', () => {
  const r = URLT.parseQueryPairs('https://x.test/p?tag=a&b=two+words&tag=c#frag=1&z=2');
  assert.deepEqual([...r.pairs].map(p => `${p.key}=${p.value}`), ['tag=a', 'b=two words', 'tag=c']);
  const rebuilt = URLT.rebuildUrl('https://x.test/p?tag=a&b=two+words&tag=c#frag=1', r.pairs);
  assert.equal(rebuilt.value, 'https://x.test/p?tag=a&b=two+words&tag=c#frag=1');
  assert.equal(URLT.rebuildUrl('a=1&b=2', [{ key: 'b', value: '2' }, { key: 'a', value: '1 1' }], { spaces: '%20' }).value, 'b=2&a=1%201');
  assert.equal(URLT.parseQueryPairs(Array(1001).fill('a=1').join('&')).code, 'pairs');
});

test('url: full URL parsing masks credentials and needs a scheme', () => {
  const r = URLT.parseUrlForDisplay('https://user:secret@example.com:8443/p/a?x=1&x=2#top');
  assert.equal(r.hasPassword, true);
  assert.doesNotMatch(JSON.stringify(r), /secret/);
  assert.equal(r.hostname, 'example.com'); assert.equal(r.port, '8443'); assert.equal(r.hash, '#top');
  assert.equal(r.pairs.length, 2);
  assert.equal(URLT.parseUrlForDisplay('example.com/page').code, 'scheme');
  assert.equal(URLT.parseUrlForDisplay('https://exa mple.com').code, 'url');
  assert.equal(URLT.parseUrlForDisplay('').code, 'empty');
});

test('url page: no storage, no share links, no fetching, no innerHTML', async () => {
  const page = await readFile('src/scripts/url-encoder-decoder.js', 'utf8');
  assert.match(page, /persistence: 'none', share: \{ mode: 'disabled' \}, restore: false/);
  assert.doesNotMatch(page, /localStorage|innerHTML|fetch\(|XMLHttpRequest/);
});

const { Xml: X } = context.StackRowDevTools;

test('xml: declaration, namespaces, comments, CDATA and PIs survive formatting', () => {
  const doc = '<?xml version="1.0" encoding="UTF-8"?><!-- c --><?app go?><r xmlns:p="urn:p"><p:a z="1" a=\'2\'/><b><![CDATA[<x> & y]]></b><?pi data?></r>';
  const f = X.formatXml(doc).value;
  for (const part of ['<?xml version="1.0" encoding="UTF-8"?>', '<!-- c -->', '<?app go?>', 'xmlns:p="urn:p"', '<p:a z="1" a=\'2\'/>', '<![CDATA[<x> & y]]>', '<?pi data?>']) assert.ok(f.includes(part), part);
  assert.equal(X.formatXml(doc, { keepComments: false }).value.includes('<!-- c -->'), false);
});

test('xml: element and attribute order are unchanged and indentation is applied', () => {
  const f = X.formatXml('<r><c b="2" a="1"/><a/><b>t</b></r>', { indent: '  ' }).value;
  assert.equal(f, '<r>\n  <c b="2" a="1"/>\n  <a/>\n  <b>t</b>\n</r>\n');
  assert.equal(X.formatXml('<r><a/></r>', { indent: '\t' }).value, '<r>\n\t<a/>\n</r>\n');
  assert.equal(X.minifyXml('<r>\n  <a/>\n  <b> x </b>\n</r>').value, '<r><a/><b> x </b></r>');
});

test('xml: mixed content and xml:space whitespace is preserved', () => {
  const mixed = '<p>Hello  <b>bold</b>  world</p>';
  assert.equal(X.formatXml(`<r>${mixed}</r>`).value, `<r>\n  ${mixed}\n</r>\n`);
  assert.ok(X.minifyXml(`<r>${mixed}</r>`).value.includes(mixed));
  const pre = '<code xml:space="preserve">\n  a\n    b\n</code>';
  assert.ok(X.formatXml(`<r>${pre}</r>`).value.includes(pre));
  assert.ok(X.minifyXml(`<r>${pre}</r>`).value.includes(pre));
});

test('xml: malformed documents report line and column', () => {
  const r = X.parseXmlSafely('<a>\n  <b>\n</a>');
  assert.equal(r.code, 'mismatch'); assert.equal(r.line, 3); assert.equal(r.column, 1); assert.ok(r.hint);
  const cases = [['<a><b></a>', 'mismatch'], ['<a>', 'unclosed'], ['<a/><b/>', 'roots'], ['<a x=1/>', 'attribute'], ['<a b="1" b="2"/>', 'duplicate'], ['<1a/>', 'name'], ['<p:a/>', 'namespace'], ['<a>&nbsp;</a>', 'entity'], ['<a>&#0;</a>', 'charref'], ['<a>&#xD800;</a>', 'charref'], ['x<a/>', 'text'], [' <?xml version="1.0"?><a/>', 'declaration'], ['', 'empty'], ['<a>\u0001</a>', 'char'], ['<a><!-- a -- b --></a>', 'syntax'], ['<a>5 < 6</a>', 'syntax']];
  for (const [input, code] of cases) assert.equal(X.parseXmlSafely(input).code, code, input);
});

test('xml: external declarations and entity expansion are rejected without network access', async () => {
  const xxe = '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]><r>&x;</r>';
  const lol = '<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;">]><lolz>&lol2;</lolz>';
  const ext = '<!DOCTYPE r SYSTEM "http://example.com/evil.dtd"><r/>';
  for (const doc of [xxe, lol, ext]) assert.equal(X.parseXmlSafely(doc).code, 'doctype');
  assert.equal(X.parseXmlSafely('<!DOCTYPE note><note/>').ok, true);
  const logic = await readFile('src/scripts/developer-tool-formulas.js', 'utf8');
  const xmlPart = logic.slice(logic.indexOf('// ---------------------------------------------------------------------- XML'));
  assert.doesNotMatch(xmlPart, /fetch\(|XMLHttpRequest|DOMParser|import\(/);
});

test('xml: depth, node and size limits stop processing', () => {
  const deep = '<a>'.repeat(300) + '</a>'.repeat(300);
  assert.equal(X.parseXmlSafely(deep).code, 'depth');
  assert.equal(X.parseXmlSafely('<a>'.repeat(5) + '</a>'.repeat(5), { maxDepth: 4 }).code, 'depth');
  assert.equal(X.parseXmlSafely(`<r>${'<i/>'.repeat(20)}</r>`, { maxNodes: 10 }).code, 'nodes');
  assert.equal(X.parseXmlSafely(`<r>${'x'.repeat(1048577)}</r>`).code, 'bytes');
});

test('xml: tree labels keep hostile markup as plain text and stay bounded', () => {
  const r = X.parseXmlSafely('<r a="&lt;img src=x onerror=alert(1)&gt;"><![CDATA[<script>alert(1)</script>]]></r>');
  const model = X.buildXmlTreeModel(r.document);
  assert.equal(model.roots[0].label, '<r a="<img src=x onerror=alert(1)>">');
  assert.equal(model.roots[0].children[0].label, 'CDATA: <![CDATA[<script>alert(1)</script>]]>');
  const big = X.parseXmlSafely(`<r>${'<i/>'.repeat(2000)}</r>`);
  const bounded = X.buildXmlTreeModel(big.document, { maxTreeNodes: 100 });
  assert.equal(bounded.count, 100); assert.equal(bounded.truncated, true);
});

test('xml page: XML download type, no storage, no share links, text-only rendering', async () => {
  const page = await readFile('src/scripts/xml-formatter-validator.js', 'utf8');
  assert.match(page, /mime: 'application\/xml;charset=utf-8', extension: 'xml'/);
  assert.match(page, /persistence: 'none', share: \{ mode: 'disabled' \}, restore: false/);
  assert.doesNotMatch(page, /localStorage|innerHTML|insertAdjacentHTML|DOMParser|fetch\(/);
});

const { Json: J } = context.StackRowDevTools;

test('json: every value type, escapes, Unicode, exponents and negative zero', () => {
  for (const text of ['0', '-0', '1.5e-3', '2E+10', '"plain"', 'true', 'false', 'null', '[]', '{}', '"\\u00e9\\n\\t\\"\\\\\\/"', '"東京 😀"', '{"a":[1,{"b":null}]}']) {
    const r = J.parseJsonWithDiagnostics(text);
    assert.equal(r.ok, true, text);
  }
  assert.equal(J.parseJsonWithDiagnostics('"\\u00e9\\n"').root.value, 'é\n');
  assert.equal(J.formatJson('[-0,1.50,1e5]', { minify: true }).value, '[-0,1.50,1e5]');
});

test('json: common mistakes fail with specific codes and positions', () => {
  const cases = [['{"a":1,}', 'trailing'], ['[1,2,]', 'trailing'], ["{'a':1}", 'quote'], ['{a:1}', 'key'], ['{"a":1} // c', 'comment'], ['[1, /* x */ 2]', 'comment'], ['"\\x"', 'escape'], ['"\\u12G4"', 'escape'], ['{"a":', 'truncated'], ['"abc', 'truncated'], ['[01]', 'number'], ['[+1]', 'unexpected'], ['[1.]', 'number'], ['"a\tb"', 'control'], ['True', 'literal'], ['NaN', 'number'], ['1 2', 'extra'], ['', 'empty'], ['{"a" 1}', 'unexpected']];
  for (const [input, code] of cases) assert.equal(J.parseJsonWithDiagnostics(input).code, code, input);
  const r = J.parseJsonWithDiagnostics('{\n  "a": 1,\n}');
  assert.equal(r.line, 3); assert.equal(r.column, 1); assert.equal(r.index, 12); assert.ok(r.hint);
});

test('json: duplicate names are reported and kept', () => {
  const r = J.formatJson('{"id":1,"x":{"id":2},"id":3}', { minify: true });
  assert.equal(r.warnings.duplicates.length, 1);
  assert.equal(r.warnings.duplicates[0].key, 'id');
  assert.equal(r.warnings.duplicates[0].path, '$');
  assert.equal(r.value, '{"id":1,"x":{"id":2},"id":3}');
});

test('json: unsafe integers and extreme exponents warn and keep their digits', () => {
  const r = J.formatJson('[9007199254740993,-9007199254740993,9007199254740991,1e400,1e-400]', { minify: true });
  assert.equal(r.warnings.unsafe.length, 2);
  assert.equal(r.warnings.extreme.length, 2);
  assert.equal(r.value, '[9007199254740993,-9007199254740993,9007199254740991,1e400,1e-400]');
});

test('json: depth, node and size caps', () => {
  assert.equal(J.parseJsonWithDiagnostics('['.repeat(300) + ']'.repeat(300)).code, 'depth');
  assert.equal(J.parseJsonWithDiagnostics(`[${Array(50).fill(1).join(',')}]`, { maxNodes: 10 }).code, 'nodes');
  assert.equal(J.parseJsonWithDiagnostics(`"${'x'.repeat(1048577)}"`).code, 'bytes');
});

test('json: sorting keys leaves arrays unchanged', () => {
  assert.equal(J.sortJsonKeys('{"b":[3,1,2],"a":{"d":1,"c":2}}', { minify: true }).value, '{"a":{"c":2,"d":1},"b":[3,1,2]}');
  assert.equal(J.formatJson('{"b":1,"a":2}', { indent: '\t' }).value, '{\n\t"b": 1,\n\t"a": 2\n}\n');
});

test('json: tree model keeps hostile text as plain strings and stays bounded', () => {
  const r = J.parseJsonWithDiagnostics('{"<img src=x onerror=alert(1)>":"<script>alert(1)</script>","list":[1,2]}');
  const model = J.buildJsonTreeModel(r.root);
  assert.equal(model.root.children[0].key, '<img src=x onerror=alert(1)>');
  assert.equal(model.root.children[0].summary, '"<script>alert(1)</script>"');
  assert.equal(model.root.children[1].children[1].path, '$.list[1]');
  assert.equal(model.root.children[0].path, '$["<img src=x onerror=alert(1)>"]');
  const big = J.parseJsonWithDiagnostics(`[${Array(3000).fill(0).join(',')}]`);
  assert.equal(J.buildJsonTreeModel(big.root, { maxTreeNodes: 100 }).truncated, true);
});

test('json: CSV conversion rules', () => {
  const r = J.jsonArrayToCsv('[{"a":1,"b":"x,y"},{"b":"line1\\nline2","c":null},{"a":"=SUM(A1)","d":"-5"}]');
  assert.equal(r.value, 'a,b,c,d\r\n1,"x,y",,\r\n,"line1\nline2",,\r\n"\'=SUM(A1)",,,"\'-5"');
  assert.deepEqual([...r.columns], ['a', 'b', 'c', 'd']);
  assert.equal(r.protectedCells, 2);
  assert.equal(J.jsonArrayToCsv('[{"a":{"x":1}}]').code, 'csv-nested');
  assert.equal(J.jsonArrayToCsv('[{"a":{"x":1}}]', { nested: 'json' }).value, 'a\r\n"{""x"":1}"');
  assert.equal(J.jsonArrayToCsv('{"a":1}').code, 'csv-shape');
  assert.equal(J.jsonArrayToCsv('[1,2]').code, 'csv-shape');
  assert.equal(J.jsonArrayToCsv('[]').code, 'csv-shape');
  assert.equal(J.jsonArrayToCsv(`[${Array(11).fill('{"a":1}').join(',')}]`, { limits: { maxCsvRows: 10 } }).code, 'csv-rows');
  assert.equal(J.jsonArrayToCsv('[{"a":1,"b":2,"c":3}]', { limits: { maxCsvColumns: 2 } }).code, 'csv-columns');
});

test('json page: native file types, no eval, no storage, no share links', async () => {
  const page = await readFile('src/scripts/json-validator-formatter.js', 'utf8');
  const logic = await readFile('src/scripts/developer-tool-formulas.js', 'utf8');
  assert.match(page, /mime: 'application\/json;charset=utf-8', extension: 'json'/);
  assert.match(page, /mime: 'text\/csv;charset=utf-8', extension: 'csv'/);
  assert.match(page, /persistence: 'none', share: \{ mode: 'disabled' \}, restore: false/);
  assert.doesNotMatch(page, /localStorage|innerHTML|eval\(|new Function|JSON\.parse/);
  assert.doesNotMatch(logic.replace(/\/\/.*$/gm, ''), /eval\(|new Function|JSON\.parse/);
});
