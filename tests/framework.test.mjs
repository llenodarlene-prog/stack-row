import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = { TextEncoder, URLSearchParams };
vm.runInNewContext(await readFile('src/scripts/tool-core.js', 'utf8'), context);
const { policy } = context.StackRowTool;

test('framework: defaults keep the original calculator behavior', () => {
  const cfg = policy.normalize({});
  assert.equal(cfg.persistence, 'auto');
  assert.equal(cfg.share.mode, 'enabled');
  assert.equal(cfg.labels.reset, 'Reset calculator');
  assert.equal(policy.canStore(cfg, false), true);
  assert.equal(policy.shareQuery([['cost', '40'], ['markup', '50'], ['empty', '']], cfg, 'markup'), 'mode=markup&cost=40&markup=50');
});

test('framework: page labels override defaults', () => {
  const cfg = policy.normalize({ noun: 'generator', labels: { reset: 'Reset generator', copy: 'Copy UUIDs' } });
  assert.equal(cfg.labels.reset, 'Reset generator');
  assert.equal(cfg.labels.copy, 'Copy UUIDs');
  assert.equal(cfg.labels.print, 'Print results');
});

test('framework: private fields never enter a share link, even when allowlisted', () => {
  const enabled = policy.normalize({ private: ['secret'] });
  assert.equal(policy.shareQuery([['amount', '5'], ['secret', 'abc']], enabled), 'amount=5');
  const misconfigured = policy.normalize({ share: { mode: 'allowlist', fields: ['amount', 'secret'] }, private: ['secret'] });
  assert.equal(policy.shareQuery([['amount', '5'], ['secret', 'abc'], ['other', '1']], misconfigured), 'amount=5');
});

test('framework: allowlist and disabled sharing', () => {
  const allow = policy.normalize({ share: { mode: 'allowlist', fields: ['ts'] } });
  assert.equal(policy.shareQuery([['ts', '0'], ['bulk', 'a\nb']], allow), 'ts=0');
  assert.equal(policy.shareQuery([['ts', '0']], policy.normalize({ share: { mode: 'disabled' } })), null);
});

test('framework: persistence modes', () => {
  assert.equal(policy.canStore(policy.normalize({ persistence: 'none' }), true), false);
  assert.equal(policy.canStore(policy.normalize({ persistence: 'opt-in' }), false), false);
  assert.equal(policy.canStore(policy.normalize({ persistence: 'opt-in' }), true), true);
  assert.equal(policy.normalize({ persistence: 'bogus' }).persistence, 'auto');
});

test('framework: query restoration rejects unknown, private, oversized and invalid values', () => {
  const cfg = policy.normalize({ share: { mode: 'allowlist', fields: ['ts', 'unit'] }, private: ['bulk'], restore: { ts: { pattern: /^-?\d{1,20}$/, maxLength: 21 }, unit: /^(auto|s|ms)$/ } });
  const known = ['ts', 'unit', 'bulk', 'zone'];
  const out = policy.restoreValues({ ts: '1700000000', unit: 'ms', bulk: 'x', zone: 'UTC', evil: '1', mode: 'single' }, cfg, known);
  assert.deepEqual({ ...out }, { ts: '1700000000', unit: 'ms', mode: 'single' });
  assert.deepEqual({ ...policy.restoreValues({ ts: '12abc', unit: 'years' }, cfg, known) }, {});
  assert.deepEqual({ ...policy.restoreValues({ ts: '1'.repeat(30) }, cfg, known) }, {});
  assert.deepEqual({ ...policy.restoreValues({ ts: '1' }, policy.normalize({ restore: false }), known) }, {});
  assert.deepEqual({ ...policy.restoreValues({ ts: '1' }, policy.normalize({ share: { mode: 'disabled' } }), known) }, {});
});

test('framework: saved values still restore when sharing is disabled', () => {
  const cfg = policy.normalize({ share: { mode: 'disabled' } });
  assert.deepEqual({ ...policy.restoreValues({ a: '1' }, cfg, ['a'], { fromUrl: false }) }, { a: '1' });
});

test('framework: input limits give specific errors and never truncate', () => {
  assert.equal(policy.checkText('abc', { maxBytes: 10 }), '');
  assert.match(policy.checkText('a'.repeat(2048), { maxBytes: 1024, label: 'Pasted XML' }), /^Pasted XML is 2 KB\. The limit is 1 KB\./);
  assert.equal(policy.byteLength('é'), 2);
  assert.match(policy.checkText('é'.repeat(6), { maxBytes: 10 }), /12 bytes/);
  assert.match(policy.checkText('1\n2\n3\n', { maxRows: 2, label: 'Bulk input' }), /3 lines\. The limit is 2 lines/);
  assert.equal(policy.checkText('1\n\n2\n', { maxRows: 2 }), '');
  assert.equal(policy.checkCount(1000, 1000), '');
  assert.match(policy.checkCount(1001, 1000), /at most 1,000/);
  assert.match(policy.checkCount(0, 1000), /1 or more/);
  assert.match(policy.checkCount(2.5, 1000), /whole number/);
});

test('framework: export filenames are safe', () => {
  assert.equal(policy.safeFilename('Stack Row/../UUIDs 2026.txt'), 'stack-row-uuids-2026.txt');
  assert.equal(policy.safeFilename('***'), 'stack-row-export');
});
