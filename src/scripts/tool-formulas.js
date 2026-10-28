// Pure formulas for the Stack Row calculators. Nothing here touches the
// document, so the same functions run in the browser and in unit tests.
(function (root) {
  'use strict';
  const rate = (part, whole) => (whole > 0 ? (part / whole) * 100 : null);

  // Markup and margin. Markup is profit over cost; margin is profit over price.
  const Markup = {
    markupToMargin: markup => (markup > -100 ? (markup / (100 + markup)) * 100 : null),
    marginToMarkup: margin => (margin < 100 ? (margin / (100 - margin)) * 100 : null),
    // mode: 'markup' (cost + markup %), 'price' (cost + selling price), 'margin' (cost + target margin %).
    calculate({ mode, cost, markup = 0, price = 0, margin = 0, quantity = 1, discount = 0, tax = 0 }) {
      let selling = price;
      if (mode === 'markup') selling = cost * (1 + markup / 100);
      if (mode === 'margin') selling = margin < 100 ? cost / (1 - margin / 100) : NaN;
      const profit = selling - cost;
      const discounted = selling * (1 - discount / 100);
      const discountedProfit = discounted - cost;
      const taxAmount = discounted * (tax / 100);
      return {
        price: selling,
        profit,
        markup: rate(profit, cost),
        margin: rate(profit, selling),
        discounted,
        discountedProfit,
        discountedMargin: rate(discountedProfit, discounted),
        taxAmount,
        customerPrice: discounted + taxAmount,
        totalRevenue: discounted * quantity,
        totalCost: cost * quantity,
        totalProfit: discountedProfit * quantity
      };
    }
  };

  // Number bases with BigInt so 64-bit and larger values stay exact.
  const BASES = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i };
  const PREFIX = { 2: /^0b/i, 8: /^0o/i, 16: /^0x/i };
  const MAX_BITS = 128;
  const Base = {
    WIDTHS: [8, 16, 32, 64, 128],
    // Reads text in a base. A leading minus sign is allowed in any base.
    parse(text, base) {
      let clean = String(text ?? '').trim().replace(/[\s_]/g, '');
      if (!clean) return { empty: true };
      const negative = clean.startsWith('-');
      if (negative) clean = clean.slice(1);
      if (PREFIX[base]) clean = clean.replace(PREFIX[base], '');
      if (!BASES[base] || !BASES[base].test(clean)) return { error: `Use only ${{ 2: '0 and 1', 8: 'digits 0 to 7', 10: 'digits 0 to 9', 16: 'digits 0 to 9 and letters A to F' }[base]}.` };
      const digits = clean.toLowerCase();
      let value = 0n;
      for (const digit of digits) value = value * BigInt(base) + BigInt(parseInt(digit, 16));
      if (value >= 1n << BigInt(MAX_BITS)) return { error: `Use a value under ${MAX_BITS} bits.` };
      return { value: negative ? -value : value };
    },
    format(value, base) { return value < 0n ? `-${(-value).toString(base)}` : value.toString(base); },
    // Smallest standard width that holds the value (signed or unsigned).
    fitWidth(value, signed) {
      for (const width of Base.WIDTHS) if (Base.fits(value, width, signed)) return width;
      return null;
    },
    fits(value, width, signed) {
      const w = BigInt(width);
      return signed ? value >= -(1n << (w - 1n)) && value < 1n << (w - 1n) : value >= 0n && value < 1n << w;
    },
    // Reinterprets raw bits as a two's complement signed value.
    fromTwos(bits, width) {
      const w = BigInt(width);
      return bits >= 1n << (w - 1n) ? bits - (1n << w) : bits;
    },
    // Two's complement bit pattern of a value at a width.
    twos(value, width) {
      const modulus = 1n << BigInt(width);
      return (((value % modulus) + modulus) % modulus).toString(2).padStart(width, '0');
    },
    bitLength(value) { const abs = value < 0n ? -value : value; return abs === 0n ? 1 : abs.toString(2).length; },
    group(text, size) {
      const sign = text.startsWith('-') ? '-' : '';
      const body = sign ? text.slice(1) : text;
      const parts = [];
      for (let end = body.length; end > 0; end -= size) parts.unshift(body.slice(Math.max(0, end - size), end));
      return sign + parts.join(' ');
    },
    // Integer arithmetic. Division truncates toward zero and reports the remainder.
    operate(a, b, op) {
      if (op === 'add') return { value: a + b };
      if (op === 'subtract') return { value: a - b };
      if (op === 'multiply') return { value: a * b };
      if (op === 'divide') return b === 0n ? { error: 'Division by zero is undefined.' } : { value: a / b, remainder: a % b };
      return { error: 'Unknown operation.' };
    }
  };

  // RAID capacity and redundancy. Sizes are in decimal terabytes.
  const LEVELS = {
    0: { min: 2, data: n => n, tolerance: () => [0, 0], read: n => n, penalty: () => 1 },
    1: { min: 2, data: () => 1, tolerance: n => [n - 1, n - 1], read: n => n, penalty: n => n },
    5: { min: 3, data: n => n - 1, tolerance: () => [1, 1], read: n => n, penalty: () => 4 },
    6: { min: 4, data: n => n - 2, tolerance: () => [2, 2], read: n => n, penalty: () => 6 },
    10: { min: 4, even: true, data: n => n / 2, tolerance: n => [1, n / 2], read: n => n, penalty: () => 2 },
    50: { min: 6, groupMin: 3, data: (n, g) => n - g, tolerance: (n, g) => [1, g], read: n => n, penalty: () => 4 },
    60: { min: 8, groupMin: 4, data: (n, g) => n - 2 * g, tolerance: (n, g) => [2, 2 * g], read: n => n, penalty: () => 6 },
    jbod: { min: 1, data: n => n, tolerance: () => [0, 0], read: () => 1, penalty: () => 1 }
  };
  const TB_TO_TIB = 1e12 / 1024 ** 4;
  const Raid = {
    LEVELS: Object.keys(LEVELS),
    TB_TO_TIB,
    calculate({ level, disks, size, spares = 0, groups = 2 }) {
      const spec = LEVELS[level];
      if (!spec) return { error: 'Choose a RAID level.' };
      const n = disks - spares;
      if (spares >= disks) return { error: 'Leave at least one disk for the array after hot spares.' };
      if (n < spec.min) return { error: `RAID ${level === 'jbod' ? 'JBOD' : level} needs at least ${spec.min} active disks.` };
      if (spec.even && n % 2) return { error: 'RAID 10 needs an even number of active disks.' };
      if (spec.groupMin) {
        if (groups < 2) return { error: 'Use at least 2 groups.' };
        if (n % groups) return { error: `Active disks must divide evenly into ${groups} groups.` };
        if (n / groups < spec.groupMin) return { error: `Each group needs at least ${spec.groupMin} disks.` };
      }
      const data = spec.data(n, groups);
      const [guaranteed, best] = spec.tolerance(n, groups);
      const raw = disks * size;
      const usable = data * size;
      return {
        active: n,
        dataDisks: data,
        raw,
        usable,
        usableTib: usable * TB_TO_TIB,
        redundancy: (n - data) * size,
        spareCapacity: spares * size,
        efficiency: rate(usable, raw),
        guaranteed,
        best,
        readFactor: spec.read(n),
        writePenalty: spec.penalty(n)
      };
    }
  };

  // Transfer time. Sizes use bytes, speeds use bits per second.
  const SIZE_UNITS = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, PB: 1e15, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 };
  const SPEED_UNITS = { Kbps: 1e3, Mbps: 1e6, Gbps: 1e9, 'MB/s': 8e6, 'GB/s': 8e9 };
  const TIME_UNITS = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };
  const Transfer = {
    SIZE_UNITS, SPEED_UNITS, TIME_UNITS,
    efficiency: overhead => 1 - overhead / 100,
    time: (bytes, bps, overhead = 0) => (bytes * 8) / (bps * Transfer.efficiency(overhead)),
    speed: (bytes, seconds, overhead = 0) => (bytes * 8) / (seconds * Transfer.efficiency(overhead)),
    data: (bps, seconds, overhead = 0) => (bps * Transfer.efficiency(overhead) * seconds) / 8,
    duration(seconds) {
      if (!Number.isFinite(seconds)) return 'Not available';
      if (seconds < 1) return `${(seconds * 1000).toFixed(0)} milliseconds`;
      const parts = [];
      let rest = Math.round(seconds);
      for (const [label, size] of [['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]) {
        const count = Math.floor(rest / size);
        rest -= count * size;
        if (count) parts.push(`${count} ${label}${count === 1 ? '' : 's'}`);
      }
      return parts.slice(0, 3).join(' ');
    },
    // Picks a readable unit for a byte count or a bit rate.
    bytes(value) {
      for (const unit of ['PB', 'TB', 'GB', 'MB', 'KB']) if (value >= SIZE_UNITS[unit]) return `${(value / SIZE_UNITS[unit]).toFixed(2)} ${unit}`;
      return `${value.toFixed(0)} B`;
    },
    rate(bps) {
      for (const unit of ['Gbps', 'Mbps', 'Kbps']) if (bps >= SPEED_UNITS[unit]) return `${(bps / SPEED_UNITS[unit]).toFixed(2)} ${unit}`;
      return `${bps.toFixed(0)} bps`;
    }
  };

  // Return on investment.
  const Roi = {
    simple({ cost, value, years = 0 }) {
      const gain = value - cost;
      return {
        gain,
        roi: rate(gain, cost),
        annualized: cost > 0 && value >= 0 && years > 0 ? ((value / cost) ** (1 / years) - 1) * 100 : null
      };
    },
    project({ implementation = 0, training = 0, licensing = 0, operating = 0, revenue = 0, hours = 0, hourly = 0, months }) {
      const upfront = implementation + training;
      const monthlyCost = licensing + operating;
      const monthlyBenefit = revenue + hours * hourly;
      const totalCost = upfront + monthlyCost * months;
      const totalBenefit = monthlyBenefit * months;
      const net = totalBenefit - totalCost;
      const monthlyNet = monthlyBenefit - monthlyCost;
      const roi = rate(net, totalCost);
      const cumulative = [];
      for (let month = 1; month <= months; month++) cumulative.push(monthlyNet * month - upfront);
      return {
        upfront, monthlyCost, monthlyBenefit, totalCost, totalBenefit, net, monthlyNet, roi, cumulative,
        payback: monthlyNet > 0 ? upfront / monthlyNet : null,
        annualized: roi !== null && roi > -100 && months > 0 ? ((1 + roi / 100) ** (12 / months) - 1) * 100 : null
      };
    }
  };

  root.StackRowFormulas = { Markup, Base, Raid, Transfer, Roi };
})(typeof window !== 'undefined' ? window : globalThis);
