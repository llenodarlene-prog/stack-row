// Pure logic for Stack Row utilities: passphrases, YAML, uptime and cron.
// No DOM access; randomness and parsers are injected so tests are exact.
(function (root) {
  'use strict';
  const fail = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });

  // --------------------------------------------------------------- Passphrase
  // Words are chosen with the Web Cryptography API using rejection sampling,
  // so every word is equally likely. Math.random is never used.
  function randomIndex(n, randomBytes) {
    if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) throw new Error('bad range');
    const limit = Math.floor(2 ** 32 / n) * n;
    for (;;) {
      const b = randomBytes(4);
      const value = ((b[0] << 24) >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3];
      if (value < limit) return value % n;
    }
  }
  const SEPARATORS = { hyphen: '-', space: ' ', period: '.', underscore: '_', comma: ',', none: '' };
  // Entropy counts only the random choices the generator makes.
  function passphraseEntropy({ words, listSize, capitalize = 'none', addNumber = false }) {
    let bits = words * Math.log2(listSize);
    if (capitalize === 'random') bits += words; // each word upper or lower at random
    if (addNumber) bits += Math.log2(10) + Math.log2(words); // a digit added to one random word
    return bits;
  }
  function generatePassphrase({ words = 6, separator = 'hyphen', capitalize = 'none', addNumber = false } = {}, { wordlist, randomBytes }) {
    if (!Array.isArray(wordlist) || wordlist.length < 2) return fail('wordlist', 'The word list did not load.');
    if (typeof randomBytes !== 'function') return fail('random', 'This browser does not provide the Web Cryptography API, so passphrases cannot be generated safely.');
    if (!Number.isInteger(words) || words < 3 || words > 12) return fail('words', 'Choose from 3 to 12 words.');
    if (!(separator in SEPARATORS)) return fail('separator', 'Choose a separator.');
    const picked = [];
    for (let i = 0; i < words; i += 1) {
      let word = wordlist[randomIndex(wordlist.length, randomBytes)];
      if (capitalize === 'first' || (capitalize === 'random' && randomIndex(2, randomBytes) === 1)) word = word[0].toUpperCase() + word.slice(1);
      if (capitalize === 'all') word = word.toUpperCase();
      picked.push(word);
    }
    if (addNumber) { const at = randomIndex(words, randomBytes); picked[at] += String(randomIndex(10, randomBytes)); }
    return { ok: true, value: picked.join(SEPARATORS[separator]), words: picked };
  }
  function generatePassphrases(options, deps) {
    const count = options.count ?? 1;
    if (!Number.isInteger(count) || count < 1 || count > 50) return fail('count', 'Generate from 1 to 50 passphrases at a time.');
    const values = [];
    for (let i = 0; i < count; i += 1) { const r = generatePassphrase(options, deps); if (!r.ok) return r; values.push(r.value); }
    const bits = passphraseEntropy({ words: options.words ?? 6, listSize: deps.wordlist.length, capitalize: options.capitalize, addNumber: options.addNumber });
    return { ok: true, values, bits };
  }
  // A plain-language band for the entropy. Guess rates vary hugely by attack,
  // so the page states the assumption next to any time estimate.
  function strengthBand(bits) {
    if (bits < 50) return 'Weak for important accounts';
    if (bits < 70) return 'Fair: fine for many online accounts with rate limits';
    if (bits < 90) return 'Strong';
    return 'Very strong';
  }
  // Years to try every combination at a stated number of guesses per second.
  const exhaustYears = (bits, guessesPerSecond) => Math.pow(2, bits) / guessesPerSecond / 31557600;

  // --------------------------------------------------------------------- YAML
  // Wraps js-yaml (MIT) with size limits, a guard against alias expansion
  // ("billion laughs"), and line and column errors. The parser is passed in.
  const YAML_LIMITS = { maxBytes: 1048576, maxNodes: 100000, maxDepth: 100 };
  // YAML 1.2 core schema plus the widely used << merge key. No custom or
  // language-specific tags, so loading YAML can never run code.
  const schemaCache = new WeakMap();
  const schemaFor = yaml => { if (!schemaCache.has(yaml)) schemaCache.set(yaml, yaml.CORE_SCHEMA.extend({ implicit: [yaml.types.merge] })); return schemaCache.get(yaml); };
  function countNodes(value, limits) {
    let nodes = 0; let maxDepth = 0;
    const stack = [[value, 0]];
    while (stack.length) {
      const [v, depth] = stack.pop();
      nodes += 1;
      if (nodes > limits.maxNodes) return { error: 'nodes' };
      if (depth > maxDepth) maxDepth = depth;
      if (depth > limits.maxDepth) return { error: 'depth' };
      if (v && typeof v === 'object') for (const child of Array.isArray(v) ? v : Object.values(v)) stack.push([child, depth + 1]);
    }
    return { nodes, maxDepth };
  }
  function parseYamlSafely(text, yaml, limits = {}) {
    const lim = { ...YAML_LIMITS, ...limits };
    const source = String(text ?? '');
    if (!source.trim()) return fail('empty', 'The input is empty.');
    const bytes = new TextEncoder().encode(source).length;
    if (bytes > lim.maxBytes) return fail('bytes', `The input is ${bytes.toLocaleString('en-US')} bytes. The limit is ${lim.maxBytes.toLocaleString('en-US')} bytes (1 MB).`);
    let docs;
    try { docs = []; yaml.loadAll(source, doc => docs.push(doc), { schema: schemaFor(yaml) }); }
    catch (error) {
      const mark = error?.mark;
      const reason = String(error?.reason || error?.message || 'The YAML could not be read.').replace(/\s+/g, ' ');
      return fail('syntax', reason.charAt(0).toUpperCase() + reason.slice(1).replace(/\.?$/, '.'), mark ? { line: mark.line + 1, column: mark.column + 1, excerpt: String(source.split(/\r?\n/)[mark.line] || '').slice(0, 120) } : {});
    }
    // Aliases are shared objects; counting them in full catches expansion bombs.
    let nodes = 0; let maxDepth = 0;
    for (const doc of docs) {
      const c = countNodes(doc, { ...lim, maxNodes: lim.maxNodes - nodes });
      if (c.error === 'nodes') return fail('nodes', `The YAML expands to more than ${lim.maxNodes.toLocaleString('en-US')} values, often because of repeated aliases. It was not processed.`);
      if (c.error === 'depth') return fail('depth', `Values are nested more than ${lim.maxDepth} levels deep.`);
      nodes += c.nodes; maxDepth = Math.max(maxDepth, c.maxDepth);
    }
    const aliases = (source.match(/(^|[\s[{,:-])\*[^\s,\]}]+/g) || []).length;
    return { ok: true, docs, stats: { nodes, maxDepth, bytes, documents: docs.length, aliases }, hasComments: /(^|\s)#/.test(source) };
  }
  function formatYaml(text, yaml, { indent = 2, sortKeys = false } = {}) {
    const r = parseYamlSafely(text, yaml);
    if (!r.ok) return r;
    const dump = doc => yaml.dump(doc, { indent, sortKeys, noRefs: true, lineWidth: -1, schema: schemaFor(yaml) });
    return { ...r, value: r.docs.map(dump).join('---\n') };
  }
  function yamlToJson(text, yaml, { indent = 2 } = {}) {
    const r = parseYamlSafely(text, yaml);
    if (!r.ok) return r;
    const value = r.docs.length === 1 ? r.docs[0] : r.docs;
    return { ...r, value: `${JSON.stringify(value, null, indent)}\n` };
  }
  function jsonToYaml(text, yaml, { indent = 2, sortKeys = false } = {}) {
    let value;
    try { value = JSON.parse(String(text ?? '')); } catch (error) { return fail('json', `This is not valid JSON: ${String(error.message).replace(/^JSON\.parse: /, '')}`); }
    return { ok: true, value: yaml.dump(value, { indent, sortKeys, noRefs: true, lineWidth: -1 }) };
  }

  // ------------------------------------------------------------------- Uptime
  const PERIODS = { day: 86400, week: 604800, month: 2629746, quarter: 7889238, year: 31556952 }; // month = 1/12 Gregorian year
  function allowedDowntime(slaPct) {
    if (!(slaPct >= 0 && slaPct <= 100)) return fail('sla', 'Use an availability from 0% to 100%.');
    const down = 1 - slaPct / 100;
    return { ok: true, seconds: Object.fromEntries(Object.entries(PERIODS).map(([k, s]) => [k, s * down])) };
  }
  function availabilityFromDowntime(downSeconds, periodSeconds) {
    if (!(periodSeconds > 0)) return fail('period', 'Choose a period.');
    if (!(downSeconds >= 0) || downSeconds > periodSeconds) return fail('downtime', 'Downtime must be between zero and the length of the period.');
    return { ok: true, pct: (1 - downSeconds / periodSeconds) * 100 };
  }
  // Error budget: allowed downtime for the target minus downtime used.
  function errorBudget(slaPct, periodSeconds, usedSeconds) {
    const allowed = periodSeconds * (1 - slaPct / 100);
    return { allowed, used: usedSeconds, remaining: allowed - usedSeconds, consumedPct: allowed > 0 ? (usedSeconds / allowed) * 100 : (usedSeconds > 0 ? Infinity : 0) };
  }
  // Steady-state availability from failure and repair times: MTBF / (MTBF + MTTR).
  function availabilityFromIncidents(incidents, mttrSeconds, periodSeconds) {
    if (!(incidents >= 0) || !(mttrSeconds >= 0)) return fail('incidents', 'Use zero or more incidents and repair minutes.');
    const down = incidents * mttrSeconds;
    if (down > periodSeconds) return fail('incidents', 'Total repair time is longer than the period.');
    return { ok: true, downSeconds: down, pct: (1 - down / periodSeconds) * 100, mtbfSeconds: incidents ? (periodSeconds - down) / incidents : null };
  }
  // Serial components multiply; redundant copies fail only if all fail.
  const serialAvailability = pcts => pcts.reduce((a, p) => a * (p / 100), 1) * 100;
  const parallelAvailability = (pct, copies) => (1 - Math.pow(1 - pct / 100, copies)) * 100;
  function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return 'Not available';
    const neg = seconds < 0; let s = Math.abs(seconds);
    if (s < 1) return `${neg ? '-' : ''}${(s * 1000).toFixed(s < 0.01 ? 2 : 0)} ms`;
    const parts = [];
    for (const [unit, size] of [['d', 86400], ['h', 3600], ['m', 60]]) { const n = Math.floor(s / size); if (n) { parts.push(`${n}${unit}`); s -= n * size; } }
    if (s >= 0.05 || !parts.length) parts.push(`${Number(s.toFixed(parts.length ? 0 : 1))}s`);
    return `${neg ? '-' : ''}${parts.slice(0, 3).join(' ')}`;
  }

  // --------------------------------------------------------------------- Cron
  // Standard five-field cron (minute hour day-of-month month day-of-week), as
  // used by Vixie cron and most Linux systems. When both day fields are
  // restricted, a time matches if EITHER matches.
  const CRON_FIELDS = [
    { name: 'minute', min: 0, max: 59 }, { name: 'hour', min: 0, max: 23 }, { name: 'day of month', min: 1, max: 31 },
    { name: 'month', min: 1, max: 12, names: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] },
    { name: 'day of week', min: 0, max: 7, names: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] }
  ];
  const MACROS = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
  function parseCronField(text, def, index) {
    const values = new Set();
    const label = def.name;
    const toNum = token => {
      const upper = token.toUpperCase();
      if (def.names && def.names.includes(upper)) return def.names.indexOf(upper) + (index === 3 ? 1 : 0);
      if (!/^\d+$/.test(token)) return NaN;
      return Number(token);
    };
    for (const part of text.split(',')) {
      if (!part) return { error: `The ${label} field has an empty item between commas.` };
      const [rangeText, stepText, extra] = part.split('/');
      if (extra !== undefined) return { error: `"${part}" in the ${label} field has more than one /.` };
      let step = 1;
      if (stepText !== undefined) { if (!/^\d+$/.test(stepText) || Number(stepText) < 1) return { error: `The step after / in the ${label} field must be a whole number of 1 or more.` }; step = Number(stepText); }
      let lo; let hi;
      if (rangeText === '*') { lo = def.min; hi = index === 4 ? 6 : def.max; }
      else if (rangeText.includes('-')) { const [a, b] = rangeText.split('-'); lo = toNum(a); hi = toNum(b); }
      else { lo = toNum(rangeText); hi = stepText !== undefined ? (index === 4 ? 6 : def.max) : lo; }
      if (Number.isNaN(lo) || Number.isNaN(hi)) return { error: `"${part}" is not valid in the ${label} field.` };
      if (lo < def.min || hi > def.max || lo > def.max) return { error: `The ${label} field allows ${def.min} to ${def.max}${def.names ? ` or names such as ${def.names[0]}` : ''}.` };
      if (lo > hi) return { error: `The range ${rangeText} in the ${label} field runs backwards.` };
      for (let v = lo; v <= hi; v += step) values.add(index === 4 && v === 7 ? 0 : v);
    }
    return { values: [...values].sort((a, b) => a - b), star: text === '*' || /^\*\/1$/.test(text) };
  }
  function parseCron(expression) {
    let text = String(expression ?? '').trim().replace(/\s+/g, ' ');
    if (!text) return fail('empty', 'Enter a cron expression, such as 0 9 * * 1-5.');
    if (text.length > 200) return fail('length', 'The expression is too long.');
    if (text.startsWith('@')) {
      if (text === '@reboot') return fail('reboot', '@reboot runs once when the system starts, so it has no schedule to show.');
      if (!MACROS[text]) return fail('macro', `${text} is not a standard cron shortcut. Use @hourly, @daily, @weekly, @monthly or @yearly.`);
      text = MACROS[text];
    }
    const parts = text.split(' ');
    if (parts.length === 6) return fail('fields', 'This has six fields. Standard cron uses five (minute, hour, day of month, month, day of week). Remove the seconds or year field.');
    if (parts.length !== 5) return fail('fields', `Standard cron needs five fields separated by spaces. This has ${parts.length}.`);
    const fields = [];
    for (let i = 0; i < 5; i += 1) { const f = parseCronField(parts[i], CRON_FIELDS[i], i); if (f.error) return fail('field', f.error, { field: i }); fields.push(f); }
    return { ok: true, expression: parts.join(' '), fields, domStar: parts[2] === '*', dowStar: parts[4] === '*' };
  }
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Groups runs of three or more consecutive values: [9,10,11,12] -> "9 to 12".
  function compact(values, name = String) {
    const out = []; let i = 0;
    while (i < values.length) {
      let j = i;
      while (j + 1 < values.length && values[j + 1] === values[j] + 1) j += 1;
      if (j - i >= 2) { out.push(`${name(values[i])} to ${name(values[j])}`); i = j + 1; } else { out.push(name(values[i])); i += 1; }
    }
    return out;
  }
  const listWords = items => (items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
  function describeCron(parsed) {
    const [mi, ho, dom, mo, dow] = parsed.fields;
    const pad = n => String(n).padStart(2, '0');
    const all = (f, count) => f.values.length === count;
    let time;
    if (all(mi, 60) && all(ho, 24)) time = 'every minute';
    else if (all(ho, 24) && mi.values.length === 1) time = `at minute ${mi.values[0]} of every hour`;
    else if (mi.values.length === 1 && ho.values.length <= 6) time = `at ${listWords(ho.values.map(h => `${pad(h)}:${pad(mi.values[0])}`))}`;
    else time = `at minute ${listWords(compact(mi.values))} past ${all(ho, 24) ? 'every hour' : `hour ${listWords(compact(ho.values))}`}`;
    const parts = [time];
    const domText = all(dom, 31) ? '' : `on day ${listWords(compact(dom.values))} of the month`;
    const dowText = all(dow, 7) ? '' : `on ${listWords(compact(dow.values, d => DAYS[d]))}`;
    if (domText && dowText && !parsed.domStar && !parsed.dowStar) parts.push(`${domText} or ${dowText}`);
    else if (domText) parts.push(domText);
    else if (dowText) parts.push(dowText);
    if (!all(mo, 12)) parts.push(`in ${listWords(compact(mo.values, m => MONTHS[m - 1]))}`);
    const text = parts.join(', ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  }
  // Next run times, searched hour by hour in the chosen zone. zoneParts(ms)
  // returns { year, month, day, hour, minute, weekday } in that zone.
  function nextCronRuns(parsed, { from, count = 5, zoneParts, maxHours = 24 * 366 * 5 }) {
    const [mi, ho, dom, mo, dow] = parsed.fields.map(f => new Set(f.values));
    const dayMatch = p => {
      const d = dom.has(p.day); const w = dow.has(p.weekday);
      if (!parsed.domStar && !parsed.dowStar) return d || w;
      return (parsed.domStar || d) && (parsed.dowStar || w);
    };
    const runs = [];
    let t = Math.floor(from / 60000) * 60000 + 60000; // the next whole minute
    t -= (zoneParts(t).minute) * 60000; // back to the start of the local hour
    for (let h = 0; h < maxHours && runs.length < count; h += 1, t += 3600000) {
      const p = zoneParts(t);
      if (!mo.has(p.month) || !ho.has(p.hour) || !dayMatch(p)) continue;
      for (const m of mi) {
        const at = t + m * 60000;
        if (at <= from) continue;
        const q = zoneParts(at);
        if (q.hour !== p.hour || q.minute !== m) continue; // skipped or shifted by a clock change
        runs.push(at);
        if (runs.length >= count) break;
      }
    }
    return runs;
  }

  root.StackRowUtilityTools = {
    Passphrase: { SEPARATORS, randomIndex, passphraseEntropy, generatePassphrase, generatePassphrases, strengthBand, exhaustYears },
    Yaml: { YAML_LIMITS, parseYamlSafely, formatYaml, yamlToJson, jsonToYaml },
    Uptime: { PERIODS, allowedDowntime, availabilityFromDowntime, errorBudget, availabilityFromIncidents, serialAvailability, parallelAvailability, formatDuration },
    Cron: { CRON_FIELDS, MACROS, parseCron, describeCron, nextCronRuns }
  };
})(typeof window !== 'undefined' ? window : globalThis);
