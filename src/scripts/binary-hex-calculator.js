// Binary, octal, decimal, and hexadecimal calculator interface. Formulas
// live in tool-formulas.js and use BigInt, so large values stay exact.
(function () {
  'use strict';
  const { Base } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Base || !T) return;
  const NAMES = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };

  // Reads one value. Signed non-decimal input is a two's complement pattern.
  function read(c, name, base, signed, widthChoice) {
    const parsed = Base.parse(c.value(name), Number(base));
    if (parsed.empty) { c.fail(name, 'Enter a value.'); return null; }
    if (parsed.error) { c.fail(name, parsed.error); return null; }
    let value = parsed.value;
    if (signed && base !== '10' && value >= 0n) {
      const width = widthChoice === 'auto' ? Base.fitWidth(value, false) : Number(widthChoice);
      if (!Base.fits(value, width, false)) { c.fail(name, `The bit pattern is wider than ${width} bits.`); return null; }
      value = Base.fromTwos(value, width);
    }
    c.clear(name);
    return value;
  }

  function table(value, width, signed, copyButton) {
    const list = el('dl', 'calc-bases');
    const rows = [
      ['Decimal', Base.format(value, 10)],
      ['Hexadecimal', Base.group(Base.format(value, 16).toUpperCase(), 4)],
      ['Binary', Base.group(Base.format(value, 2), 4)],
      ['Octal', Base.format(value, 8)]
    ];
    if (width) rows.push([`${width}-bit two's complement`, Base.group(Base.twos(value, width), 4)], [`${width}-bit hex pattern`, Base.group(BigInt(`0b${Base.twos(value, width)}`).toString(16).toUpperCase().padStart(width / 4, '0'), 4)]);
    for (const [label, text] of rows) {
      const row = el('div', 'calc-base-row');
      const dd = el('dd');
      dd.append(el('code', '', text), copyButton(text.replace(/ /g, ''), label));
      row.append(el('dt', '', label), dd);
      list.append(row);
    }
    return { node: list, rows };
  }

  T.mount({
    name: 'Binary and Hex Calculator',
    file: 'binary-hex-calculation',
    storeKey: 'stackrow:binary-hex:v1',
    live: true,
    modeNames: { convert: 'Convert', math: 'Arithmetic' },
    example: { mode: 'math', values: { a: 'FF', op: 'add', b: '1', mbase: '16', width: '8', sign: 'unsigned' } },
    compute(c, { copyButton }) {
      const signed = c.value('sign') === 'signed';
      const widthChoice = c.value('width');
      let value;
      const inputs = [];
      const lines = [];
      if (c.mode === 'convert') {
        const base = c.value('base');
        value = read(c, 'value', base, signed, widthChoice);
        if (value === null) return null;
        inputs.push(['Value', c.value('value').trim()], ['Input base', NAMES[base]]);
      } else {
        const base = c.value('mbase');
        const a = read(c, 'a', base, signed, widthChoice);
        const b = read(c, 'b', base, signed, widthChoice);
        if (a === null || b === null) return null;
        const r = Base.operate(a, b, c.value('op'));
        if (r.error) { c.fail('b', r.error); return null; }
        value = r.value;
        inputs.push(['First value', c.value('a').trim()], ['Operation', c.value('op')], ['Second value', c.value('b').trim()], ['Base', NAMES[base]]);
        if (r.remainder !== undefined) lines.push(`Integer division drops the fraction. The remainder is ${Base.format(r.remainder, 10)} in decimal (${Base.format(r.remainder, Number(base)).toUpperCase()} in ${NAMES[base].toLowerCase()}).`);
      }
      inputs.push(['Bit width', widthChoice === 'auto' ? 'Automatic' : `${widthChoice}-bit`], ['Integer type', signed ? 'Signed' : 'Unsigned']);
      const auto = Base.fitWidth(value, signed || value < 0n);
      const width = widthChoice === 'auto' ? auto : Number(widthChoice);
      let warning = '';
      if (!width) warning = 'The result needs more than 128 bits, so no fixed-width pattern is shown.';
      else if (!Base.fits(value, width, signed || value < 0n)) warning = `The result does not fit in ${width} bits${signed ? ' as a signed integer' : value < 0n ? ' because unsigned integers cannot be negative' : ''}. The bit pattern shown wraps around, which is how fixed-width hardware overflows.`;
      const { node, rows } = table(value, width, signed, copyButton);
      const bits = Base.bitLength(value);
      lines.unshift(`The value needs ${bits} bit${bits === 1 ? '' : 's'}${value < 0n ? ' of magnitude plus a sign' : ''}. The smallest standard ${signed || value < 0n ? 'signed' : 'unsigned'} width that holds it is ${auto ? `${auto}-bit` : 'over 128 bits'}.`);
      return {
        metrics: [],
        nodes: [node],
        lines,
        warning,
        inputs,
        outputs: rows
      };
    }
  });
})();
