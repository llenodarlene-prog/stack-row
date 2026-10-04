document.documentElement.classList.add('js');

// Keep the current topic in view when the topic bar scrolls sideways.
document.querySelector('.nav-topics [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

// Ease sections in as they enter the viewport.
const bands = document.querySelectorAll('.band');
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  for (const band of bands) reveal.observe(band);
} else {
  for (const band of bands) band.classList.add('is-visible');
}

// Coverage index filters.
for (const group of document.querySelectorAll('.filters')) {
  const rows = group.nextElementSibling?.querySelectorAll('[data-type]') ?? [];
  group.addEventListener('click', event => {
    const pressed = event.target.closest('button[data-filter]');
    if (!pressed) return;
    for (const option of group.querySelectorAll('button')) option.setAttribute('aria-pressed', String(option === pressed));
    for (const row of rows) row.hidden = pressed.dataset.filter !== 'all' && row.dataset.type !== pressed.dataset.filter;
  });
}

// Reading progress and the active entry in the article outline.
const progress = document.querySelector('.progress');
const post = document.querySelector('.post');
if (progress && post) {
  const update = () => {
    const total = post.offsetHeight - window.innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, (window.scrollY - post.offsetTop) / total)) : 0;
    progress.style.setProperty('--progress', done.toFixed(4));
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
const outline = [...document.querySelectorAll('.toc a')];
if (outline.length && 'IntersectionObserver' in window) {
  const byId = new Map(outline.map(link => [link.getAttribute('href').slice(1), link]));
  const spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of outline) link.classList.toggle('is-active', link === byId.get(entry.target.id));
    }
  }, { rootMargin: '-15% 0px -70% 0px' });
  for (const id of byId.keys()) {
    const heading = document.getElementById(id);
    if (heading) spy.observe(heading);
  }
}

// Cards light up under the pointer.
for (const card of document.querySelectorAll('.card')) {
  card.addEventListener('pointermove', event => {
    const box = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - box.left}px`);
    card.style.setProperty('--my', `${event.clientY - box.top}px`);
  });
}
