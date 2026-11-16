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

  root.StackRowDevTools = Object.assign(root.StackRowDevTools || {}, {
    Timestamp: { UNITS, parseTimestampInteger, detectTimestampUnit, toEpochParts, formatTimestamp, convertTimestamp, parseUtcOrOffsetDate, convertTimestampBatch, validZone, rfc3339 },
    Uuid: { MAX_UUIDS, formatUuid, generateUuidV4, generateUuidV7, createV7State, generateUuidBatch, parseUuid, validateUuid, inspectUuid, extractUuidV7Timestamp, bytesToHex }
  });
})(typeof window !== 'undefined' ? window : globalThis);
