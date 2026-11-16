// Pure logic for Stack Row developer utilities. No DOM access, so the same
// functions run in the browser and in tests. Every function returns a plain
// result object ({ ok: true, ... } or { ok: false, code, message }) instead of
// throwing for bad input.
(function (root) {
  'use strict';
  const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });

  // ---------------------------------------------------------------- Timestamp
  // Unix time: seconds since 1970-01-01T00:00:00Z, ignoring leap seconds
  // (POSIX). Values are parsed as BigInt so microseconds and nanoseconds stay
  // exact; a JavaScript Date is created only after the range check.
  const UNITS = { s: { label: 'Seconds', ns: 1000000000n }, ms: { label: 'Milliseconds', ns: 1000000n }, us: { label: 'Microseconds', ns: 1000n }, ns: { label: 'Nanoseconds', ns: 1n } };
  const MAX_DATE_MS = 8640000000000000n; // ECMAScript time value limit (±100,000,000 days)
  const floorDiv = (a, b) => { const q = a / b; return (a % b !== 0n && (a < 0n) !== (b < 0n)) ? q - 1n : q; };

  function parseTimestampInteger(value) {
    const text = String(value ?? '').trim();
    if (!text) return fail('empty', 'Enter a timestamp.');
    if (text.length > 40) return fail('length', 'Use a timestamp of 40 characters or fewer.');
    if (/^[+-]?\d+$/.test(text)) return { ok: true, value: BigInt(text.replace(/^\+/, '')) };
    if (/^[+-]?\d*\.\d+$/.test(text)) return fail('decimal', 'Use a whole number. Decimal timestamps are not exact; pick a smaller unit instead, such as milliseconds.');
    if (/^[+-]?\d+(\.\d+)?e[+-]?\d+$/i.test(text)) return fail('exponent', 'Write the full number without exponent notation, such as 1700000000 instead of 1.7e9.');
    return fail('format', 'Use digits only, with an optional minus sign for dates before 1970.');
  }

  // A heuristic based on size. Present-day values have 10 digits in seconds,
  // 13 in milliseconds, 16 in microseconds and 19 in nanoseconds.
  function detectTimestampUnit(value) {
    const abs = value < 0n ? -value : value;
    if (abs < 100000000000n) return 's';
    if (abs < 100000000000000n) return 'ms';
    if (abs < 100000000000000000n) return 'us';
    return 'ns';
  }

  function toEpochParts(value, unit) {
    if (!UNITS[unit]) return fail('unit', 'Choose seconds, milliseconds, microseconds, or nanoseconds.');
    const nanos = value * UNITS[unit].ns;
    const ms = floorDiv(nanos, 1000000n);
    const remainderNs = nanos - ms * 1000000n;
    if (ms > MAX_DATE_MS || ms < -MAX_DATE_MS) return fail('range', 'This timestamp is outside the range a browser can display (about 271,821 BC to AD 275,760). Check the unit.');
    return { ok: true, unit, nanos, ms: Number(ms), remainderNs: Number(remainderNs), seconds: floorDiv(nanos, 1000000000n), milliseconds: ms, microseconds: floorDiv(nanos, 1000n) };
  }

  function validZone(zone) {
    if (zone === 'local') return true;
    try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); return true; } catch { return false; }
  }

  // RFC 3339 allows four-digit years only, so years before 0000 or after 9999 have no RFC 3339 form.
  function rfc3339(parts) {
    const date = new Date(parts.ms);
    const year = date.getUTCFullYear();
    if (year < 0 || year > 9999) return null;
    const nanosOfSecond = Number(((parts.nanos % 1000000000n) + 1000000000n) % 1000000000n);
    let fraction = String(nanosOfSecond).padStart(9, '0');
    fraction = fraction.endsWith('000000') ? fraction.slice(0, 3) : fraction.endsWith('000') ? fraction.slice(0, 6) : fraction;
    return `${date.toISOString().slice(0, 19)}${fraction === '000' ? '' : `.${fraction}`}Z`;
  }

  function zoneOffset(ms, zone) {
    if (zone === 'local') { const minutes = -new Date(ms).getTimezoneOffset(); return formatOffset(minutes); }
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(new Date(ms)).find(p => p.type === 'timeZoneName')?.value || 'GMT';
    return part === 'GMT' ? '+00:00' : part.replace('GMT', '');
  }
  const formatOffset = minutes => `${minutes < 0 ? '-' : '+'}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`;
  const human = (ms, zone) => new Intl.DateTimeFormat('en-US', { ...(zone === 'local' ? {} : { timeZone: zone }), weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(new Date(ms));

  function formatTimestamp(value, unit, timeZone = 'UTC') {
    if (!validZone(timeZone)) return fail('zone', 'Choose a time zone from the list, such as America/New_York or UTC.');
    const parts = toEpochParts(value, unit);
    if (!parts.ok) return parts;
    return {
      ok: true, ...parts,
      utc: human(parts.ms, 'UTC'),
      zoned: human(parts.ms, timeZone),
      offset: zoneOffset(parts.ms, timeZone),
      iso: new Date(parts.ms).toISOString(),
      rfc3339: rfc3339(parts)
    };
  }

  // Converts one input with Auto or a chosen unit.
  function convertTimestamp(text, { unit = 'auto', timeZone = 'UTC' } = {}) {
    const parsed = parseTimestampInteger(text);
    if (!parsed.ok) return parsed;
    const chosen = unit === 'auto' ? detectTimestampUnit(parsed.value) : unit;
    const result = formatTimestamp(parsed.value, chosen, timeZone);
    return result.ok ? { ...result, input: parsed.value, detected: unit === 'auto' } : result;
  }

  // Reverse conversion. A datetime-local value has no offset, so it is read
  // as UTC, as browser-local time, or with an explicit numeric offset.
  function parseUtcOrOffsetDate(input, interpretation = 'utc', offset = '') {
    const text = String(input ?? '').trim();
    if (!text) return fail('empty', 'Enter a date and time.');
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/.exec(text);
    if (!m) return fail('format', 'Use the date picker, or type YYYY-MM-DDTHH:MM:SS.');
    const [, y, mo, d, h, mi, s = '0', frac = ''] = m;
    const fields = [+y, +mo, +d, +h, +mi, +s];
    const offsetText = String(offset ?? '').trim();
    if (interpretation === 'local' && offsetText) return fail('contradiction', 'Clear the offset, or choose "Explicit offset". Browser local time already sets its own offset.');
    if (!['utc', 'local', 'offset'].includes(interpretation)) return fail('interpretation', 'Choose UTC, browser local time, or an explicit offset.');
    const utcGuess = Date.UTC(fields[0], fields[1] - 1, fields[2], fields[3], fields[4], fields[5]);
    const check = new Date(utcGuess);
    if (fields[1] < 1 || fields[1] > 12 || check.getUTCDate() !== fields[2] || check.getUTCHours() !== fields[3] || check.getUTCMinutes() !== fields[4] || fields[5] > 59) return fail('date', 'This date or time does not exist. Check the day of the month and the time.');
    const fracNs = BigInt(frac.padEnd(9, '0') || '0');
    let baseMs; let note = '';
    if (interpretation === 'utc') baseMs = utcGuess;
    else if (interpretation === 'offset') {
      const om = /^([+-])(\d{2}):?(\d{2})$/.exec(offsetText);
      if (!om || +om[2] > 23 || +om[3] > 59) return fail('offset', 'Enter an offset such as +05:30 or -08:00.');
      const minutes = (om[1] === '-' ? -1 : 1) * (+om[2] * 60 + +om[3]);
      baseMs = utcGuess - minutes * 60000;
    } else {
      const local = new Date(fields[0], fields[1] - 1, fields[2], fields[3], fields[4], fields[5]);
      if (local.getHours() !== fields[3] || local.getMinutes() !== fields[4]) return fail('gap', 'This local time is skipped by a daylight saving change in your browser time zone. Pick another time or use UTC.');
      baseMs = local.getTime();
      const same = t => { const x = new Date(t); return x.getHours() === fields[3] && x.getMinutes() === fields[4] && x.getDate() === fields[2]; };
      if (same(baseMs + 3600000) || same(baseMs - 3600000)) note = 'This local time happens twice because of a daylight saving change. The earlier instant is shown.';
    }
    const nanos = BigInt(baseMs) * 1000000n + fracNs;
    const parts = toEpochParts(nanos, 'ns');
    if (!parts.ok) return parts;
    return { ok: true, ...parts, iso: new Date(parts.ms).toISOString(), rfc3339: rfc3339(parts), note };
  }

  function convertTimestampBatch(text, { unit = 'auto', timeZone = 'UTC', maxRows = 500, maxBytes = 100000 } = {}) {
    const value = String(text ?? '');
    const bytes = new TextEncoder().encode(value).length;
    if (bytes > maxBytes) return fail('bytes', `The pasted list is ${bytes.toLocaleString('en-US')} bytes. The limit is ${maxBytes.toLocaleString('en-US')} bytes.`);
    if (!validZone(timeZone)) return fail('zone', 'Choose a time zone from the list, such as America/New_York or UTC.');
    const lines = value.split(/\r\n|\r|\n/);
    const filled = lines.map((line, index) => ({ line: index + 1, input: line.trim() })).filter(row => row.input !== '');
    if (!filled.length) return fail('empty', 'Paste at least one timestamp, one per line.');
    if (filled.length > maxRows) return fail('rows', `The list has ${filled.length.toLocaleString('en-US')} timestamps. The limit is ${maxRows.toLocaleString('en-US')}.`);
    const rows = filled.map(row => {
      const r = convertTimestamp(row.input, { unit, timeZone });
      return r.ok ? { ...row, ok: true, unit: r.unit, utc: r.iso, zoned: r.zoned, rfc3339: r.rfc3339 } : { ...row, ok: false, error: r.message, code: r.code };
    });
    return { ok: true, rows, valid: rows.filter(r => r.ok).length, invalid: rows.filter(r => !r.ok).length };
  }


  // --------------------------------------------------------------------- UUID
  // RFC 9562. Random bytes and the clock are injected, so tests can be exact.
  // The browser page passes crypto.getRandomValues; Math.random is never used.
  const HEX = [...Array(256)].map((_, i) => i.toString(16).padStart(2, '0'));
  const MAX_UUIDS = 1000;
  const bytesToHex = bytes => Array.from(bytes, b => HEX[b]).join('');
  const hexToBytes = hex => Uint8Array.from(hex.match(/../g), h => parseInt(h, 16));

  function formatUuid(bytes, { upper = false, hyphens = true, braces = false } = {}) {
    const hex = bytesToHex(bytes);
    let text = hyphens ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` : hex;
    if (upper) text = text.toUpperCase();
    return braces ? `{${text}}` : text;
  }

  function generateUuidV4(randomBytes) {
    const b = Uint8Array.from(randomBytes(16));
    if (b.length !== 16) throw new Error('random source must return 16 bytes');
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    return b;
  }

  // UUID v7 with a 12-bit counter in rand_a (RFC 9562 section 6.2, method 1).
  // The counter starts at a random value below 2048 each new millisecond and
  // increases for each extra UUID in that millisecond. If the clock repeats or
  // goes backwards, the last millisecond is reused so order is kept. When the
  // counter would pass 4095 the function returns an error instead of wrapping.
  function createV7State() { return { ms: -1, counter: 0 }; }
  function generateUuidV7(timestampMs, randomBytes, state) {
    const rnd = Uint8Array.from(randomBytes(10));
    let ms = Math.floor(timestampMs);
    if (!Number.isSafeInteger(ms) || ms < 0 || ms > 0xffffffffffff) return fail('clock', 'The clock value is outside the 48-bit UUID v7 range.');
    if (ms <= state.ms) {
      ms = state.ms;
      if (state.counter >= 0xfff) return fail('exhausted', 'Too many UUID v7 values were requested in one millisecond. Wait a moment and generate again.');
      state.counter += 1;
    } else {
      state.ms = ms;
      state.counter = ((rnd[0] << 8) | rnd[1]) & 0x7ff;
    }
    const b = new Uint8Array(16);
    let t = BigInt(ms);
    for (let i = 5; i >= 0; i -= 1) { b[i] = Number(t & 0xffn); t >>= 8n; }
    b[6] = 0x70 | ((state.counter >> 8) & 0x0f);
    b[7] = state.counter & 0xff;
    b[8] = 0x80 | (rnd[2] & 0x3f);
    for (let i = 9; i < 16; i += 1) b[i] = rnd[i - 6];
    return { ok: true, bytes: b };
  }

  function generateUuidBatch({ version = 'v4', quantity = 1, upper = false, hyphens = true, braces = false } = {}, { randomBytes, now = () => Date.now(), nativeV4 = null, state = createV7State() } = {}) {
    if (!Number.isInteger(quantity) || quantity < 1) return fail('quantity', 'Enter a whole number of 1 or more.');
    if (quantity > MAX_UUIDS) return fail('quantity', `You can generate at most ${MAX_UUIDS.toLocaleString('en-US')} UUIDs at a time.`);
    if (!['v4', 'v7'].includes(version)) return fail('version', 'Choose version 4 or version 7.');
    if (typeof randomBytes !== 'function') return fail('random', 'This browser does not provide the Web Cryptography API, so UUIDs cannot be generated safely.');
    const options = { upper, hyphens, braces };
    const values = [];
    for (let i = 0; i < quantity; i += 1) {
      let bytes;
      if (version === 'v4') bytes = nativeV4 ? hexToBytes(nativeV4().replaceAll('-', '')) : generateUuidV4(randomBytes);
      else {
        const r = generateUuidV7(now(), randomBytes, state);
        if (!r.ok) return { ...r, values };
        bytes = r.bytes;
      }
      values.push(formatUuid(bytes, options));
    }
    return { ok: true, values };
  }

  // Accepts canonical text, braces, a urn:uuid: prefix, uppercase, and the
  // 32-digit form without hyphens, and says which of these were used.
  function parseUuid(value) {
    let text = String(value ?? '').trim();
    if (!text) return fail('empty', 'Enter a UUID to check.');
    if (text.length > 60) return fail('length', 'A UUID is 36 characters in canonical form. This input is too long.');
    const form = { urn: false, braces: false, upper: /[A-F]/.test(text), lower: /[a-f]/.test(text), hyphens: true };
    if (/^urn:uuid:/i.test(text)) { form.urn = true; text = text.slice(9); }
    if (text.startsWith('{') || text.endsWith('}')) {
      if (!(text.startsWith('{') && text.endsWith('}'))) return fail('braces', 'Braces must surround the whole UUID, with one at each end.');
      form.braces = true; text = text.slice(1, -1);
    }
    if (/[^0-9a-fA-F-]/.test(text)) return fail('hex', 'A UUID may contain only the digits 0-9, the letters a-f, and hyphens.');
    let hex;
    if (text.includes('-')) {
      if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(text)) {
        return text.replaceAll('-', '').length === 32 ? fail('hyphens', 'Hyphens must split the UUID into groups of 8-4-4-4-12 characters.') : fail('length', `A UUID has 32 hexadecimal digits. This one has ${text.replaceAll('-', '').length}.`);
      }
      hex = text.replaceAll('-', '');
    } else {
      if (text.length !== 32) return fail('length', `A UUID has 32 hexadecimal digits. This one has ${text.length}.`);
      hex = text; form.hyphens = false;
    }
    return { ok: true, bytes: hexToBytes(hex.toLowerCase()), form };
  }

  function variantOf(byte8) {
    if ((byte8 & 0x80) === 0) return 'NCS (reserved, backward compatibility)';
    if ((byte8 & 0xc0) === 0x80) return 'RFC 9562';
    if ((byte8 & 0xe0) === 0xc0) return 'Microsoft (reserved)';
    return 'Reserved for future use';
  }

  function extractUuidV7Timestamp(value) {
    const parsed = typeof value === 'string' ? parseUuid(value) : { ok: true, bytes: value };
    if (!parsed.ok) return parsed;
    if ((parsed.bytes[6] >> 4) !== 7) return fail('version', 'Only UUID version 7 contains a Unix millisecond timestamp.');
    let ms = 0;
    for (let i = 0; i < 6; i += 1) ms = ms * 256 + parsed.bytes[i];
    return { ok: true, ms, iso: new Date(ms).toISOString() };
  }

  function inspectUuid(value) {
    const parsed = parseUuid(value);
    if (!parsed.ok) return parsed;
    const { bytes, form } = parsed;
    const canonical = formatUuid(bytes);
    const alternate = form.urn || form.braces || form.upper || !form.hyphens;
    const base = { ok: true, canonical, form, alternate };
    if (bytes.every(b => b === 0)) return { ...base, special: 'Nil UUID', version: null, variant: 'Not applicable (special value)' };
    if (bytes.every(b => b === 255)) return { ...base, special: 'Max UUID', version: null, variant: 'Not applicable (special value)' };
    const variant = variantOf(bytes[8]);
    if (variant !== 'RFC 9562') return fail('variant', `The variant bits mark this as ${variant}, not an RFC 9562 UUID. The first digit of the fourth group must be 8, 9, a, or b.`, { canonical });
    const version = bytes[6] >> 4;
    if (version < 1 || version > 8) return fail('version', `Version ${version} is not defined by RFC 9562. The first digit of the third group must be 1 to 8.`, { canonical });
    const result = { ...base, special: null, version, variant };
    if (version === 7) result.timestamp = extractUuidV7Timestamp(bytes);
    return result;
  }
  const validateUuid = value => { const r = inspectUuid(value); return r.ok ? { ok: true, canonical: r.canonical } : r; };


  // ---------------------------------------------------------------------- URL
  // Text transforms only. Nothing here fetches a URL. Text becomes bytes with
  // UTF-8. Component encoding matches JavaScript encodeURIComponent (letters,
  // digits and - _ . ! ~ * ' ( ) stay as they are). Form encoding follows the
  // WHATWG application/x-www-form-urlencoded serializer: letters, digits and
  // * - . _ stay, a space becomes "+", and everything else is percent-encoded.
  const utf8 = new TextEncoder();
  const hexByte = (b, upper) => `%${(upper ? b.toString(16).toUpperCase() : b.toString(16)).padStart(2, '0')}`;
  function hasLoneSurrogate(text) { return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text); }

  function encodeWith(text, keep, { spaces = '%20', upper = true, preserveEncoded = true } = {}) {
    if (hasLoneSurrogate(text)) return fail('utf8', 'The text contains a broken Unicode character (a lone surrogate) that cannot be encoded as UTF-8.');
    let out = '';
    for (let i = 0; i < text.length;) {
      if (preserveEncoded && text[i] === '%' && /^[0-9a-fA-F]{2}$/.test(text.slice(i + 1, i + 3))) { out += upper ? text.slice(i, i + 3).toUpperCase() : text.slice(i, i + 3).toLowerCase(); i += 3; continue; }
      const cp = text.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      i += ch.length;
      if (ch === ' ' && spaces === '+') { out += '+'; continue; }
      if (keep.test(ch)) { out += ch; continue; }
      for (const b of utf8.encode(ch)) out += hexByte(b, upper);
    }
    return { ok: true, value: out };
  }
  const COMPONENT_KEEP = /^[A-Za-z0-9\-_.!~*'()]$/;
  const FORM_KEEP = /^[A-Za-z0-9*\-._]$/;
  const encodeUrlComponent = (value, options = {}) => encodeWith(String(value ?? ''), COMPONENT_KEEP, options);
  const encodeFormValue = (value, options = {}) => encodeWith(String(value ?? ''), FORM_KEEP, { spaces: '+', preserveEncoded: false, ...options });

  // Strict decoding: every % must start a two-digit hex triplet and the bytes
  // must be valid UTF-8. "+" means a space only when form is true.
  function decodeUrlComponent(value, { form = false } = {}) {
    const text = String(value ?? '');
    const bad = /%(?![0-9a-fA-F]{2})/.exec(text);
    if (bad) return fail('triplet', `Invalid percent sequence "${text.slice(bad.index, bad.index + 3)}" at character ${bad.index + 1}. A % must be followed by two hexadecimal digits.`, { index: bad.index });
    const bytes = [];
    for (let i = 0; i < text.length;) {
      if (text[i] === '%') { bytes.push(parseInt(text.slice(i + 1, i + 3), 16)); i += 3; continue; }
      if (form && text[i] === '+') { bytes.push(0x20); i += 1; continue; }
      const ch = String.fromCodePoint(text.codePointAt(i));
      for (const b of utf8.encode(ch)) bytes.push(b);
      i += ch.length;
    }
    try { return { ok: true, value: new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes)) }; }
    catch { return fail('utf8', 'The percent-encoded bytes are not valid UTF-8, so they cannot be turned back into text.'); }
  }

  // Query pairs keep their order and duplicate keys. A fragment is removed
  // before parsing, so it never becomes part of a value.
  function parseQueryPairs(value, { maxPairs = 1000 } = {}) {
    let text = String(value ?? '');
    const hash = text.indexOf('#');
    if (hash >= 0) text = text.slice(0, hash);
    const q = text.indexOf('?');
    if (q >= 0) text = text.slice(q + 1);
    if (!text) return { ok: true, pairs: [] };
    const parts = text.split('&').filter(p => p !== '');
    if (parts.length > maxPairs) return fail('pairs', `The query has ${parts.length} parameters. The limit is ${maxPairs}.`);
    const pairs = parts.map(part => {
      const eq = part.indexOf('=');
      const rawKey = eq >= 0 ? part.slice(0, eq) : part;
      const rawValue = eq >= 0 ? part.slice(eq + 1) : '';
      const k = decodeUrlComponent(rawKey, { form: true });
      const v = decodeUrlComponent(rawValue, { form: true });
      return { key: k.ok ? k.value : rawKey, value: v.ok ? v.value : rawValue, error: !k.ok ? k.message : !v.ok ? v.message : '' };
    });
    return { ok: true, pairs };
  }
  function serializeQueryPairs(pairs, { spaces = '+' } = {}) {
    const enc = s => (spaces === '+' ? encodeFormValue(s) : encodeUrlComponent(s, { preserveEncoded: false }));
    const out = [];
    for (const { key, value } of pairs) {
      const k = enc(key); const v = enc(value);
      if (!k.ok) return k;
      if (!v.ok) return v;
      out.push(`${k.value}=${v.value}`);
    }
    return { ok: true, value: out.join('&') };
  }

  // Parses with the platform URL API (WHATWG URL Standard). The password is
  // never returned, only whether one is present.
  function parseUrlForDisplay(value) {
    const text = String(value ?? '').trim();
    if (!text) return fail('empty', 'Enter a full URL, such as https://example.com/path?q=1.');
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(text)) return fail('scheme', 'Add a scheme at the start, such as https://. Full URL mode needs one to parse the address.');
    let url;
    try { url = new URL(text); } catch { return fail('url', 'This is not a valid URL. Check for spaces, a missing host, or stray characters.'); }
    const query = parseQueryPairs(url.search);
    return {
      ok: true,
      href: url.password ? url.href.replace(`:${url.password}@`, ':••••••@') : url.href,
      scheme: url.protocol.replace(/:$/, ''), username: url.username, hasPassword: url.password !== '',
      hostname: url.hostname, port: url.port, pathname: url.pathname, search: url.search, hash: url.hash,
      pairs: query.ok ? query.pairs : []
    };
  }

  function rebuildUrl(base, pairs, options = {}) {
    const text = String(base ?? '').trim();
    const hash = text.indexOf('#');
    const fragment = hash >= 0 ? text.slice(hash) : '';
    const beforeHash = hash >= 0 ? text.slice(0, hash) : text;
    const q = beforeHash.indexOf('?');
    const start = q >= 0 ? beforeHash.slice(0, q) : (/[=&]/.test(beforeHash) && !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(beforeHash) ? '' : beforeHash);
    const s = serializeQueryPairs(pairs, options);
    if (!s.ok) return s;
    return { ok: true, value: `${start}${s.value ? `${start || q >= 0 ? '?' : ''}${s.value}` : ''}${fragment}` };
  }

  function transformUrlText(value, mode, options = {}) {
    if (mode === 'encode') return encodeUrlComponent(value, options);
    if (mode === 'decode') return decodeUrlComponent(value, { form: false });
    if (mode === 'form-encode') return encodeFormValue(value, options);
    if (mode === 'form-decode') return decodeUrlComponent(value, { form: true });
    return fail('mode', 'Choose a mode.');
  }


  // ---------------------------------------------------------------------- XML
  // A small well-formedness checker and formatter for XML 1.0. It never
  // resolves entities, DTDs or URLs: a DOCTYPE with an external ID or an
  // internal subset is rejected, and only the five predefined entities and
  // numeric character references are accepted. Schema (XSD or DTD) validation
  // is out of scope.
  const XML_LIMITS = { maxBytes: 1048576, maxDepth: 256, maxNodes: 200000, maxTreeNodes: 1500 };
  const NAME_START = 'A-Za-z_:\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
  const NAME_RE = new RegExp(`^[${NAME_START}][${NAME_START}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`);
  const PREDEFINED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const validXmlChar = cp => cp === 0x9 || cp === 0xA || cp === 0xD || (cp >= 0x20 && cp <= 0xD7FF) || (cp >= 0xE000 && cp <= 0xFFFD) || (cp >= 0x10000 && cp <= 0x10FFFF);
  const HINTS = {
    empty: 'Paste an XML document or choose a file.',
    bytes: 'Split the document or remove content, then try again.',
    mismatch: 'Check that every start tag has a matching end tag with the same name, closed in the reverse order it was opened.',
    unclosed: 'Add the missing end tag, or close the element with /> if it has no content.',
    roots: 'An XML document has exactly one root element. Wrap the elements in a single parent element.',
    name: 'Element and attribute names must start with a letter, underscore or colon, and contain no spaces.',
    attribute: 'Write attributes as name="value", with the value in matching quotes.',
    duplicate: 'Remove or rename the repeated attribute. Each attribute may appear once per element.',
    entity: 'Use &amp;amp; for an ampersand. Only &amp;lt; &amp;gt; &amp;amp; &amp;quot; &amp;apos; and numeric references such as &amp;#169; are allowed without a DTD.',
    charref: 'Use a number for a character XML allows, such as &amp;#x41; for A.',
    doctype: 'Remove the DOCTYPE declaration, or reduce it to <!DOCTYPE name>. External entities and DTDs are never loaded here.',
    namespace: 'Declare the prefix on this element or a parent, for example xmlns:prefix="https://example.com/ns".',
    text: 'Move the text inside the root element, or remove it.',
    syntax: 'Check for a stray < or & character. Write them as &amp;lt; and &amp;amp; inside text.',
    declaration: 'The XML declaration must be the very first thing in the document, with nothing before it.',
    depth: 'This document is nested deeper than the limit. Flatten it, or format a smaller part.',
    nodes: 'This document has more nodes than the limit. Format a smaller part.',
    char: 'Remove the control character. XML 1.0 does not allow it.'
  };

  function locate(text, index) {
    const before = text.slice(0, index);
    const line = (before.match(/\n/g) || []).length + 1;
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineEnd = text.indexOf('\n', index);
    const lineText = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd);
    const column = index - lineStart + 1;
    const from = Math.max(0, column - 41);
    return { line, column, excerpt: lineText.slice(from, from + 80) };
  }
  const xmlFail = (text, index, code, message) => fail(code, message, { ...locate(text, index), hint: HINTS[code] || HINTS.syntax });

  function decodeEntities(raw, text, offset) {
    let out = '';
    for (let i = 0; i < raw.length;) {
      const ch = raw[i];
      if (ch !== '&') { out += ch; i += 1; continue; }
      const end = raw.indexOf(';', i);
      if (end < 0 || end - i > 12) return xmlFail(text, offset + i, 'entity', 'An & starts a reference that is never finished with ";".');
      const name = raw.slice(i + 1, end);
      if (name.startsWith('#')) {
        const m = /^#(?:x([0-9a-fA-F]+)|([0-9]+))$/.exec(name);
        const cp = m ? (m[1] ? parseInt(m[1], 16) : parseInt(m[2], 10)) : NaN;
        if (!m || !validXmlChar(cp)) return xmlFail(text, offset + i, 'charref', `&${name}; is not a character XML allows.`);
        out += String.fromCodePoint(cp);
      } else if (PREDEFINED[name]) out += PREDEFINED[name];
      else return xmlFail(text, offset + i, 'entity', `&${name}; is not defined. Without a DTD only the five predefined entities are allowed.`);
      i = end + 1;
    }
    return { ok: true, value: out };
  }

  // Parses into a node tree. Nodes keep their original raw text so formatting
  // can reproduce attributes, quotes, references and CDATA exactly.
  function parseXmlSafely(text, limits = {}) {
    const lim = { ...XML_LIMITS, ...limits };
    const source = String(text ?? '');
    if (!source.trim()) return fail('empty', 'The document is empty.', { hint: HINTS.empty });
    const bytes = new TextEncoder().encode(source).length;
    if (bytes > lim.maxBytes) return fail('bytes', `The document is ${bytes.toLocaleString('en-US')} bytes. The limit is ${lim.maxBytes.toLocaleString('en-US')} bytes (1 MB).`, { hint: HINTS.bytes });
    for (let i = 0; i < source.length; i += 1) {
      const cp = source.codePointAt(i);
      if (!validXmlChar(cp)) return xmlFail(source, i, 'char', `Character U+${cp.toString(16).toUpperCase().padStart(4, '0')} is not allowed in XML.`);
      if (cp > 0xffff) i += 1;
    }
    const doc = { type: 'document', children: [], declaration: null };
    const stack = [{ node: doc, ns: { xml: true } }];
    let rootCount = 0; let nodes = 0; let maxDepth = 0; let encoding = null;
    const add = node => { nodes += 1; if (nodes > lim.maxNodes) return false; stack[stack.length - 1].node.children.push(node); return true; };
    let i = 0;
    const s = source;
    while (i < s.length) {
      const depth = stack.length - 1;
      if (s[i] !== '<') {
        const next = s.indexOf('<', i);
        const raw = s.slice(i, next < 0 ? s.length : next);
        const decoded = decodeEntities(raw, s, i);
        if (!decoded.ok) return decoded;
        if (raw.includes(']]>')) return xmlFail(s, i + raw.indexOf(']]>'), 'syntax', 'The sequence ]]> is not allowed in text.');
        if (depth === 0) { if (raw.trim()) return xmlFail(s, i + raw.search(/\S/), 'text', 'Text appears outside the root element.'); }
        else if (!add({ type: 'text', raw, value: decoded.value })) return xmlFail(s, i, 'nodes', 'Too many nodes.');
        i = next < 0 ? s.length : next;
        continue;
      }
      if (s.startsWith('<?', i)) {
        const end = s.indexOf('?>', i + 2);
        if (end < 0) return xmlFail(s, i, 'syntax', 'A processing instruction starting here is never closed with ?>.');
        const raw = s.slice(i, end + 2);
        const target = /^<\?([^\s?]+)/.exec(raw)?.[1] || '';
        if (target.toLowerCase() === 'xml') {
          if (i !== 0 || target !== 'xml') return xmlFail(s, i, 'declaration', 'The XML declaration must come first, written exactly as <?xml.');
          if (!/^<\?xml\s+version\s*=\s*(["'])1\.[0-9]+\1/.test(raw)) return xmlFail(s, i, 'declaration', 'The XML declaration needs a version, such as <?xml version="1.0"?>.');
          encoding = /encoding\s*=\s*(["'])([A-Za-z][A-Za-z0-9._-]*)\1/.exec(raw)?.[2] || null;
          doc.declaration = raw;
        } else {
          if (!NAME_RE.test(target)) return xmlFail(s, i + 2, 'name', `"${target}" is not a valid processing instruction target.`);
          if (!add({ type: 'pi', raw })) return xmlFail(s, i, 'nodes', 'Too many nodes.');
        }
        i = end + 2; continue;
      }
      if (s.startsWith('<!--', i)) {
        const end = s.indexOf('-->', i + 4);
        if (end < 0) return xmlFail(s, i, 'syntax', 'A comment starting here is never closed with -->.');
        const body = s.slice(i + 4, end);
        if (body.includes('--') || body.endsWith('-')) return xmlFail(s, i + 4 + Math.max(0, body.indexOf('--')), 'syntax', 'A comment may not contain two hyphens in a row.');
        if (!add({ type: 'comment', raw: s.slice(i, end + 3) })) return xmlFail(s, i, 'nodes', 'Too many nodes.');
        i = end + 3; continue;
      }
      if (s.startsWith('<![CDATA[', i)) {
        if (depth === 0) return xmlFail(s, i, 'text', 'A CDATA section appears outside the root element.');
        const end = s.indexOf(']]>', i + 9);
        if (end < 0) return xmlFail(s, i, 'syntax', 'A CDATA section starting here is never closed with ]]>.');
        if (!add({ type: 'cdata', raw: s.slice(i, end + 3) })) return xmlFail(s, i, 'nodes', 'Too many nodes.');
        i = end + 3; continue;
      }
      if (s.startsWith('<!DOCTYPE', i)) {
        const end = s.indexOf('>', i);
        const raw = s.slice(i, end + 1);
        if (end < 0 || /\[/.test(s.slice(i, end)) || /\b(SYSTEM|PUBLIC)\b/.test(raw)) return xmlFail(s, i, 'doctype', 'DOCTYPE declarations with an internal subset, external ID or entities are not processed, so external files and entity expansion can never happen.');
        if (rootCount || !/^<!DOCTYPE\s+[^\s>]+\s*>$/.test(raw)) return xmlFail(s, i, 'doctype', 'The DOCTYPE must come before the root element and name it, such as <!DOCTYPE note>.');
        if (!add({ type: 'doctype', raw })) return xmlFail(s, i, 'nodes', 'Too many nodes.');
        i = end + 1; continue;
      }
      if (s.startsWith('<!', i)) return xmlFail(s, i, 'syntax', 'Unknown markup declaration. Only comments, CDATA sections and a simple DOCTYPE are allowed.');
      if (s.startsWith('</', i)) {
        const m = /^<\/([^\s>]+)\s*>/.exec(s.slice(i, i + 1100));
        if (!m) return xmlFail(s, i, 'syntax', 'An end tag starting here is not closed with >.');
        const open = stack[stack.length - 1];
        if (depth === 0) return xmlFail(s, i, 'mismatch', `</${m[1]}> has no matching start tag.`);
        if (open.node.name !== m[1]) return xmlFail(s, i, 'mismatch', `Expected </${open.node.name}> but found </${m[1]}>.`);
        stack.pop();
        i += m[0].length; continue;
      }
      // Start tag.
      let j = i + 1;
      const nm = /^[^\s/>=]+/.exec(s.slice(j, j + 1100));
      if (!nm) return xmlFail(s, i, 'syntax', 'A < must start a tag. Write a literal < in text as &lt;.');
      const name = nm[0];
      if (!NAME_RE.test(name)) return xmlFail(s, j, 'name', `"${name}" is not a valid element name.`);
      j += name.length;
      const attrs = []; const seen = new Set(); let selfClosing = false;
      for (;;) {
        const ws = /^\s*/.exec(s.slice(j, j + 1000))[0]; j += ws.length;
        if (s.startsWith('/>', j)) { selfClosing = true; j += 2; break; }
        if (s[j] === '>') { j += 1; break; }
        if (j >= s.length) return xmlFail(s, i, 'unclosed', `The <${name}> tag is never closed with >.`);
        if (!ws) return xmlFail(s, j, 'attribute', 'Attributes must be separated by a space.');
        const am = /^([^\s=/>]+)\s*=\s*(["'])/.exec(s.slice(j, j + 1100));
        if (!am) return xmlFail(s, j, 'attribute', `Attribute near "${s.slice(j, j + 20)}" needs a quoted value.`);
        const aname = am[1];
        if (!NAME_RE.test(aname)) return xmlFail(s, j, 'name', `"${aname}" is not a valid attribute name.`);
        if (seen.has(aname)) return xmlFail(s, j, 'duplicate', `The attribute ${aname} appears more than once.`);
        seen.add(aname);
        const valueStart = j + am[0].length;
        const close = s.indexOf(am[2], valueStart);
        if (close < 0) return xmlFail(s, j, 'attribute', `The value of ${aname} is never closed.`);
        const rawValue = s.slice(valueStart, close);
        if (rawValue.includes('<')) return xmlFail(s, valueStart + rawValue.indexOf('<'), 'attribute', 'An attribute value may not contain <. Write it as &lt;.');
        const dv = decodeEntities(rawValue, s, valueStart);
        if (!dv.ok) return dv;
        attrs.push({ name: aname, raw: s.slice(j, close + 1).replace(/\s*=\s*/, '='), value: dv.value });
        j = close + 1;
      }
      // Namespaces: collect declarations, then check every prefix is bound.
      const ns = { ...stack[stack.length - 1].ns };
      for (const a of attrs) { if (a.name === 'xmlns') ns[''] = true; else if (a.name.startsWith('xmlns:')) { if (!a.value) return xmlFail(s, i, 'namespace', `The prefix ${a.name.slice(6)} cannot be bound to an empty namespace.`); ns[a.name.slice(6)] = true; } }
      for (const n of [name, ...attrs.map(a => a.name)]) {
        const parts = n.split(':');
        if (parts.length > 2 || (parts.length === 2 && (!parts[0] || !parts[1]))) return xmlFail(s, i, 'namespace', `"${n}" has more than one colon or an empty prefix.`);
        if (parts.length === 2 && parts[0] !== 'xmlns' && !ns[parts[0]]) return xmlFail(s, i, 'namespace', `The prefix "${parts[0]}" in ${n} is not declared.`);
      }
      if (depth === 0) { rootCount += 1; if (rootCount > 1) return xmlFail(s, i, 'roots', 'The document has more than one root element.'); }
      const element = { type: 'element', name, attrs, children: [], selfClosing, start: i };
      if (!add(element)) return xmlFail(s, i, 'nodes', 'Too many nodes.');
      if (!selfClosing) {
        stack.push({ node: element, ns });
        maxDepth = Math.max(maxDepth, stack.length - 1);
        if (stack.length - 1 > lim.maxDepth) return xmlFail(s, i, 'depth', `Elements are nested more than ${lim.maxDepth} levels deep.`);
      }
      i = j;
    }
    if (stack.length > 1) { const open = stack[stack.length - 1].node; return xmlFail(s, open.start, 'unclosed', `<${open.name}> is never closed.`); }
    if (!rootCount) return fail('roots', 'The document has no root element.', { hint: HINTS.roots, line: 1, column: 1, excerpt: s.slice(0, 80) });
    const warnings = [];
    if (encoding && !/^utf-?8$/i.test(encoding)) warnings.push(`The declaration names ${encoding}, but the text was read in your browser as Unicode. The output keeps the declaration as written; save the file in ${encoding} or change it to UTF-8.`);
    return { ok: true, document: doc, stats: { nodes, maxDepth, bytes }, encoding, warnings };
  }

  // Elements whose content mixes text and markup, or that set
  // xml:space="preserve", keep their children byte for byte.
  const preserveSpace = el => el.attrs.some(a => a.name === 'xml:space' && a.value === 'preserve');
  const hasText = el => el.children.some(c => (c.type === 'text' && c.raw.trim()) || c.type === 'cdata');
  const openTag = el => `<${el.name}${el.attrs.map(a => ` ${a.raw}`).join('')}${el.selfClosing ? '/>' : '>'}`;
  function serializeInline(node, keepComments) {
    if (node.type === 'text' || node.type === 'cdata' || node.type === 'pi' || node.type === 'doctype') return node.raw;
    if (node.type === 'comment') return keepComments ? node.raw : '';
    if (node.selfClosing) return openTag(node);
    return `${openTag(node)}${node.children.map(c => serializeInline(c, keepComments)).join('')}</${node.name}>`;
  }

  function formatXml(text, { indent = '  ', keepComments = true, minify = false, limits } = {}) {
    const parsed = parseXmlSafely(text, limits);
    if (!parsed.ok) return parsed;
    const lines = [];
    const nl = minify ? '' : '\n';
    function walk(node, level) {
      const pad = minify ? '' : indent.repeat(level);
      if (node.type === 'text') { if (node.raw.trim()) lines.push(pad + node.raw.trim()); return; }
      if (node.type === 'comment') { if (keepComments) lines.push(pad + node.raw); return; }
      if (node.type !== 'element') { lines.push(pad + node.raw); return; }
      if (node.selfClosing) { lines.push(pad + openTag(node)); return; }
      const visible = node.children.filter(c => !(c.type === 'text' && !c.raw.trim()) && !(c.type === 'comment' && !keepComments));
      if (!visible.length) { lines.push(`${pad}${openTag(node)}</${node.name}>`); return; }
      if (hasText(node) || preserveSpace(node)) { lines.push(pad + serializeInline(node, keepComments || preserveSpace(node))); return; }
      lines.push(pad + openTag(node));
      for (const child of node.children) walk(child, level + 1);
      lines.push(`${pad}</${node.name}>`);
    }
    if (parsed.document.declaration) lines.push(parsed.document.declaration);
    for (const child of parsed.document.children) walk(child, 0);
    return { ok: true, value: lines.join(nl) + (minify ? '' : '\n'), stats: parsed.stats, warnings: parsed.warnings, document: parsed.document };
  }
  const minifyXml = (text, options = {}) => formatXml(text, { ...options, minify: true });

  // A bounded outline for the tree preview. Labels are plain strings; the page
  // renders them with textContent only.
  function buildXmlTreeModel(document, { maxTreeNodes = XML_LIMITS.maxTreeNodes } = {}) {
    let count = 0; let truncated = false;
    function visit(node) {
      if (count >= maxTreeNodes) { truncated = true; return null; }
      count += 1;
      if (node.type === 'element') {
        const label = `<${node.name}${node.attrs.length ? ` ${node.attrs.map(a => `${a.name}="${a.value.length > 40 ? `${a.value.slice(0, 40)}…` : a.value}"`).join(' ')}` : ''}>`;
        const children = [];
        for (const c of node.children) { if (c.type === 'text' && !c.raw.trim()) continue; const v = visit(c); if (v) children.push(v); }
        return { label, children };
      }
      const raw = node.type === 'text' ? node.value.trim() : node.raw;
      return { label: `${node.type === 'text' ? 'Text' : node.type === 'cdata' ? 'CDATA' : node.type === 'comment' ? 'Comment' : node.type === 'pi' ? 'Instruction' : 'DOCTYPE'}: ${raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}`, children: [] };
    }
    const roots = document.children.map(visit).filter(Boolean);
    return { roots, count, truncated };
  }


  // --------------------------------------------------------------------- JSON
  // A strict RFC 8259 parser that builds its own tree and never calls eval,
  // Function, or JSON.parse on the whole input. Numbers keep their original
  // text, so formatting never rounds them. Duplicate names are kept and
  // reported, instead of silently losing the earlier value.
  const JSON_LIMITS = { maxBytes: 1048576, maxDepth: 256, maxNodes: 200000, maxTreeNodes: 1500, maxCsvRows: 10000, maxCsvColumns: 200 };
  const JSON_HINTS = {
    empty: 'Paste a JSON value, such as {"name": "value"}, or open a file.',
    bytes: 'Split the document or remove content, then try again.',
    trailing: 'Remove the comma before the closing bracket or brace. JSON does not allow trailing commas.',
    quote: 'Use double quotes. JSON strings and names cannot use single quotes.',
    comment: 'Remove the comment. JSON has no comment syntax.',
    key: 'Put the name in double quotes, such as "id": 1.',
    escape: 'Valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\u followed by four hex digits.',
    control: 'Write control characters such as tabs and new lines as escapes, for example \\n.',
    number: 'Numbers have no leading zeros, plus signs, or trailing dots, and cannot be NaN or Infinity.',
    truncated: 'The document ends too early. Check for a missing closing quote, bracket or brace.',
    extra: 'A JSON document holds one value. Wrap several values in an array, or remove the extra text.',
    unexpected: 'Check the character at this position. A comma or colon may be missing or doubled.',
    depth: 'This document is nested deeper than the limit.',
    nodes: 'This document has more values than the limit.',
    literal: 'Write true, false and null in lowercase.'
  };
  const jsonFail = (text, index, code, message) => fail(code, message, { index, ...locate(text, Math.min(index, text.length)), hint: JSON_HINTS[code] || JSON_HINTS.unexpected });

  function parseJsonWithDiagnostics(text, limits = {}) {
    const lim = { ...JSON_LIMITS, ...limits };
    const s = String(text ?? '').replace(/^﻿/, '');
    if (!s.trim()) return fail('empty', 'The input is empty.', { hint: JSON_HINTS.empty });
    const bytes = new TextEncoder().encode(s).length;
    if (bytes > lim.maxBytes) return fail('bytes', `The input is ${bytes.toLocaleString('en-US')} bytes. The limit is ${lim.maxBytes.toLocaleString('en-US')} bytes (1 MB).`, { hint: JSON_HINTS.bytes });
    let i = 0; let nodes = 0; let maxDepth = 0;
    const warnings = { duplicates: [], unsafe: [], extreme: [] };
    const ws = () => { while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i += 1; };
    const err = (code, message, at = i) => { throw jsonFail(s, at, code, message); };
    function describe(at) {
      if (at >= s.length) return 'the end of the input';
      const ch = s[at];
      return ch === '\n' ? 'a line break' : `"${ch}"`;
    }
    function unexpected(context) {
      if (i >= s.length) err('truncated', `The input ends where ${context} was expected.`);
      const ch = s[i];
      if (ch === '/' && (s[i + 1] === '/' || s[i + 1] === '*')) err('comment', 'Comments are not allowed in JSON.');
      if (ch === "'") err('quote', 'Strings must use double quotes, not single quotes.');
      err('unexpected', `Expected ${context} but found ${describe(i)}.`);
    }
    function string() {
      const start = i; i += 1;
      let out = '';
      for (;;) {
        if (i >= s.length) err('truncated', 'This string is never closed with a double quote.', start);
        const ch = s[i];
        if (ch === '"') { i += 1; return { raw: s.slice(start, i), value: out }; }
        if (ch === '\\') {
          const e = s[i + 1];
          if (e === undefined) err('truncated', 'The input ends inside an escape sequence.');
          const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
          if (map[e] !== undefined) { out += map[e]; i += 2; continue; }
          if (e === 'u') {
            const hex = s.slice(i + 2, i + 6);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) err('escape', '\\u must be followed by four hexadecimal digits.');
            out += String.fromCharCode(parseInt(hex, 16)); i += 6; continue;
          }
          err('escape', `\\${e} is not a valid escape in JSON.`);
        }
        if (ch.charCodeAt(0) < 0x20) err('control', 'A string contains an unescaped control character, such as a raw tab or line break.');
        out += ch; i += 1;
      }
    }
    function number() {
      const start = i;
      const m = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(s.slice(i, i + 400));
      if (!m || m[0] === '-') err('number', 'This is not a valid JSON number.');
      i += m[0].length;
      if (/[0-9.eE+\-A-Za-z]/.test(s[i] || '')) err('number', `The number ${s.slice(start, i + 1)} is not valid JSON.`, start);
      const raw = m[0];
      if (!m[2] && !m[3]) { const big = BigInt(raw); if (big > 9007199254740991n || big < -9007199254740991n) warnings.unsafe.push({ raw, index: start }); }
      else if (!Number.isFinite(Number(raw)) || (Number(raw) === 0 && /[1-9]/.test(raw.replace(/[eE].*$/, '')))) warnings.extreme.push({ raw, index: start });
      return raw;
    }
    function value(depth, path) {
      ws();
      nodes += 1;
      if (nodes > lim.maxNodes) err('nodes', `The document has more than ${lim.maxNodes.toLocaleString('en-US')} values.`);
      if (depth > maxDepth) maxDepth = depth;
      if (depth > lim.maxDepth) err('depth', `Values are nested more than ${lim.maxDepth} levels deep.`);
      const ch = s[i];
      if (ch === '{') {
        const start = i; i += 1; ws();
        const members = []; const seen = new Map();
        if (s[i] === '}') { i += 1; return { type: 'object', members, index: start }; }
        for (;;) {
          ws();
          if (s[i] === '}' && members.length) err('trailing', 'There is a trailing comma before this }.');
          if (s[i] !== '"') { if (/[A-Za-z_$]/.test(s[i] || '')) err('key', 'Object names must be in double quotes.'); unexpected('a name in double quotes'); }
          const keyIndex = i;
          const key = string();
          if (seen.has(key.value)) warnings.duplicates.push({ key: key.value, path, index: keyIndex, first: seen.get(key.value) }); else seen.set(key.value, keyIndex);
          ws();
          if (s[i] !== ':') unexpected('a colon after the name');
          i += 1;
          const v = value(depth + 1, `${path}${/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key.value) ? `.${key.value}` : `[${JSON.stringify(key.value)}]`}`);
          members.push({ key: key.value, keyRaw: key.raw, value: v });
          ws();
          if (s[i] === ',') { i += 1; continue; }
          if (s[i] === '}') { i += 1; return { type: 'object', members, index: start }; }
          unexpected('a comma or }');
        }
      }
      if (ch === '[') {
        const start = i; i += 1; ws();
        const items = [];
        if (s[i] === ']') { i += 1; return { type: 'array', items, index: start }; }
        for (;;) {
          ws();
          if (s[i] === ']' && items.length) err('trailing', 'There is a trailing comma before this ].');
          items.push(value(depth + 1, `${path}[${items.length}]`));
          ws();
          if (s[i] === ',') { i += 1; continue; }
          if (s[i] === ']') { i += 1; return { type: 'array', items, index: start }; }
          unexpected('a comma or ]');
        }
      }
      if (ch === '"') { const r = string(); return { type: 'string', raw: r.raw, value: r.value }; }
      if (ch === '-' || (ch >= '0' && ch <= '9')) return { type: 'number', raw: number() };
      for (const lit of ['true', 'false', 'null']) if (s.startsWith(lit, i)) { i += lit.length; return { type: lit === 'null' ? 'null' : 'boolean', raw: lit }; }
      if (/^(True|False|Null|TRUE|FALSE|NULL)/.test(s.slice(i, i + 5))) err('literal', 'Write true, false and null in lowercase.');
      if (/^(NaN|Infinity|-Infinity|undefined)/.test(s.slice(i, i + 9))) err('number', 'NaN, Infinity and undefined are not valid JSON values.');
      unexpected('a value');
      return null;
    }
    try {
      const root = value(0, '$');
      ws();
      if (i < s.length) {
        if (s[i] === '/' && (s[i + 1] === '/' || s[i + 1] === '*')) err('comment', 'Comments are not allowed in JSON.');
        err('extra', `Unexpected ${describe(i)} after the end of the JSON value.`);
      }
      return { ok: true, root, stats: { nodes, maxDepth, bytes }, warnings };
    } catch (problem) {
      if (problem && problem.ok === false) return problem;
      throw problem;
    }
  }

  function serializeJson(node, { indent = '  ', minify = false, sortKeys = false } = {}, level = 0) {
    const nl = minify ? '' : '\n';
    const pad = n => (minify ? '' : indent.repeat(n));
    if (node.type === 'object') {
      if (!node.members.length) return '{}';
      const members = sortKeys ? [...node.members].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)) : node.members;
      return `{${nl}${members.map(m => `${pad(level + 1)}${m.keyRaw}:${minify ? '' : ' '}${serializeJson(m.value, { indent, minify, sortKeys }, level + 1)}`).join(`,${nl}`)}${nl}${pad(level)}}`;
    }
    if (node.type === 'array') {
      if (!node.items.length) return '[]';
      return `[${nl}${node.items.map(v => `${pad(level + 1)}${serializeJson(v, { indent, minify, sortKeys }, level + 1)}`).join(`,${nl}`)}${nl}${pad(level)}]`;
    }
    return node.raw;
  }
  function formatJson(text, options = {}) {
    const parsed = parseJsonWithDiagnostics(text, options.limits);
    if (!parsed.ok) return parsed;
    return { ...parsed, value: serializeJson(parsed.root, options) + (options.minify ? '' : '\n') };
  }
  const sortJsonKeys = (text, options = {}) => formatJson(text, { ...options, sortKeys: true });

  function buildJsonTreeModel(root, { maxTreeNodes = JSON_LIMITS.maxTreeNodes } = {}) {
    let count = 0; let truncated = false;
    const preview = node => (node.type === 'string' ? (node.value.length > 80 ? `${JSON.stringify(node.value.slice(0, 80))}…` : JSON.stringify(node.value)) : node.raw);
    function visit(node, key, path) {
      if (count >= maxTreeNodes) { truncated = true; return null; }
      count += 1;
      const item = { key, path, type: node.type, children: [] };
      if (node.type === 'object') { item.summary = `${node.members.length} ${node.members.length === 1 ? 'member' : 'members'}`; for (const m of node.members) { const c = visit(m.value, m.key, `${path}${/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(m.key) ? `.${m.key}` : `[${JSON.stringify(m.key)}]`}`); if (c) item.children.push(c); } }
      else if (node.type === 'array') { item.summary = `${node.items.length} ${node.items.length === 1 ? 'item' : 'items'}`; node.items.forEach((v, idx) => { const c = visit(v, String(idx), `${path}[${idx}]`); if (c) item.children.push(c); }); }
      else item.summary = preview(node);
      return item;
    }
    return { root: visit(root, '$', '$'), count, truncated };
  }

  // JSON to CSV for an array of objects. Columns are the union of names in
  // first-seen order. Nested objects or arrays are rejected, or written as
  // compact JSON text when nested is "json". Cells that start with = + - or @
  // are prefixed with an apostrophe so spreadsheets do not run them.
  function csvCellSafe(value) {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) || text !== String(value ?? '') ? `"${text.replaceAll('"', '""')}"` : text;
  }
  function jsonArrayToCsv(text, { nested = 'reject', limits } = {}) {
    const lim = { ...JSON_LIMITS, ...(limits || {}) };
    const parsed = parseJsonWithDiagnostics(text, limits);
    if (!parsed.ok) return parsed;
    const root = parsed.root;
    if (root.type !== 'array') return fail('csv-shape', 'CSV conversion needs a top-level array of objects, such as [{"a": 1}, {"a": 2}].');
    if (!root.items.length) return fail('csv-shape', 'The array is empty, so there are no rows to convert.');
    if (root.items.length > lim.maxCsvRows) return fail('csv-rows', `The array has ${root.items.length.toLocaleString('en-US')} items. CSV conversion is limited to ${lim.maxCsvRows.toLocaleString('en-US')} rows.`);
    const columns = []; const seen = new Set();
    for (const [index, item] of root.items.entries()) {
      if (item.type !== 'object') return fail('csv-shape', `Item ${index} is ${item.type === 'array' ? 'an array' : `a ${item.type}`}, not an object. Every item must be an object.`);
      for (const m of item.members) {
        if ((m.value.type === 'object' || m.value.type === 'array') && nested === 'reject') return fail('csv-nested', `Item ${index} has a nested ${m.value.type} in "${m.key}". Choose "Write nested values as JSON text" or flatten the data first.`);
        if (!seen.has(m.key)) { seen.add(m.key); columns.push(m.key); }
      }
    }
    if (columns.length > lim.maxCsvColumns) return fail('csv-columns', `The data has ${columns.length} columns. The limit is ${lim.maxCsvColumns}.`);
    let missing = 0;
    const cell = node => { if (!node) { missing += 1; return ''; } if (node.type === 'string') return node.value; if (node.type === 'null') return ''; if (node.type === 'object' || node.type === 'array') return serializeJson(node, { minify: true }); return node.raw; };
    const rows = root.items.map(item => { const last = new Map(); for (const m of item.members) last.set(m.key, m.value); return columns.map(c => cell(last.get(c))); });
    const csv = [columns, ...rows].map(row => row.map(csvCellSafe).join(',')).join('\r\n');
    const protectedCells = [columns, ...rows].flat().filter(v => /^[=+\-@\t\r]/.test(String(v))).length;
    return { ok: true, value: csv, columns, rows: rows.length, missing, protectedCells, warnings: parsed.warnings, stats: parsed.stats };
  }

  root.StackRowDevTools = Object.assign(root.StackRowDevTools || {}, {
    Timestamp: { UNITS, parseTimestampInteger, detectTimestampUnit, toEpochParts, formatTimestamp, convertTimestamp, parseUtcOrOffsetDate, convertTimestampBatch, validZone, rfc3339 },
    Uuid: { MAX_UUIDS, formatUuid, generateUuidV4, generateUuidV7, createV7State, generateUuidBatch, parseUuid, validateUuid, inspectUuid, extractUuidV7Timestamp, bytesToHex },
    Url: { encodeUrlComponent, encodeFormValue, decodeUrlComponent, parseQueryPairs, serializeQueryPairs, parseUrlForDisplay, rebuildUrl, transformUrlText },
    Xml: { XML_LIMITS, parseXmlSafely, formatXml, minifyXml, buildXmlTreeModel, locate },
    Json: { JSON_LIMITS, parseJsonWithDiagnostics, serializeJson, formatJson, sortJsonKeys, buildJsonTreeModel, jsonArrayToCsv, csvCellSafe }
  });
})(typeof window !== 'undefined' ? window : globalThis);
