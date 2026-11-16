// Passphrase Generator interface. Words come from the EFF Large Wordlist and
// are picked with crypto.getRandomValues. Nothing is stored, logged or shared.
(function () {
  'use strict';
  const T = window.StackRowTool;
  const P = window.StackRowUtilityTools?.Passphrase;
  const W = window.StackRowWordlist;
  if (!T || !P || !W) return;
  const randomBytes = window.crypto?.getRandomValues ? n => window.crypto.getRandomValues(new Uint8Array(n)) : null;
  const years = y => (y > 1e15 ? 'longer than the age of the universe many times over' : y >= 1 ? `about ${T.formatNumber(y, 0)} years` : y * 365.25 >= 1 ? `about ${T.formatNumber(y * 365.25, 0)} days` : 'under a day');
  const app = T.mount({
    icon: 'key', name: 'Passphrase Generator', file: 'passphrase', noun: 'generator', doneWord: 'generated',
    labels: { submit: 'Generate', reset: 'Reset generator', copy: 'Copy all' },
    persistence: 'none', share: { mode: 'disabled' }, restore: false, print: false, liveModes: [],
    privacyMessage: 'Passphrases are generated in your browser with the Web Cryptography API. They are never sent, saved, or put in the page address.',
    example: { values: { words: '6', separator: 'hyphen', capitalize: 'first', number: 'yes', count: '3' } },
    exporters: [{ label: 'Download TXT', mime: 'text/plain;charset=utf-8', extension: 'txt', filename: last => `stack-row-passphrases-${last.date}`, build: last => `${last.values.join('\n')}\n` }],
    copy: last => last.values.join('\n'),
    compute(c, { copyButton }) {
      const raw = c.value('count').trim();
      const count = /^\d+$/.test(raw) ? Number(raw) : NaN;
      const err = Number.isNaN(count) ? 'Enter a whole number from 1 to 50.' : c.policy.checkCount(count, 50, 'Number of passphrases');
      if (err) { c.fail('count', err); return null; }
      c.clear('count');
      const options = { words: Number(c.value('words')), separator: c.value('separator'), capitalize: c.value('capitalize'), addNumber: c.value('number') === 'yes', count };
      const r = P.generatePassphrases(options, { wordlist: W, randomBytes });
      if (!r.ok) { c.fail('count', r.message); return null; }
      const list = T.el('ol', 'calc-uuid-list'); list.setAttribute('aria-label', 'Generated passphrases');
      r.values.forEach((v, i) => { const li = T.el('li'); li.append(T.el('code', '', v), copyButton(v, `passphrase ${i + 1}`)); list.append(li); });
      const combos = Math.pow(2, r.bits);
      return {
        values: r.values,
        announce: `${count} passphrase${count === 1 ? '' : 's'} generated.`,
        metrics: [[count === 1 ? 'Your passphrase' : `${count} passphrases`, count === 1 ? r.values[0] : `${options.words} words each`, `${T.formatNumber(r.bits, 1)} bits of entropy`, true], ['Strength', P.strengthBand(r.bits), `${options.words} words from ${W.length.toLocaleString('en-US')}: log2(${W.length.toLocaleString('en-US')}) × ${options.words}${options.capitalize === 'random' ? ` + ${options.words} for random capitals` : ''}${options.addNumber ? ' + digit and position' : ''}`], ['Possible passphrases', combos > 1e15 ? `about 2^${Math.floor(r.bits)}` : T.formatNumber(combos, 0)], ['Time to try them all', years(P.exhaustYears(r.bits, 1e12)), 'At one trillion guesses a second, an offline attack on a fast hash']],
        nodes: [list],
        lines: ['Entropy counts only the random choices made here. If you change words or pick your favorite from a list, the real strength drops.'],
        inputs: [['Words', String(options.words)], ['Separator', c.value('separator')], ['Capitals', options.capitalize], ['Digit', options.addNumber ? 'Yes' : 'No']],
        outputs: [['Entropy', `${r.bits.toFixed(1)} bits`]]
      };
    }
  });
  app?.calculate({ explicit: false, save: false });
})();
