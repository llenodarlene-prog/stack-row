// Category filter and search for the /tools/ hub. Filters are kept in the URL
// (?category=…&q=…) so a filtered view can be shared.
(function () {
  'use strict';
  const list = document.querySelector('.tool-cards');
  const bar = document.getElementById('tool-filter');
  if (!list || !bar) return;
  const cards = [...list.querySelectorAll('.tool-card')];
  const chips = [...bar.querySelectorAll('[data-category]')];
  const search = document.getElementById('tool-search');
  const count = document.getElementById('tool-count');
  const empty = document.getElementById('tool-empty');
  function apply(push) {
    const active = chips.find(c => c.getAttribute('aria-pressed') === 'true')?.dataset.category || 'all';
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const ok = (active === 'all' || card.dataset.category === active) && (!q || card.textContent.toLowerCase().includes(q));
      card.hidden = !ok;
      if (ok) shown += 1;
    }
    count.textContent = `${shown} calculator${shown === 1 ? '' : 's'}`;
    empty.hidden = shown > 0;
    if (push) {
      const params = new URLSearchParams();
      if (active !== 'all') params.set('category', active);
      if (q) params.set('q', q);
      history.replaceState(null, '', params.toString() ? `?${params}` : location.pathname);
    }
  }
  const select = category => { for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.category === category)); };
  for (const chip of chips) chip.addEventListener('click', () => { select(chip.dataset.category); apply(true); });
  search.addEventListener('input', () => apply(true));
  const clear = () => { search.value = ''; select('all'); apply(true); search.focus(); };
  document.getElementById('tool-clear').addEventListener('click', clear);
  document.getElementById('tool-empty-clear').addEventListener('click', clear);
  const params = new URLSearchParams(location.search);
  if (chips.some(c => c.dataset.category === params.get('category'))) select(params.get('category'));
  search.value = (params.get('q') || '').slice(0, 60);
  bar.hidden = false;
  apply(false);
})();
