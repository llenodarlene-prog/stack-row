// Shared interface shell for Stack Row calculators. Each tool supplies a
// compute() function; this file handles tabs, validation messages, rendering
// result cards with DOM APIs (never innerHTML with user values), copy, share
// links, CSV, print, reset, and browser-only saved state. Nothing is sent to a
// server or to analytics.
(function (root) {
  'use strict';
  const CURRENCIES = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', CAD: 'en-CA', AUD: 'en-AU' };
  const MAX_INPUT = 1e15;

  // Parses a typed number. Accepts thousands separators, spaces, and currency
  // or percent symbols; rejects text, too many decimals, and out-of-range values.
  function parseNumber(raw, { whole = false, negative = false, decimals = 6 } = {}) {
    const text = String(raw ?? '').trim().replace(/[\s,$€£%]/g, '');
    if (!text) return { empty: true };
    if (!new RegExp(`^${negative ? '-?' : ''}\\d+(\\.\\d{1,${decimals}})?$`).test(text)) {
      if (!negative && /^-/.test(text)) return { error: 'Use zero or a positive number.' };
      return { error: 'Enter a number using digits and an optional decimal point.' };
    }
    const value = Number(text);
    if (!Number.isFinite(value) || Math.abs(value) > MAX_INPUT) return { error: 'Enter a smaller number.' };
    if (whole && !Number.isInteger(value)) return { error: 'Use a whole number.' };
    return { value };
  }
  const formatMoney = (value, code = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCIES[code] ? code : 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const formatNumber = (value, digits = 2) => (Number.isFinite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : 'Not available');
  const formatPercent = (value, digits = 2) => (value === null || !Number.isFinite(value) ? 'Not available' : `${value.toFixed(digits)}%`);
  // Spreadsheet apps run cells that start with these characters as formulas.
  const csvCell = value => { let text = String(value ?? ''); if (/^[=+\-@]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };

  function mount(tool) {
    const host = document.getElementById('calculator');
    if (!host) return;
    const $ = id => document.getElementById(id);
    const form = host.querySelector('.calc-form');
    const tabs = [...host.querySelectorAll('[role="tab"]')];
    const output = $('calc-output');
    const emptyState = [...output.childNodes].map(node => node.cloneNode(true));
    const status = $('calc-status');
    const warning = $('calc-warning');
    const actions = $('calc-result-actions');
    const modes = tabs.map(tab => tab.dataset.mode);
    let mode = modes[0] || 'default';
    let last = null;

    const store = {
      get() { try { return JSON.parse(localStorage.getItem(tool.storeKey) || 'null'); } catch { return null; } },
      set(value) { try { localStorage.setItem(tool.storeKey, JSON.stringify(value)); } catch { /* storage unavailable */ } },
      clear() { try { localStorage.removeItem(tool.storeKey); } catch { /* storage unavailable */ } }
    };
    const announce = message => { status.textContent = ''; window.setTimeout(() => { status.textContent = message; }, 30); };
    const flash = (button, text) => { const original = button.dataset.label || button.textContent; button.dataset.label = original; button.textContent = text; window.setTimeout(() => { button.textContent = original; }, 2000); };

    // Every text input gets an error line linked through aria-describedby.
    for (const input of form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"])')) {
      if (!input.id || document.getElementById(`${input.id}-error`)) continue;
      const error = el('p', 'calc-error'); error.id = `${input.id}-error`; error.hidden = true;
      input.insertAdjacentElement('afterend', error);
      input.setAttribute('aria-describedby', [error.id, input.getAttribute('aria-describedby')].filter(Boolean).join(' '));
    }

    function selectMode(next, { focus = false } = {}) {
      if (!modes.includes(next)) return;
      mode = next;
      for (const tab of tabs) {
        const on = tab.dataset.mode === next;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        $(tab.getAttribute('aria-controls')).hidden = !on;
        if (on && focus) tab.focus();
      }
      tool.onMode?.(next);
    }
    for (const tab of tabs) {
      tab.addEventListener('click', () => selectMode(tab.dataset.mode));
      tab.addEventListener('keydown', event => {
        const index = tabs.indexOf(tab);
        const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        selectMode(tabs[(target + tabs.length) % tabs.length].dataset.mode, { focus: true });
      });
    }

    function setError(input, message) {
      const error = document.getElementById(`${input.id}-error`);
      if (message) { input.setAttribute('aria-invalid', 'true'); if (error) { error.textContent = message; error.hidden = false; } }
      else { input.removeAttribute('aria-invalid'); if (error) { error.textContent = ''; error.hidden = true; } }
    }
    const active = node => !node.closest('[role="tabpanel"]')?.hidden && !node.closest('[data-hidden-by]')?.hidden;
    const fields = () => [...form.elements].filter(node => node.name && active(node));

    // The context handed to compute(): readers that validate and remember
    // which fields failed.
    function context(invalid) {
      return {
        mode,
        value: name => form.elements[name]?.value ?? '',
        checked: name => form.elements[name]?.checked === true,
        number(name, { required = false, label = 'a value', fallback = 0, min, max, ...options } = {}) {
          const input = form.elements[name];
          const parsed = parseNumber(input.value, options);
          let message = parsed.error || '';
          if (parsed.empty && required) message = `Enter ${label}.`;
          if (!message && !parsed.empty && min !== undefined && parsed.value < min) message = `Use ${min} or more.`;
          if (!message && !parsed.empty && max !== undefined && parsed.value > max) message = `Use ${max} or less.`;
          setError(input, message);
          if (message) { invalid.push(input); return NaN; }
          return parsed.empty ? fallback : parsed.value;
        },
        fail(name, message) { const input = form.elements[name]; setError(input, message); invalid.push(input); },
        clear(name) { setError(form.elements[name], ''); }
      };
    }

    function metric([label, value, formula, primary]) {
      const box = el('div', primary ? 'calc-metric calc-metric-primary' : 'calc-metric');
      box.append(el('p', 'calc-metric-label', label), el('p', 'calc-metric-value', value));
      if (formula) box.append(el('p', 'calc-metric-formula', formula));
      return box;
    }

    function show(result) {
      output.replaceChildren();
      const summary = el('div', 'calc-print-only');
      summary.append(el('h3', '', `${tool.modeNames?.[mode] || tool.name}: inputs`));
      const list = el('ul');
      for (const [label, text] of result.inputs) list.append(el('li', '', `${label}: ${text}`));
      summary.append(list);
      output.append(summary, ...result.metrics.map(metric), ...(result.nodes || []));
      if (result.lines?.length) {
        const box = el('div', 'calc-interpretation');
        for (const line of result.lines) box.append(el('p', '', line));
        output.append(box);
      }
      warning.textContent = result.warning || '';
      warning.hidden = !result.warning;
      actions.hidden = false;
      output.classList.remove('calc-updated'); void output.offsetWidth; output.classList.add('calc-updated');
    }

    function params() {
      const query = new URLSearchParams();
      if (modes.length) query.set('mode', mode);
      for (const node of fields()) {
        if (tool.private?.includes(node.name)) continue;
        if (node.type === 'radio') { if (node.checked) query.set(node.name, node.value); }
        else if (node.type === 'checkbox') { if (node.checked) query.set(node.name, '1'); }
        else if (node.value !== '') query.set(node.name, node.value);
      }
      return query;
    }

    function calculate({ explicit = true, save = true } = {}) {
      const invalid = [];
      const result = tool.compute(context(invalid), { money: value => formatMoney(value, form.elements.currency?.value), copyButton });
      if (invalid.length || !result) {
        if (explicit && invalid.length) { invalid[0].focus(); announce('Some fields need attention.'); }
        return null;
      }
      show(result);
      last = { ...result, mode, date: new Date().toISOString().slice(0, 10), params: params() };
      if (save) store.set({ values: Object.fromEntries(last.params), saved: Date.now() });
      if (explicit) {
        announce(`${tool.modeNames?.[mode] || tool.name} calculated.`);
        if (window.matchMedia('(max-width: 899px)').matches) $('calc-results-title').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
      return last;
    }

    // URL parameters win over saved values. Values are written into known
    // fields only; compute() validates them like typed input.
    function restore() {
      const query = new URLSearchParams(window.location.search);
      const saved = store.get();
      const source = [...query.keys()].length ? Object.fromEntries(query) : saved?.values;
      if (!source) return false;
      if (source.mode) selectMode(source.mode);
      let filled = false;
      for (const [name, raw] of Object.entries(source)) {
        const node = form.elements[name];
        const value = String(raw).slice(0, 80);
        if (!node || name === 'mode') continue;
        if (node instanceof RadioNodeList) { if ([...node].some(option => option.value === value)) { node.value = value; filled = true; } }
        else if (node.type === 'checkbox') node.checked = value === '1';
        else if (node.tagName === 'SELECT') { if ([...node.options].some(option => option.value === value)) node.value = value; }
        else { node.value = value; filled = true; }
      }
      tool.onRestore?.();
      return filled;
    }

    function clearAll() {
      form.reset();
      for (const input of form.querySelectorAll('[aria-invalid]')) setError(input, '');
      output.replaceChildren(...emptyState.map(node => node.cloneNode(true)));
      warning.hidden = true;
      actions.hidden = true;
      last = null;
      store.clear();
      tool.onReset?.();
      if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    }

    async function copyText(text, button, message) {
      try { await navigator.clipboard.writeText(text); if (button) flash(button, 'Copied'); announce(message); }
      catch { announce('Copy was blocked by the browser. Select and copy the text manually.'); }
    }
    function copyButton(text, label) {
      const button = el('button', 'calc-link calc-copy-one', 'Copy');
      button.type = 'button';
      button.setAttribute('aria-label', `Copy ${label}`);
      button.addEventListener('click', () => copyText(text, button, `${label} copied.`));
      return button;
    }
    const pageUrl = () => `${window.location.origin}${window.location.pathname}`;

    form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
    if (tool.live) form.addEventListener('input', () => calculate({ explicit: false, save: false }));
    form.elements.currency?.addEventListener('change', () => { if (last) calculate({ explicit: false }); });
    $('calc-example')?.addEventListener('click', event => {
      clearAll();
      const example = tool.example;
      if (example.mode) selectMode(example.mode);
      for (const [name, value] of Object.entries(example.values)) {
        const node = form.elements[name];
        if (node?.type === 'checkbox') node.checked = value === '1'; else if (node) node.value = value;
      }
      tool.onRestore?.();
      calculate();
      flash(event.currentTarget, 'Example loaded');
    });
    $('calc-reset').addEventListener('click', () => { clearAll(); if (modes.length) selectMode(modes[0]); form.querySelector('input:not([type="hidden"])')?.focus(); announce('Calculator reset.'); });
    $('calc-forget').addEventListener('click', () => { store.clear(); announce('Saved calculation removed from this browser.'); });
    $('calc-copy').addEventListener('click', event => {
      if (!last) return;
      const lines = [`Stack Row ${tool.name}${tool.modeNames ? `: ${tool.modeNames[last.mode]}` : ''}`, `Calculated: ${last.date}`, '', 'Inputs', ...last.inputs.map(([label, text]) => `${label}: ${text}`), '', 'Results', ...last.outputs.map(([label, text]) => `${label}: ${text}`), '', pageUrl()];
      copyText(lines.join('\n'), event.currentTarget, 'Results copied.');
    });
    $('calc-share').addEventListener('click', event => {
      if (!last) return;
      window.history.replaceState(null, '', `?${last.params.toString()}`);
      copyText(`${pageUrl()}?${last.params.toString()}`, event.currentTarget, 'Share link copied.');
    });
    $('calc-csv').addEventListener('click', () => {
      if (!last) return;
      const rows = [[`Stack Row ${tool.name}`], ...(tool.modeNames ? [['Calculation', tool.modeNames[last.mode]]] : []), ['Date', last.date], [], ['Inputs'], ...last.inputs, [], ['Results'], ...last.outputs];
      const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const link = el('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stack-row-${tool.file}-${last.date}.csv`;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      announce('CSV download started.');
    });
    $('calc-print').addEventListener('click', () => {
      if (!last) return;
      host.dataset.printDate = `Calculated ${last.date} · ${pageUrl()}`;
      window.print();
    });

    if (restore()) calculate({ explicit: false, save: false });
    else tool.onRestore?.();
  }

  root.StackRowTool = { mount, parseNumber, formatMoney, formatNumber, formatPercent, csvCell };
})(typeof window !== 'undefined' ? window : globalThis);
