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

  root.StackRowDevTools = Object.assign(root.StackRowDevTools || {}, {
    Timestamp: { UNITS, parseTimestampInteger, detectTimestampUnit, toEpochParts, formatTimestamp, convertTimestamp, parseUtcOrOffsetDate, convertTimestampBatch, validZone, rfc3339 }
  });
})(typeof window !== 'undefined' ? window : globalThis);
