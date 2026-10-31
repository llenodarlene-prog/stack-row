// RAID calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Raid } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Raid || !T) return;
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const tb = value => `${T.formatNumber(value, 2)} TB`;
  const tib = value => `${T.formatNumber(value * Raid.TB_TO_TIB, 2)} TiB`;
  const levelName = level => (level === 'jbod' ? 'JBOD' : `RAID ${level}`);
  const groupsField = document.getElementById('rd-groups-field');
  const toggle = () => { groupsField.hidden = !['50', '60'].includes(document.getElementById('rd-level').value); };
  document.getElementById('rd-level').addEventListener('change', toggle);

  // One tile per disk, labeled with its role. Parity in RAID 5 and 6 is
  // spread across every disk, so tiles show capacity equivalents.
  function layout(level, r, disks, spares, groups) {
    const wrap = el('div', 'calc-disks');
    wrap.setAttribute('role', 'img');
    const roles = [];
    const n = r.active;
    if (level === '1') for (let i = 0; i < n; i++) roles.push(i ? 'Mirror' : 'Data');
    else if (level === '10') for (let i = 0; i < n; i++) roles.push(i % 2 ? `Mirror ${Math.floor(i / 2) + 1}` : `Data ${i / 2 + 1}`);
    else if (level === '50' || level === '60') {
      const per = n / groups; const parity = level === '50' ? 1 : 2;
      for (let g = 0; g < groups; g++) for (let i = 0; i < per; i++) roles.push(i < per - parity ? `G${g + 1} data` : `G${g + 1} parity`);
    } else {
      const parity = { 5: 1, 6: 2 }[level] || 0;
      for (let i = 0; i < n; i++) roles.push(i < n - parity ? 'Data' : 'Parity');
    }
    for (let i = 0; i < spares; i++) roles.push('Spare');
    roles.forEach((role, i) => {
      const tile = el('span', `calc-disk calc-disk-${role.split(' ')[0].replace(/^G\d+$/, 'group').toLowerCase()}`);
      tile.append(el('span', 'calc-disk-num', `Disk ${i + 1}`), el('span', '', role));
      wrap.append(tile);
    });
    const counts = roles.reduce((map, role) => { const key = role.replace(/ \d+$/, '').replace(/^G\d+ /, ''); map[key] = (map[key] || 0) + 1; return map; }, {});
    wrap.setAttribute('aria-label', `Disk layout: ${Object.entries(counts).map(([role, count]) => `${count} ${role.toLowerCase()}`).join(', ')}`);
    const figure = el('figure', 'calc-figure');
    figure.append(wrap, el('figcaption', 'calc-hint', ['5', '6', '50', '60'].includes(level) ? 'Parity is distributed across every disk in practice. Tiles show capacity equivalents.' : 'Each tile is one physical disk.'));
    return figure;
  }

  T.mount({
    icon: 'database',
    name: 'RAID Calculator',
    file: 'raid-calculation',
    storeKey: 'stackrow:raid:v1',
    example: { values: { level: '6', disks: '8', size: '12', spares: '1', largest: '' } },
    onRestore: toggle,
    onReset() { window.setTimeout(toggle, 0); },
    compute(c, { viz }) {
      const level = c.value('level');
      const disks = c.number('disks', { required: true, whole: true, min: 1, max: 256, label: 'the number of disks' });
      const size = c.number('size', { required: true, label: 'a disk capacity', max: 1000 });
      const spares = c.number('spares', { whole: true, max: 64 });
      const groups = ['50', '60'].includes(level) ? c.number('groups', { whole: true, fallback: 2, min: 2, max: 32 }) : 2;
      const largest = c.number('largest', { max: 1000 });
      if ([disks, size, spares, groups, largest].some(Number.isNaN)) return null;
      if (size <= 0) { c.fail('size', 'Use a capacity above zero.'); return null; }
      const r = Raid.calculate({ level, disks, size, spares, groups });
      if (r.error) { c.fail('disks', r.error); return null; }
      const tolerance = r.guaranteed === r.best ? `${r.guaranteed} disk${r.guaranteed === 1 ? '' : 's'}` : `${r.guaranteed} guaranteed, up to ${r.best} if failures land in different ${level === '10' ? 'mirrors' : 'groups'}`;
      const lines = [`${levelName(level)} stores data on the equivalent of ${r.dataDisks} of ${r.active} active disks.`];
      if (r.guaranteed === 0) lines.push('Any single disk failure loses the array, so keep a separate backup.');
      if (level === '5' && size >= 8) lines.push('Large drives take a long time to rebuild. RAID 6 keeps protection if a second disk fails during the rebuild.');
      let warning = '';
      if (largest && largest > size && level !== 'jbod') warning = `Arrays size every member to the smallest disk. Each ${T.formatNumber(largest, 2)} TB drive leaves ${T.formatNumber(largest - size, 2)} TB unused.`;
      if (largest && largest < size) warning = 'The largest disk is smaller than the capacity per disk. Enter the smallest drive as the capacity per disk.';
      return {
        metrics: [
          ['Usable capacity', tb(r.usable), `${r.dataDisks} data disks × ${T.formatNumber(size, 2)} TB · ${tib(r.usable)}`, true],
          ['Raw capacity', tb(r.raw), `${disks} disks × ${T.formatNumber(size, 2)} TB`],
          ['Storage efficiency', T.formatPercent(r.efficiency, 1), 'Usable ÷ raw × 100'],
          ['Redundancy overhead', tb(r.redundancy), r.spareCapacity ? `Plus ${tb(r.spareCapacity)} held as hot spares` : 'Capacity used for parity or mirrors'],
          ['Fault tolerance', tolerance],
          ['Theoretical read and write', `${r.readFactor}× read, write penalty ${r.writePenalty}`, 'Read speed relative to one disk; disk operations per random write']
        ],
        nodes: [viz.stack('How raw capacity is used', [{ label: 'Usable', value: r.usable, display: tb(r.usable), tone: 'green' }, { label: 'Parity or mirrors', value: r.redundancy, display: tb(r.redundancy), tone: 'navy' }, ...(r.spareCapacity ? [{ label: 'Hot spares', value: r.spareCapacity, display: tb(r.spareCapacity), tone: 'muted' }] : [])]), layout(level, r, disks, spares, groups)],
        lines, warning,
        inputs: [['RAID level', levelName(level)], ['Disks', String(disks)], ['Capacity per disk', tb(size)], ['Hot spares', String(spares)], ...(['50', '60'].includes(level) ? [['Groups', String(groups)]] : [])],
        outputs: [['Usable capacity', tb(r.usable)], ['Usable capacity (binary)', tib(r.usable)], ['Raw capacity', tb(r.raw)], ['Storage efficiency', T.formatPercent(r.efficiency, 1)], ['Fault tolerance', tolerance], ['Read multiplier', `${r.readFactor}x`], ['Write penalty', String(r.writePenalty)]]
      };
    }
  });
})();
