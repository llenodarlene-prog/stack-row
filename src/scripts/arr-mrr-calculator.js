// Interface for the ARR and MRR calculator. Formulas live in
// arr-mrr-formulas.js; this file reads inputs, validates them, renders results
// with DOM APIs (never innerHTML with user values) and handles copy, share,
// CSV, print, and saved state. Nothing is sent to a server or to analytics.
(function () {
  'use strict';
  const F = window.StackRowArrMrr;
  const root = document.getElementById('calculator');
  if (!F || !root) return;

  const STORE_KEY = 'stackrow-arr-mrr-v1';
  const MODES = ['quick', 'plans', 'movement'];
  const MAX_PLANS = 20;
  const MOVEMENT = [['start', 'mv-start', 'Starting MRR'], ['new', 'mv-new', 'New MRR'], ['expansion', 'mv-expansion', 'Expansion MRR'], ['reactivation', 'mv-reactivation', 'Reactivation MRR'], ['contraction', 'mv-contraction', 'Contraction MRR'], ['churn', 'mv-churn', 'Churned MRR']];
  const EXAMPLE = { start: '50000', new: '6000', expansion: '3000', reactivation: '1000', contraction: '1500', churn: '2500' };
  const MODE_NAMES = { quick: 'Quick Conversion', plans: 'Subscription Plans', movement: 'MRR Movement' };

  const $ = id => document.getElementById(id);
  const form = root.querySelector('.calc-form');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const output = $('calc-output');
  const status = $('calc-status');
  const warning = $('calc-warning');
  const actions = $('calc-result-actions');
  const currency = $('calc-currency');
  const plansList = $('calc-plans');
  const rowTemplate = $('calc-plan-row');
  let mode = 'quick';
  let last = null;
  let rowCounter = 0;

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; } },
    set(value) { try { localStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch { /* storage unavailable */ } },
    clear() { try { localStorage.removeItem(STORE_KEY); } catch { /* storage unavailable */ } }
  };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const money = value => F.formatCurrency(value, currency.value);
  const pct = F.formatPercentage;
  const announce = message => { status.textContent = ''; window.setTimeout(() => { status.textContent = message; }, 30); };
  const flash = (button, text) => { const original = button.dataset.label || button.textContent; button.dataset.label = original; button.textContent = text; window.setTimeout(() => { button.textContent = original; }, 2000); };

  // Tabs follow the ARIA tabs pattern: arrow keys move, Home/End jump.
  function selectMode(next, { focus = false, persist = true } = {}) {
    if (!MODES.includes(next)) return;
    mode = next;
    for (const tab of tabs) {
      const on = tab.dataset.mode === next;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) tab.focus();
    }
    if (next === 'plans' && !plansList.children.length) addPlan();
    if (persist) { const saved = store.get() || {}; saved.mode = next; store.set(saved); }
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

  function addPlan(values = {}) {
    if (plansList.children.length >= MAX_PLANS) { announce('You can add up to 20 plans.'); return null; }
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    rowCounter += 1;
    for (const field of row.querySelectorAll('.calc-field')) {
      const input = field.querySelector('input, select');
      const id = `plan-${rowCounter}-${input.dataset.field}`;
      input.id = id;
      field.querySelector('label').htmlFor = id;
      const error = field.querySelector('.calc-error');
      if (error) { error.id = `${id}-error`; input.setAttribute('aria-describedby', error.id); }
      if (values[input.dataset.field] !== undefined) input.value = values[input.dataset.field];
    }
    row.querySelector('.calc-remove').addEventListener('click', () => {
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      if (!plansList.children.length) addPlan();
      (next || plansList.firstElementChild)?.querySelector('input')?.focus();
      renumber();
    });
    plansList.append(row);
    renumber();
    return row;
  }
  function renumber() {
    [...plansList.children].forEach((row, index) => { row.querySelector('.calc-remove').setAttribute('aria-label', `Remove plan ${index + 1}`); });
    $('calc-add-plan').disabled = plansList.children.length >= MAX_PLANS;
  }
  $('calc-add-plan').addEventListener('click', () => addPlan()?.querySelector('input')?.focus());

  function setError(input, message) {
    const error = input.getAttribute('aria-describedby') ? document.getElementById(input.getAttribute('aria-describedby').split(' ')[0]) : null;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (error) { error.textContent = message; error.hidden = false; }
    } else {
      input.removeAttribute('aria-invalid');
      if (error) { error.textContent = ''; error.hidden = true; }
    }
  }
  function read(input, { required = false, whole = false, label = 'a value' } = {}) {
    const parsed = F.parseAmount(input.value, { whole });
    if (parsed.empty) {
      if (required) { setError(input, `Enter ${label}.`); return { invalid: true }; }
      setError(input, ''); return { value: 0 };
    }
    if (parsed.error) { setError(input, parsed.error); return { invalid: true }; }
    setError(input, ''); return { value: parsed.value };
  }

  // Reads and validates the active mode. Returns { inputs, invalid[] }.
  function validateCalculatorInputs() {
    const invalid = [];
    if (mode === 'quick') {
      const input = $('quick-amount');
      const amount = read(input, { required: true, label: 'a revenue amount' });
      if (amount.invalid) invalid.push(input);
      return { invalid, inputs: { amount: amount.value, from: form.elements.from.value } };
    }
    if (mode === 'plans') {
      const plans = [];
      for (const row of plansList.children) {
        const get = name => row.querySelector(`[data-field="${name}"]`);
        const customers = read(get('customers'), { required: true, whole: true, label: 'a customer count' });
        const price = read(get('price'), { required: true, label: 'a price' });
        if (customers.invalid) invalid.push(get('customers'));
        if (price.invalid) invalid.push(get('price'));
        plans.push({ name: get('name').value.trim().slice(0, 60), customers: customers.value, price: price.value, interval: get('interval').value });
      }
      return { invalid, inputs: { plans } };
    }
    const values = {};
    for (const [key, id, label] of MOVEMENT) {
      const input = $(id);
      const result = read(input, { required: key === 'start', label: `${label}` });
      if (result.invalid) invalid.push(input);
      values[key] = result.value;
    }
    values.month = $('mv-month').value;
    return { invalid, inputs: values };
  }

  function metric(label, value, formula, primary = false) {
    const box = el('div', primary ? 'calc-metric calc-metric-primary' : 'calc-metric');
    box.append(el('p', 'calc-metric-label', label), el('p', 'calc-metric-value', value));
    if (formula) box.append(el('p', 'calc-metric-formula', formula));
    return box;
  }
  function interpretation(lines) {
    const box = el('div', 'calc-interpretation');
    for (const line of lines) box.append(el('p', '', line));
    return box;
  }

  function render(inputs) {
    output.replaceChildren();
    warning.hidden = true;
    const result = { mode, currency: currency.value, date: new Date().toISOString().slice(0, 10), inputs: [], outputs: [] };
    if (mode === 'quick') {
      const r = F.calculateQuickConversion(inputs.amount, inputs.from);
      const fromArr = inputs.from === 'arr';
      output.append(
        metric(fromArr ? 'MRR' : 'ARR', money(fromArr ? r.mrr : r.arr), fromArr ? 'MRR = ARR ÷ 12' : 'ARR = MRR × 12', true),
        metric(fromArr ? 'Source ARR' : 'Source MRR', money(inputs.amount)),
        metric('Monthly equivalent', money(r.mrr)),
        metric('Annual equivalent', money(r.arr))
      );
      result.inputs.push([fromArr ? 'ARR' : 'MRR', inputs.amount]);
      result.outputs.push(['MRR', r.mrr], ['ARR', r.arr]);
    } else if (mode === 'plans') {
      const r = F.calculatePlanRevenue(inputs.plans);
      output.append(metric('Total MRR', money(r.totalMrr), 'Sum of each plan: customers × price ÷ months in the billing interval', true), metric('Total ARR', money(r.totalArr), 'ARR = MRR × 12'));
      const table = el('table', 'calc-table');
      const caption = el('caption', '', 'Plan contribution');
      const head = el('thead'); const headRow = el('tr');
      for (const text of ['Plan', 'Normalized MRR', 'Share']) { const th = el('th', '', text); th.scope = 'col'; headRow.append(th); }
      head.append(headRow);
      const body = el('tbody');
      r.rows.forEach((row, index) => {
        const tr = el('tr');
        const th = el('th', '', row.name || `Plan ${index + 1}`); th.scope = 'row';
        tr.append(th, el('td', '', money(row.mrr)), el('td', '', pct(row.share)));
        body.append(tr);
        result.inputs.push([`${row.name || `Plan ${index + 1}`} (${row.interval})`, `${row.customers} customers at ${row.price}`]);
        result.outputs.push([`${row.name || `Plan ${index + 1}`} normalized MRR`, row.mrr]);
      });
      table.append(caption, head, body);
      output.append(table);
      if (r.largestIndex !== null) {
        const top = r.rows[r.largestIndex];
        output.append(interpretation([`${top.name || `Plan ${r.largestIndex + 1}`} contributes the largest share of MRR at ${pct(top.share)}.`]));
      }
      result.outputs.push(['Total MRR', r.totalMrr], ['Total ARR', r.totalArr]);
    } else {
      const r = F.calculateMrrMovement({ start: inputs.start, newMrr: inputs.new, expansion: inputs.expansion, reactivation: inputs.reactivation, contraction: inputs.contraction, churn: inputs.churn });
      output.append(
        metric('Ending MRR', money(r.ending), 'Starting + new + expansion + reactivation - contraction - churned MRR', true),
        metric('Net new MRR', money(r.netNew), 'New + expansion + reactivation - contraction - churned MRR'),
        metric('Ending ARR', money(r.endingArr), 'Ending MRR × 12'),
        metric('MRR growth rate', pct(r.growthRate), 'Net new MRR ÷ starting MRR × 100'),
        metric('Gross revenue retention (GRR)', pct(r.grr), '(Starting - contraction - churned MRR) ÷ starting MRR × 100'),
        metric('Net revenue retention (NRR)', pct(r.nrr), '(Starting + expansion + reactivation - contraction - churned MRR) ÷ starting MRR × 100'),
        metric('Gross MRR churn rate', pct(r.grossChurnRate), '(Contraction + churned MRR) ÷ starting MRR × 100')
      );
      const lines = [];
      if (r.netNew > 0) lines.push('Ending MRR increased because new, expansion, and reactivation revenue exceeded contraction and churn.');
      else if (r.netNew < 0) lines.push('Ending MRR decreased because contraction and churn exceeded new, expansion, and reactivation revenue.');
      else lines.push('Ending MRR equals starting MRR because gains and losses offset each other.');
      if (r.nrr !== null) {
        if (r.nrr > 100) lines.push('NRR exceeded 100%, which means expansion and reactivation outweighed recurring-revenue losses from existing customers.');
        else if (r.nrr === 100) lines.push('NRR equals 100%, so expansion and reactivation exactly offset losses from existing customers.');
        else lines.push('NRR was below 100% because losses from existing customers exceeded their expansion and reactivation.');
        if (r.grr < 100) lines.push('GRR was below 100% because contraction or churn reduced the starting revenue base.');
      } else {
        lines.push('Starting MRR must be greater than zero to calculate rates.');
      }
      output.append(interpretation(lines));
      if (r.lossesExceedStart) {
        warning.textContent = 'Contraction and churn exceed starting MRR. The entered movements may overlap or use inconsistent definitions, so check them before relying on GRR.';
        warning.hidden = false;
      }
      for (const [key, , label] of MOVEMENT) result.inputs.push([label, inputs[key]]);
      if (inputs.month) result.inputs.push(['Measurement month', inputs.month]);
      result.outputs.push(['Ending MRR', r.ending], ['Net new MRR', r.netNew], ['Ending ARR', r.endingArr], ['MRR growth rate', r.growthRate, '%'], ['GRR', r.grr, '%'], ['NRR', r.nrr, '%'], ['Gross MRR churn rate', r.grossChurnRate, '%']);
    }
    const summary = el('div', 'calc-print-only');
    summary.append(el('h3', '', `${MODE_NAMES[result.mode]}: inputs`));
    const list = el('ul');
    for (const entry of result.inputs) list.append(el('li', '', `${entry[0]}: ${typeof entry[1] === 'number' ? money(entry[1]) : entry[1]}`));
    summary.append(list);
    output.prepend(summary);
    actions.hidden = false;
    last = result;
    return result;
  }

  function serializeCalculatorState(inputs) {
    const params = new URLSearchParams({ mode, currency: currency.value });
    if (mode === 'quick') { params.set('amount', String(inputs.amount)); params.set('from', inputs.from); }
    if (mode === 'plans') inputs.plans.forEach((plan, index) => { params.set(`p${index}`, `${plan.customers}_${plan.price}_${plan.interval}`); });
    if (mode === 'movement') for (const [key] of MOVEMENT) params.set(key, String(inputs[key]));
    return params;
  }

  // URL parameters win over saved values; every parameter is validated and
  // unknown ones are ignored.
  function restoreCalculatorState() {
    const params = new URLSearchParams(window.location.search);
    const saved = store.get();
    const source = params.has('mode') ? Object.fromEntries(params) : saved?.values ? { ...saved.values, mode: saved.mode, currency: saved.currency } : saved?.mode ? { mode: saved.mode } : null;
    if (!source) return false;
    if (F.CURRENCIES.includes(source.currency)) currency.value = source.currency;
    selectMode(MODES.includes(source.mode) ? source.mode : 'quick', { persist: false });
    const ok = value => value !== undefined && !F.parseAmount(value).error && !F.parseAmount(value).empty;
    let filled = false;
    if (mode === 'quick' && ok(source.amount)) { $('quick-amount').value = source.amount; if (source.from === 'arr') form.elements.from.value = 'arr'; filled = true; }
    if (mode === 'movement' && ok(source.start)) {
      for (const [key, id] of MOVEMENT) if (ok(source[key])) $(id).value = source[key];
      filled = true;
    }
    if (mode === 'plans') {
      const rows = [];
      for (let i = 0; i < MAX_PLANS; i++) {
        const raw = source[`p${i}`];
        if (!raw) continue;
        const [customers, price, interval] = String(raw).split('_');
        if (!F.parseAmount(customers, { whole: true }).error && ok(price) && F.INTERVAL_MONTHS[interval]) rows.push({ customers, price, interval });
      }
      if (rows.length) { plansList.replaceChildren(); for (const row of rows) addPlan(row); filled = true; }
      if (saved?.names && !params.has('mode')) [...plansList.children].forEach((row, i) => { if (saved.names[i]) row.querySelector('[data-field="name"]').value = saved.names[i]; });
    }
    return filled;
  }

  function calculate({ focusErrors = true, save = true } = {}) {
    const { invalid, inputs } = validateCalculatorInputs();
    if (invalid.length) {
      if (focusErrors) invalid[0].focus();
      announce('Some fields need attention.');
      return null;
    }
    const result = render(inputs);
    if (save) {
      const values = Object.fromEntries(serializeCalculatorState(inputs));
      store.set({ mode, currency: currency.value, values, names: mode === 'plans' ? inputs.plans.map(p => p.name) : undefined });
    }
    last.params = serializeCalculatorState(inputs);
    announce(`${MODE_NAMES[mode]} calculated.`);
    // On one-column layouts the results sit below the form, so bring them into view.
    if (focusErrors && window.matchMedia('(max-width: 899px)').matches) {
      $('calc-results-title').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
    return result;
  }

  form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
  currency.addEventListener('change', () => { if (last) calculate({ focusErrors: false }); });

  $('calc-example').addEventListener('click', event => {
    selectMode('movement');
    for (const [key, id] of MOVEMENT) $(id).value = EXAMPLE[key];
    calculate();
    flash(event.currentTarget, 'Example loaded');
  });

  function clearAll() {
    form.reset();
    for (const input of form.querySelectorAll('[aria-invalid]')) setError(input, '');
    plansList.replaceChildren();
    output.replaceChildren(el('p', 'calc-empty', 'Enter values and select Calculate to see results with their formulas.'));
    warning.hidden = true;
    actions.hidden = true;
    last = null;
    store.clear();
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }
  $('calc-reset').addEventListener('click', () => { clearAll(); selectMode('quick', { persist: false }); $('quick-amount').focus(); announce('Calculator reset.'); });
  $('calc-forget').addEventListener('click', () => { store.clear(); announce('Saved calculation removed from this browser.'); });

  const shareUrl = () => `${window.location.origin}${window.location.pathname}?${last.params.toString()}`;
  const display = ([, value, unit]) => (typeof value === 'number' ? (unit === '%' ? pct(value) : money(value)) : String(value));

  function copyResultSummary() {
    const lines = [`Stack Row ARR and MRR Calculator: ${MODE_NAMES[last.mode]}`, `Calculated: ${last.date}`, `Currency: ${last.currency}`, '', 'Inputs'];
    for (const entry of last.inputs) lines.push(`${entry[0]}: ${display(entry)}`);
    lines.push('', 'Results');
    for (const entry of last.outputs) lines.push(`${entry[0]}: ${display(entry)}`);
    lines.push('', `${window.location.origin}${window.location.pathname}`);
    return lines.join('\n');
  }
  async function copyText(text, button, message) {
    try { await navigator.clipboard.writeText(text); flash(button, 'Copied'); announce(message); }
    catch { announce('Copy was blocked by the browser. Select and copy the text manually.'); }
  }
  $('calc-copy').addEventListener('click', event => { if (last) copyText(copyResultSummary(), event.currentTarget, 'Results copied.'); });
  $('calc-share').addEventListener('click', event => { if (last) { window.history.replaceState(null, '', `?${last.params.toString()}`); copyText(shareUrl(), event.currentTarget, 'Share link copied.'); } });

  function downloadCsv() {
    const cell = value => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [['Stack Row ARR and MRR Calculator'], ['Calculation', MODE_NAMES[last.mode]], ['Date', last.date], ['Currency', last.currency], [], ['Inputs'], ...last.inputs.map(entry => [entry[0], typeof entry[1] === 'number' ? entry[1].toFixed(2) : entry[1]]), [], ['Results'], ...last.outputs.map(entry => [entry[0], typeof entry[1] === 'number' ? entry[1].toFixed(2) + (entry[2] === '%' ? '%' : '') : 'Not available'])];
    const blob = new Blob([rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = el('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stack-row-arr-mrr-calculation-${last.date}.csv`;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce('CSV download started.');
  }
  $('calc-csv').addEventListener('click', () => { if (last) downloadCsv(); });
  $('calc-print').addEventListener('click', () => {
    if (!last) return;
    root.dataset.printDate = `Calculated ${last.date} · ${window.location.origin}${window.location.pathname}`;
    window.print();
  });

  if (restoreCalculatorState()) calculate({ focusErrors: false, save: false });
})();
