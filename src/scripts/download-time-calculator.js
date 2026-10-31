// Download time and data transfer calculator interface. Formulas live in
// tool-formulas.js.
(function () {
  'use strict';
  const { Transfer } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Transfer || !T) return;
  const $ = id => document.getElementById(id);
  const groups = { time: ['dt-size-group', 'dt-speed-group'], speed: ['dt-size-group', 'dt-time-group'], data: ['dt-speed-group', 'dt-time-group'] };
  let current = 'time';
  const toggle = mode => {
    current = mode || current;
    for (const id of ['dt-size-group', 'dt-speed-group', 'dt-time-group']) $(id).hidden = !groups[current].includes(id);
    $('dt-custom-field').hidden = $('dt-preset').value !== 'custom';
  };
  $('dt-preset').addEventListener('change', () => toggle());

  T.mount({
    icon: 'cloud-download',
    name: 'Download Time Calculator',
    file: 'download-time-calculation',
    storeKey: 'stackrow:download-time:v1',
    modeNames: { time: 'Transfer Time', speed: 'Required Speed', data: 'Data Moved' },
    example: { mode: 'time', values: { size: '50', unit: 'GB', files: '1', speed: '100', sunit: 'Mbps', preset: '10', direction: 'download' } },
    onMode: toggle,
    onRestore() { toggle(document.querySelector('.calc-tabs [aria-selected="true"]').dataset.mode); },
    onReset() { window.setTimeout(() => toggle('time'), 0); },
    compute(c, { viz }) {
      const preset = c.value('preset');
      const overhead = preset === 'custom' ? c.number('overhead', { required: true, label: 'an overhead percentage', max: 95 }) : Number(preset);
      const needSize = c.mode !== 'data';
      const needSpeed = c.mode !== 'speed';
      const needTime = c.mode !== 'time';
      const size = needSize ? c.number('size', { required: true, label: 'a size' }) : 0;
      const files = needSize ? c.number('files', { whole: true, fallback: 1, min: 1, max: 1e9 }) : 1;
      const speed = needSpeed ? c.number('speed', { required: true, label: 'a speed' }) : 0;
      const time = needTime ? c.number('time', { required: true, label: 'a time' }) : 0;
      if ([overhead, size, files, speed, time].some(Number.isNaN)) return null;
      if (needSpeed && speed <= 0) { c.fail('speed', 'Use a speed above zero.'); return null; }
      if (needTime && time <= 0) { c.fail('time', 'Use a time above zero.'); return null; }
      const bytes = size * Transfer.SIZE_UNITS[c.value('unit')] * files;
      const bps = speed * Transfer.SPEED_UNITS[c.value('sunit')];
      const seconds = time * Transfer.TIME_UNITS[c.value('tunit')];
      const direction = c.value('direction');
      const inputs = [['Direction', direction === 'upload' ? 'Upload' : 'Download']];
      if (needSize) inputs.push(['Size', `${T.formatNumber(size, 3)} ${c.value('unit')}${files > 1 ? ` × ${files} files` : ''}`]);
      if (needSpeed) inputs.push(['Speed', `${T.formatNumber(speed, 3)} ${c.value('sunit')}`]);
      if (needTime) inputs.push(['Time available', `${T.formatNumber(time, 3)} ${c.value('tunit')}`]);
      inputs.push(['Overhead assumption', `${overhead}%`]);
      const effective = `Effective speed = speed × (1 - ${overhead}% overhead)`;
      let metrics; let outputs; let visual = null;
      if (c.mode === 'time') {
        const t = Transfer.time(bytes, bps, overhead);
        const ideal = Transfer.time(bytes, bps, 0);
        metrics = [[`Estimated ${direction} time`, Transfer.duration(t), `Time = size in bits ÷ effective speed · ${effective}`, true], ['Ideal time at full line rate', Transfer.duration(ideal), 'No protocol, signal, or congestion overhead'], ['Total data', Transfer.bytes(bytes), `${T.formatNumber(bytes * 8, 0)} bits`], ['Effective speed', Transfer.rate(bps * Transfer.efficiency(overhead))]];
        visual = viz.bars('Transfer time', [{ label: 'At full line rate', value: ideal, display: Transfer.duration(ideal), tone: 'cyan' }, { label: `With ${overhead}% overhead`, value: t, display: Transfer.duration(t), tone: 'navy' }]);
        outputs = [['Estimated time', Transfer.duration(t)], ['Estimated seconds', T.formatNumber(t, 1)], ['Ideal time', Transfer.duration(ideal)], ['Total data', Transfer.bytes(bytes)]];
      } else if (c.mode === 'speed') {
        const need = Transfer.speed(bytes, seconds, overhead);
        metrics = [['Required line speed', Transfer.rate(need), `Speed = size in bits ÷ (seconds × (1 - overhead))`, true], ['Throughput needed after overhead', Transfer.rate(Transfer.speed(bytes, seconds, 0))], ['In megabytes per second', `${T.formatNumber(need / 8e6, 2)} MB/s`], ['Total data', Transfer.bytes(bytes)]];
        outputs = [['Required line speed', Transfer.rate(need)], ['Required Mbps', T.formatNumber(need / 1e6, 2)], ['Total data', Transfer.bytes(bytes)]];
      } else {
        const moved = Transfer.data(bps, seconds, overhead);
        metrics = [['Data you can transfer', Transfer.bytes(moved), `Data = effective speed × seconds ÷ 8 · ${effective}`, true], ['At full line rate', Transfer.bytes(Transfer.data(bps, seconds, 0))], ['In binary units', `${T.formatNumber(moved / 1024 ** 3, 2)} GiB`]];
        outputs = [['Data transferable', Transfer.bytes(moved)], ['Bytes', T.formatNumber(moved, 0)]];
      }
      return {
        nodes: visual ? [visual] : [],
        metrics, inputs, outputs,
        lines: ['Speeds are sold in bits per second and file sizes are shown in bytes, so the calculator multiplies bytes by 8. Real transfers also depend on the server, disk speed, and other traffic.']
      };
    }
  });
})();
