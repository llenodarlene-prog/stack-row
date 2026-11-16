// Free Invoice Generator interface. Money math lives in
// business-tool-formulas.js. Everything stays in this browser: drafts are
// saved only after the person ticks the save box, the logo is redrawn
// locally, and the invoice is built with text nodes only.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const B = window.StackRowBusinessTools;
  if (!T || !B?.Invoice) return;
  const I = B.Invoice;
  const $ = id => document.getElementById(id);
  const host = $('calculator');
  const form = host.querySelector('.calc-form');
  host.classList.add('calc-invoice');
  const linesBox = $('inv-lines');
  let logoData = '';
  let rowSeq = 0;
  let dueAuto = true;

  // ------------------------------------------------------------ Line rows
  const LINE_DEFS = [
    ['description', 'Description', 'text', 'inv-wide'], ['quantity', 'Quantity', 'decimal'], ['unit', 'Unit', 'text'],
    ['rate', 'Rate', 'decimal'], ['discount', 'Discount', 'decimal'], ['discountType', 'Discount type', 'select'], ['tax', 'Tax %', 'decimal', 'inv-linetax']
  ];
  function addRow(values = {}, after = null) {
    rowSeq += 1;
    const row = T.el('div', 'inv-line');
    row.dataset.row = String(rowSeq);
    const grid = T.el('div', 'inv-line-grid');
    for (const [key, label, kind, cls] of LINE_DEFS) {
      const field = T.el('div', `calc-field${cls ? ` ${cls}` : ''}`);
      const id = `inv-r${rowSeq}-${key}`;
      const lab = T.el('label', '', label); lab.htmlFor = id;
      let input;
      if (kind === 'select') {
        input = T.el('select');
        for (const [v, t] of [['percent', '%'], ['amount', 'Amount']]) { const o = T.el('option', '', t); o.value = v; input.append(o); }
      } else { input = T.el('input'); input.autocomplete = 'off'; if (kind === 'decimal') input.inputMode = 'decimal'; else input.maxLength = 500; }
      input.id = id; input.dataset.key = key;
      input.value = values[key] ?? (key === 'discountType' ? 'percent' : key === 'quantity' && !values.description ? '1' : '');
      const error = T.el('p', 'calc-error'); error.id = `${id}-error`; error.hidden = true;
      input.setAttribute('aria-describedby', error.id);
      field.append(lab, input, error);
      grid.append(field);
    }
    const actions = T.el('div', 'inv-line-actions');
    const button = (text, fn) => { const b = T.el('button', 'calc-link', text); b.type = 'button'; b.addEventListener('click', fn); actions.append(b); return b; };
    button('Move up', () => { const prev = row.previousElementSibling; if (prev) { linesBox.insertBefore(row, prev); changed(row, 'moved up'); } });
    button('Move down', () => { const next = row.nextElementSibling; if (next) { linesBox.insertBefore(next, row); changed(row, 'moved down'); } });
    button('Duplicate', () => { const copy = addRow(readRow(row), row); copy.querySelector('input').focus(); changed(copy, 'duplicated'); });
    button('Remove', () => { const focusTarget = row.nextElementSibling || row.previousElementSibling; row.remove(); if (!linesBox.children.length) addRow(); renumber(); (focusTarget?.querySelector('input') || $('inv-add')).focus(); app?.announce('Line removed.'); form.dispatchEvent(new Event('input')); });
    actions.append(T.el('span', 'inv-line-amount'));
    row.append(grid, actions);
    if (after) after.insertAdjacentElement('afterend', row); else linesBox.append(row);
    renumber();
    syncTaxMode();
    return row;
  }
  // Inputs are named by position so error messages point at the right line.
  function renumber() {
    [...linesBox.children].forEach((row, index) => {
      for (const input of row.querySelectorAll('[data-key]')) input.name = `line-${index}-${input.dataset.key}`;
      row.setAttribute('aria-label', `Line ${index + 1}`);
      for (const b of row.querySelectorAll('.inv-line-actions button')) b.setAttribute('aria-label', `${b.textContent} line ${index + 1}`);
    });
  }
  function changed(row, what) { renumber(); const index = [...linesBox.children].indexOf(row); app?.announce(`Line ${what}. It is now line ${index + 1}.`); row.querySelector('.inv-line-actions button')?.focus(); form.dispatchEvent(new Event('input')); }
  const readRow = row => Object.fromEntries([...row.querySelectorAll('[data-key]')].map(input => [input.dataset.key, input.value]));
  const readLines = () => [...linesBox.children].map(readRow);
  function syncTaxMode() {
    const mode = form.elements.taxMode?.value;
    for (const f of form.querySelectorAll('[data-taxmode]')) f.hidden = f.dataset.taxmode !== mode;
    for (const f of linesBox.querySelectorAll('.inv-linetax')) f.hidden = mode !== 'line';
  }
  $('inv-add').addEventListener('click', () => { if (linesBox.children.length >= I.INVOICE_LIMITS.maxLines) { app?.announce(`An invoice can have at most ${I.INVOICE_LIMITS.maxLines} lines.`); return; } addRow().querySelector('input').focus(); });

  // ------------------------------------------------------------ Dates
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function addDays(date, days) { const [y, m, d] = date.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + days)); return t.toISOString().slice(0, 10); }
  function autoDue() {
    if (!dueAuto) return;
    const issue = form.elements.issueDate.value;
    const days = { 'Due on receipt': 0, 'Net 7': 7, 'Net 15': 15, 'Net 30': 30, 'Net 60': 60 }[form.elements.terms.value];
    if (issue && days !== undefined) form.elements.dueDate.value = addDays(issue, days);
  }
  form.elements.dueDate.addEventListener('input', () => { dueAuto = false; });
  form.elements.terms.addEventListener('change', () => { dueAuto = true; autoDue(); });
  form.elements.issueDate.addEventListener('change', autoDue);
  form.elements.taxMode.addEventListener('change', syncTaxMode);
  const longDate = value => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return ''; const [y, m, d] = value.split('-').map(Number); return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d))); };

  // ------------------------------------------------------------ Draft state
  function collectDraft() {
    const fields = {};
    for (const key of I.TEXT_FIELDS) fields[key] = String(form.elements[key]?.value ?? '');
    return { fields, lines: readLines(), logo: logoData };
  }
  function applyDraft(draft) {
    for (const key of I.TEXT_FIELDS) if (form.elements[key]) form.elements[key].value = draft.fields[key] ?? '';
    if (!form.elements.currency.value) form.elements.currency.value = 'USD';
    linesBox.replaceChildren();
    for (const line of draft.lines) addRow(line);
    if (!draft.lines.length) addRow();
    setLogo(draft.logo || '');
    dueAuto = !draft.fields.dueDate;
    syncTaxMode();
  }

  // ------------------------------------------------------------ Logo
  function setLogo(data) {
    logoData = data;
    $('inv-logo-remove').hidden = !data;
    $('inv-logo-status').textContent = data ? 'Logo added. It stays in this browser.' : 'The logo is resized in your browser and never uploaded. SVG files are not accepted.';
  }
  $('inv-logo-remove').addEventListener('click', () => { setLogo(''); form.dispatchEvent(new Event('input')); $('inv-logo').focus(); app?.announce('Logo removed.'); });
  $('inv-logo').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const status = $('inv-logo-status');
    if (file.size > I.INVOICE_LIMITS.maxLogoBytes) { status.textContent = `${file.name} is ${T.formatBytes(file.size)}. Use an image of 1 MB or less.`; return; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = I.sniffImage(bytes);
    if (!type) { status.textContent = 'Use a PNG, JPEG, WebP or GIF image. SVG and other formats are not accepted, because they can contain scripts or links.'; return; }
    try {
      const bitmap = await createImageBitmap(new Blob([bytes], { type }));
      if (bitmap.width > I.INVOICE_LIMITS.maxLogoSide || bitmap.height > I.INVOICE_LIMITS.maxLogoSide) { status.textContent = `The image is ${bitmap.width} × ${bitmap.height} pixels. Use one no larger than 4,000 pixels on each side.`; return; }
      // Redraw through a canvas so only plain pixels are kept.
      let scale = Math.min(1, 600 / bitmap.width, 300 / bitmap.height);
      let data = '';
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        data = canvas.toDataURL('image/png');
        if (data.length <= 400000) break;
        scale *= 0.6;
      }
      setLogo(data);
      form.dispatchEvent(new Event('input'));
      app?.announce('Logo added.');
    } catch { status.textContent = 'This image could not be read. Try saving it again as PNG.'; }
  });

  // ------------------------------------------------------------ Invoice view
  function documentView(f, r) {
    const money = v => I.formatMoney(v, r.currency);
    const doc = T.el('article', 'inv-doc'); doc.setAttribute('aria-label', 'Invoice preview');
    const head = T.el('div', 'inv-head');
    const left = T.el('div');
    if (logoData) { const img = T.el('img', 'inv-logo'); img.src = logoData; img.alt = f.sellerName ? `${f.sellerName} logo` : 'Business logo'; left.append(img); }
    left.append(T.el('h3', '', 'INVOICE'));
    const meta = T.el('div', 'inv-meta');
    const metaLine = (label, value) => { if (value) { const p = T.el('p'); p.append(T.el('span', 'inv-label', `${label} `), document.createTextNode(value)); meta.append(p); } };
    metaLine('Invoice', f.number); metaLine('Issued', longDate(f.issueDate)); metaLine('Due', longDate(f.dueDate)); metaLine('Terms', f.terms); metaLine('PO', f.po);
    head.append(left, meta);
    const parties = T.el('div', 'inv-parties');
    const party = (title, prefix) => {
      const box = T.el('div'); box.append(T.el('p', 'inv-label', title));
      for (const key of ['Name', 'Address', 'Email', 'Phone']) { const v = f[`${prefix}${key}`]; if (v) box.append(T.el('p', key === 'Name' ? 'inv-strong-text' : '', v)); }
      if (f[`${prefix}TaxId`]) box.append(T.el('p', '', `${f[`${prefix}TaxLabel`] || 'Tax ID'}: ${f[`${prefix}TaxId`]}`));
      return box;
    };
    parties.append(party('From', 'seller'), party('Bill to', 'customer'));
    const table = T.el('table', 'inv-items');
    const thead = T.el('thead'); const hr = T.el('tr');
    const cols = ['Description', 'Qty', 'Rate', 'Discount', ...(f.taxMode === 'line' ? ['Tax'] : []), 'Amount'];
    cols.forEach((c, i) => { const th = T.el('th', i ? 'num' : '', c); th.scope = 'col'; hr.append(th); });
    thead.append(hr);
    const tbody = T.el('tbody');
    readLines().forEach((line, i) => {
      const calc = r.lines[i];
      const tr = T.el('tr');
      const cells = [line.description || `Item ${i + 1}`, `${line.quantity || '0'}${line.unit ? ` ${line.unit}` : ''}`, line.rate ? money(B.Decimal.parseDecimal(line.rate).value) : money(0n), calc.discount > 0n ? `-${money(calc.base - calc.net > 0n ? calc.base - calc.net : calc.discount)}` : '', ...(f.taxMode === 'line' ? [line.tax ? `${line.tax}%` : '0%'] : []), money(calc.net)];
      cells.forEach((c, k) => tr.append(T.el('td', k ? 'num' : '', c)));
      tbody.append(tr);
    });
    table.append(thead, tbody);
    const wrap = T.el('div', 'calc-table-wrap'); wrap.append(table);
    const totals = T.el('table', 'inv-totals');
    const tt = T.el('tbody');
    const total = (label, value, strong) => { const tr = T.el('tr', strong ? 'inv-strong' : ''); tr.append(T.el('td', '', label), T.el('td', '', value)); tt.append(tr); };
    total('Subtotal', money(r.subtotal));
    if (r.invoiceDiscount) total(`Discount${f.discountType === 'percent' && f.discount ? ` (${f.discount}%)` : ''}`, `-${money(r.invoiceDiscount)}`);
    if (r.shipping) total('Shipping', money(r.shipping));
    if (r.charge) total(f.chargeLabel || 'Other charge', money(r.charge));
    if (f.taxMode !== 'none') total(f.taxMode === 'invoice' ? `Tax (${f.taxRate || '0'}%)` : 'Tax', money(r.tax));
    total('Total', money(r.total), true);
    if (r.paid) total('Paid', `-${money(r.paid)}`);
    total(r.credit ? 'Credit balance' : 'Balance due', money(r.credit ? -r.balance : r.balance), true);
    totals.append(tt);
    doc.append(head, parties, wrap, totals);
    const notes = T.el('div', 'inv-notes');
    for (const [label, key] of [['Notes', 'notes'], ['Payment instructions', 'payment'], ['Terms', 'termsText']]) if (f[key]) notes.append(T.el('p', 'inv-label', label), T.el('p', '', f[key]));
    if (notes.childNodes.length) doc.append(notes);
    return doc;
  }

  // ------------------------------------------------------------ Mount
  const app = T.mount({
    icon: 'file-invoice', name: 'Invoice Generator', file: 'invoice', noun: 'invoice', doneWord: 'updated',
    labels: { submit: 'Update invoice', reset: 'Start a new invoice', copy: 'Copy summary', print: 'Print or save as PDF', forget: 'Forget saved draft', save: 'Save this draft in this browser' },
    persistence: 'opt-in', share: { mode: 'disabled' }, saveLive: true,
    storeKey: 'stackrow:invoice:draft:v1',
    privacyMessage: 'Your invoice stays in this browser. Nothing is uploaded or sent, and a draft is saved only if you tick the box. This tool does not send invoices, take payments, or give tax advice.',
    example: { values: { sellerName: 'Northwind Studio LLC', sellerAddress: '200 Harbor Street\nPortland, OR 97201', sellerEmail: 'billing@northwind.example', customerName: 'Bright Path Clinic', customerAddress: '45 Elm Avenue\nSalem, OR 97301', number: 'INV-0042', po: 'PO-7781', currency: 'USD', terms: 'Net 30', discount: '10', discountType: 'percent', taxMode: 'invoice', taxRate: '8.25', taxShipping: 'no', shipping: '15', paid: '100', notes: 'Thank you for your business.', payment: 'Bank transfer details are on the attached statement.' } },
    exporters: [{ label: 'Download draft (JSON)', mime: 'application/json;charset=utf-8', extension: 'json', filename: () => `stack-row-invoice-${(form.elements.number.value || 'draft').trim()}`, build: () => I.draftToJson(collectDraft()) }],
    saveState: () => JSON.parse(I.draftToJson(collectDraft())),
    loadState(extra) { const r = I.validateDraft(JSON.stringify(extra)); if (!r.ok) return false; applyDraft(r.draft); return true; },
    onReset() { linesBox.replaceChildren(); addRow(); setLogo(''); setDefaults(); },
    onRestore() { syncTaxMode(); },
    copy(last) { return last.summary; },
    compute(c) {
      const f = collectDraft().fields;
      const r = I.calculateInvoice({ currency: f.currency, taxMode: f.taxMode, taxRate: f.taxRate, taxShipping: f.taxShipping === 'yes', discount: f.discount, discountType: f.discountType, shipping: f.shipping, charge: f.charge, paid: f.paid, lines: readLines() });
      // Clear old errors on every field the calculation reads.
      for (const name of ['discount', 'taxRate', 'shipping', 'charge', 'paid', 'number', 'sellerName', 'customerName']) c.clear(name);
      linesBox.querySelectorAll('[aria-invalid]').forEach(input => c.clear(input.name));
      if (!r.ok) { for (const e of r.errors) if (form.elements[e.field]) c.fail(e.field, e.message); if (!r.errors.some(e => form.elements[e.field])) c.fail('discount', r.message); return null; }
      [...linesBox.children].forEach((row, i) => { row.querySelector('.inv-line-amount').textContent = I.formatMoney(r.lines[i].net, r.currency); });
      const money = v => I.formatMoney(v, r.currency);
      const warnings = [];
      if (f.issueDate && f.dueDate && f.dueDate < f.issueDate) warnings.push('The due date is before the issue date.');
      if (r.credit) warnings.push(`The amount paid is more than the total, leaving a credit of ${money(-r.balance)}.`);
      const missing = [['number', 'invoice number'], ['sellerName', 'business name'], ['customerName', 'customer name']].filter(([k]) => !f[k].trim()).map(([, l]) => l);
      if (missing.length) warnings.push(`Add the ${missing.join(', ')} before you send this invoice.`);
      const summary = [`Invoice ${f.number || '(no number)'}`, `From: ${f.sellerName}`, `Bill to: ${f.customerName}`, f.issueDate ? `Issued: ${longDate(f.issueDate)}` : '', f.dueDate ? `Due: ${longDate(f.dueDate)}` : '', '', ...readLines().map((l, i) => `${l.description || `Item ${i + 1}`}: ${l.quantity || 0} × ${l.rate || 0} = ${money(r.lines[i].net)}`), '', `Subtotal: ${money(r.subtotal)}`, r.invoiceDiscount ? `Discount: -${money(r.invoiceDiscount)}` : '', r.shipping ? `Shipping: ${money(r.shipping)}` : '', r.charge ? `${f.chargeLabel || 'Other charge'}: ${money(r.charge)}` : '', f.taxMode !== 'none' ? `Tax: ${money(r.tax)}` : '', `Total: ${money(r.total)}`, r.paid ? `Paid: -${money(r.paid)}` : '', `${r.credit ? 'Credit balance' : 'Balance due'}: ${money(r.credit ? -r.balance : r.balance)}`].filter(line => line !== null).join('\n').replace(/\n{3,}/g, '\n\n');
      return {
        summary,
        announce: `Invoice updated. ${r.credit ? 'Credit balance' : 'Balance due'} ${money(r.credit ? -r.balance : r.balance)}.`,
        metrics: [[r.credit ? 'Credit balance' : 'Balance due', money(r.credit ? -r.balance : r.balance), `Total ${money(r.total)} minus paid ${money(r.paid)}`, true], ['Total', money(r.total), 'Subtotal − discount + shipping + charges + tax'], ['Tax', money(r.tax), f.taxMode === 'line' ? 'Rounded on each line' : f.taxMode === 'invoice' ? `Rounded once on ${money(r.taxableBase)}` : 'No tax']],
        nodes: [documentView(f, r)],
        warning: warnings.join(' '),
        inputs: [['Invoice', f.number || 'Not set'], ['Currency', f.currency], ['Lines', String(readLines().length)]],
        outputs: [['Subtotal', money(r.subtotal)], ['Discount', money(r.invoiceDiscount)], ['Shipping', money(r.shipping)], ['Other charge', money(r.charge)], ['Tax', money(r.tax)], ['Total', money(r.total)], ['Paid', money(r.paid)], ['Balance due', money(r.balance)]]
      };
    }
  });

  function setDefaults() {
    if (!form.elements.issueDate.value) form.elements.issueDate.value = today();
    if (!form.elements.number.value) form.elements.number.value = 'INV-0001';
    dueAuto = true; autoDue(); syncTaxMode();
  }
  if (!linesBox.children.length) { addRow(); setDefaults(); app?.calculate({ explicit: false, save: false }); }

  // The example also needs line items, which are not named form fields.
  $('calc-example')?.addEventListener('click', () => {
    linesBox.replaceChildren();
    addRow({ description: 'Website design, 3 pages', quantity: '3', unit: 'pages', rate: '49.99', discount: '', discountType: 'percent' });
    addRow({ description: 'Content migration', quantity: '1.5', unit: 'hours', rate: '120', discount: '20', discountType: 'amount' });
    form.elements.issueDate.value = '2026-11-16'; dueAuto = true; autoDue();
    app?.calculate();
  });

  // Duplicate: same customer and lines, next number, today's date, nothing paid.
  const dup = T.el('button', 'calc-secondary', 'Duplicate invoice'); dup.type = 'button';
  dup.addEventListener('click', () => { form.elements.number.value = I.nextInvoiceNumber(form.elements.number.value); form.elements.issueDate.value = today(); form.elements.paid.value = ''; dueAuto = true; autoDue(); app?.calculate(); app?.announce(`Duplicated as invoice ${form.elements.number.value}.`); });
  host.querySelector('.calc-actions')?.append(dup);

  // Import a draft: size limit, then full validation before anything changes.
  $('inv-import').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > I.INVOICE_LIMITS.maxDraftBytes) { app?.announce('The draft file is too large.'); window.alert('The draft file is larger than 400 KB.'); return; }
    const r = I.validateDraft(await file.text());
    if (!r.ok) { app?.announce(r.message); window.alert(r.message); return; }
    applyDraft(r.draft);
    app?.calculate();
    app?.announce('Draft imported.');
  });
})();
