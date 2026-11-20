// Cyberattack Tracker. Incidents come from cyber-incidents.js (checked by
// Stack Row editors). The live panel reads CISA's Known Exploited
// Vulnerabilities catalog from its public GitHub mirror, falling back to a
// bundled snapshot. Everything is rendered with DOM text nodes.
(function () {
  'use strict';
  const DATA = window.StackRowIncidents;
  const SNAP = window.StackRowKevSnapshot;
  if (!DATA) return;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const icon = name => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ti'); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', `#ti-${name}`); s.append(u); return s; };
  const TYPES = { all: ['All', 'list'], 'supply-chain': ['Supply chain', 'hierarchy-2'], ransomware: ['Ransomware', 'lock'], outage: ['Outage', 'alert-triangle'], 'ai-agent': ['AI agents', 'robot'] };
  const STATUS = { investigating: 'Investigating', contained: 'Contained', resolved: 'Resolved', policy: 'Policy change' };
  const AI = { 'none-found': 'No AI involvement found', 'none-reported': 'No AI link reported', reported: 'Agent activity reported', confirmed: 'Agent behavior confirmed', policy: 'AI agent policy' };
  const fmtDate = d => { const [y, m, day] = d.split('-').map(Number); return new Intl.DateTimeFormat('en-US', { month: 'short', day: day ? 'numeric' : undefined, year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, (m || 1) - 1, day || 1))); };
  const updated = new Date(DATA.updated);
  const incidents = DATA.incidents;
  const params = new URLSearchParams(location.search);
  let type = TYPES[params.get('type')] ? params.get('type') : 'all';

  // Summary stats.
  const stats = [
    ['Incidents tracked', String(incidents.length), `Since ${fmtDate(incidents.map(i => i.date).sort()[0].slice(0, 7))}`],
    ['Cyberattacks', String(incidents.filter(i => ['supply-chain', 'ransomware'].includes(i.type)).length), 'Supply chain and ransomware'],
    ['Outages', String(incidents.filter(i => i.type === 'outage').length), 'None caused by an attack'],
    ['Attacks with AI confirmed', String(incidents.filter(i => ['supply-chain', 'ransomware'].includes(i.type) && i.ai === 'confirmed').length), 'Across tracked attacks']
  ];
  const statBox = $('trk-stats');
  for (const [label, value, note] of stats) { const c = el('div', 'trk-stat'); c.append(el('p', 'trk-stat-value', value), el('p', 'trk-stat-label', label), el('p', 'trk-stat-note', note)); statBox.append(c); }
  const upd = el('p', 'trk-updated'); upd.append(el('span', 'trk-dot trk-dot-on'), document.createTextNode(`Incidents last checked ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(updated)} UTC`));
  statBox.append(upd);

  // Tabs.
  const tabs = [$('trk-tab-incidents'), $('trk-tab-live')];
  let liveLoaded = false;
  function select(tab, focus) {
    for (const t of tabs) { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $(t.getAttribute('aria-controls')).hidden = !on; }
    if (focus) tab.focus();
    if (tab.id === 'trk-tab-live' && !liveLoaded) { liveLoaded = true; loadKev(); }
  }
  tabs.forEach((t, i) => { t.addEventListener('click', () => select(t)); t.addEventListener('keydown', e => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); } }); });

  // Type chips.
  const chips = $('trk-types');
  for (const [key, [label, ic]] of Object.entries(TYPES)) {
    const count = key === 'all' ? incidents.length : incidents.filter(i => i.type === key).length;
    const b = el('button', 'tool-chip'); b.type = 'button'; b.dataset.type = key; b.setAttribute('aria-pressed', String(key === type));
    b.append(icon(ic), document.createTextNode(`${label} (${count})`));
    b.addEventListener('click', () => { type = key; for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.type === key)); render(true); });
    chips.append(b);
  }

  function card(i) {
    const li = el('li', `trk-item trk-${i.type}`); li.id = i.id;
    li.append(el('time', 'trk-date', fmtDate(i.date)));
    li.lastChild.dateTime = i.date;
    const body = el('article', 'trk-card');
    const tags = el('div', 'trk-tags');
    tags.append(el('span', `trk-tag trk-tag-${i.type}`, TYPES[i.type][0]), el('span', `trk-pill trk-pill-${i.status}`, STATUS[i.status]), el('span', `trk-ai trk-ai-${i.ai}`, AI[i.ai]));
    const h = el('h3', 'trk-title', i.title);
    const orgs = el('ul', 'trk-orgs'); orgs.setAttribute('aria-label', 'Organizations named');
    i.orgs.slice(0, 6).forEach(o => orgs.append(el('li', '', o)));
    if (i.orgs.length > 6) { const more = el('li', 'trk-more', `+${i.orgs.length - 6} more`); more.title = i.orgs.slice(6).join(', '); orgs.append(more); }
    const details = el('details', 'trk-details');
    details.append(el('summary', '', 'Cause, impact, timeline and sources'));
    const dl = el('dl', 'trk-facts');
    for (const [k, v] of [['Stated cause', i.cause], ['Impact', i.impact]]) dl.append(el('dt', '', k), el('dd', '', v));
    const tl = el('ol', 'trk-timeline');
    for (const [d, t] of i.timeline) { const item = el('li'); item.append(el('time', '', fmtDate(d)), el('span', '', t)); tl.append(item); }
    const src = el('p', 'trk-sources'); src.append(document.createTextNode('Sources: '));
    i.sources.forEach(([name, url], n) => { const a = el('a', '', name); a.href = url; a.rel = 'noopener'; a.target = '_blank'; src.append(a); if (n < i.sources.length - 1) src.append(document.createTextNode(' · ')); });
    const link = el('button', 'calc-link trk-link', 'Copy link to this incident'); link.type = 'button';
    link.addEventListener('click', async () => { const url = `${location.origin}${location.pathname}#${i.id}`; try { await navigator.clipboard.writeText(url); link.textContent = 'Link copied'; } catch { link.textContent = url; } setTimeout(() => { link.textContent = 'Copy link to this incident'; }, 2500); });
    details.append(dl, el('p', 'trk-subhead', 'Timeline'), tl, src, link);
    body.append(tags, h, el('p', 'trk-summary', i.summary), orgs, details);
    li.append(body);
    return li;
  }

  const list = $('trk-list');
  function render(push) {
    const q = $('trk-q').value.trim().toLowerCase();
    const status = $('trk-status').value;
    const rows = incidents.filter(i => (type === 'all' || i.type === type) && (status === 'all' || i.status === status) && (!q || [i.title, i.summary, i.cause, i.sector, ...i.orgs].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => ($('trk-sort').value === 'old' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    list.replaceChildren(...rows.map(card));
    $('trk-count').textContent = `${rows.length} of ${incidents.length} incidents`;
    $('trk-empty').hidden = rows.length > 0;
    if (push) { const p = new URLSearchParams(); if (type !== 'all') p.set('type', type); history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}${location.hash}`); }
  }
  for (const id of ['trk-q', 'trk-status', 'trk-sort']) $(id).addEventListener('input', () => render(false));
  $('trk-clear').addEventListener('click', () => { $('trk-q').value = ''; $('trk-status').value = 'all'; type = 'all'; for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.type === 'all')); render(true); });
  render(false);
  if (location.hash) { const target = document.getElementById(location.hash.slice(1)); if (target) { target.querySelector('details')?.setAttribute('open', ''); target.scrollIntoView({ block: 'start' }); } }

  // Live CISA KEV panel.
  const KEV_URL = 'https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json';
  let kev = null; let kevSource = ''; let timer = null;
  function kevRender() {
    const box = $('trk-kev');
    if (!kev) { box.replaceChildren(); return; }
    const q = $('trk-kq').value.trim().toLowerCase();
    const ransomOnly = $('trk-ransom').checked;
    const since = new Date(Date.now() - Number($('trk-days').value) * 86400000).toISOString().slice(0, 10);
    const rows = kev.vulnerabilities.filter(v => v.dateAdded >= since && (!ransomOnly || v.knownRansomwareCampaignUse === 'Known') && (!q || `${v.cveID} ${v.vendorProject} ${v.product} ${v.vulnerabilityName}`.toLowerCase().includes(q)))
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || b.cveID.localeCompare(a.cveID)).slice(0, 100);
    box.replaceChildren(...rows.map(v => {
      const li = el('li', 'trk-kev-item');
      const head = el('div', 'trk-kev-head');
      const a = el('a', 'trk-cve', v.cveID); a.href = `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(v.cveID)}`; a.target = '_blank'; a.rel = 'noopener';
      head.append(a, el('span', 'trk-kev-date', `Added ${fmtDate(v.dateAdded)}`));
      if (v.knownRansomwareCampaignUse === 'Known') head.append(el('span', 'trk-tag trk-tag-ransomware', 'Used in ransomware'));
      li.append(head, el('p', 'trk-kev-name', `${v.vendorProject} ${v.product}: ${v.vulnerabilityName}`), el('p', 'trk-kev-desc', v.shortDescription), el('p', 'trk-kev-due', `US federal agencies must fix by ${fmtDate(v.dueDate)}`));
      return li;
    }));
    if (!rows.length) box.replaceChildren(el('li', 'trk-kev-empty', ransomOnly ? 'No ransomware-linked vulnerabilities were added in this window. Try a longer window or clear the filter.' : 'No vulnerabilities match. Try a longer window or a different search.'));
    const week = kev.vulnerabilities.filter(v => v.dateAdded >= new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).length;
    $('trk-kcount').textContent = `${rows.length} shown · ${week} added in the last 7 days · ${kev.vulnerabilities.length.toLocaleString('en-US')} in the catalog`;
  }
  async function loadKev() {
    const status = $('trk-live-status');
    status.replaceChildren(el('span', 'trk-dot'), document.createTextNode('Loading the latest CISA data…'));
    try {
      const res = await fetch(KEV_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (!Array.isArray(data.vulnerabilities)) throw new Error('bad data');
      kev = data; kevSource = 'live';
    } catch {
      if (SNAP) { kev = SNAP; kevSource = 'snapshot'; }
    }
    if (!kev) { status.replaceChildren(el('span', 'trk-dot trk-dot-off'), document.createTextNode('The CISA feed could not be reached. Try again in a moment.')); return; }
    const released = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(kev.dateReleased));
    status.replaceChildren(el('span', `trk-dot ${kevSource === 'live' ? 'trk-dot-on' : 'trk-dot-off'}`), document.createTextNode(kevSource === 'live' ? `Live · CISA catalog version ${kev.catalogVersion}, released ${released} UTC · checked ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : `Offline snapshot · catalog version ${kev.catalogVersion}, released ${released} UTC. The live feed could not be reached.`));
    kevRender();
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) loadKev(); }, 15 * 60 * 1000);
  }
  for (const id of ['trk-kq', 'trk-ransom', 'trk-days']) $(id).addEventListener('input', kevRender);
  $('trk-refresh').addEventListener('click', loadKev);
  if (params.get('view') === 'live') select(tabs[1]);
})();
