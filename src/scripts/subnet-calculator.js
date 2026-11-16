// IP subnet and CIDR calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Subnet } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Subnet || !T) return;
  const n = v => T.formatNumber(v, 0);
  T.mount({
    icon: 'network',
    name: 'Subnet and CIDR Calculator', file: 'subnet-calculation', storeKey: 'stackrow:subnet:v1',
    modeNames: { v4: 'IPv4 Subnet', v6: 'IPv6 Prefix', split: 'Split a network', agg: 'Aggregate networks' },
    example: { mode: 'v4', values: { ip: '192.168.10.77/26' } },
    // Network values are not sensitive, but long pasted lists stay out of links.
    share: { mode: 'allowlist', fields: ['ip', 'prefix', 'ip6', 'prefix6', 'split_cidr', 'split_by', 'split_value'] },
    private: ['agg'],
    restore: { ip: { pattern: /^[0-9./]{1,18}$/, maxLength: 18 }, prefix: { pattern: /^[0-9.]{1,15}$/, maxLength: 15 }, ip6: { pattern: /^[0-9a-fA-F:./]{1,50}$/, maxLength: 50 }, prefix6: /^\d{1,3}$/, split_cidr: { pattern: /^[0-9a-fA-F:./]{1,50}$/, maxLength: 50 }, split_by: /^(prefix|count)$/, split_value: /^\d{1,10}$/ },
    exporters: [
      { label: 'Download CSV', mime: 'text/csv;charset=utf-8', extension: 'csv', filename: last => `stack-row-subnet-${last.mode}-${last.date}`, build: last => (last.list ? [['network', 'first', 'last', 'addresses'], ...last.list] : [['item', 'value'], ...last.outputs]).map(row => row.map(T.csvCell).join(',')).join('\r\n') },
      { label: 'Download TXT', mime: 'text/plain;charset=utf-8', extension: 'txt', modes: ['split', 'agg'], filename: last => `stack-row-subnet-${last.mode}-${last.date}`, build: last => `${(last.list || []).map(r => r[0]).join('\n')}\n` }
    ],
    onMode(mode) { const share = document.getElementById('calc-share'); if (share) share.hidden = mode === 'agg'; },
    compute(c, { copyButton }) {
      const listNode = (rows, label) => { const box = T.el('ol', 'calc-uuid-list'); box.setAttribute('aria-label', label); for (const r of rows) { const li = T.el('li'); li.append(T.el('code', '', `${r[0]}  (${r[1]} to ${r[2]})`), copyButton(r[0], r[0])); box.append(li); } return box; };
      const count = n => (n > 999999999999999n ? `2^${n.toString(2).length - 1}${(n & (n - 1n)) === 0n ? '' : '+'} (${n.toString()})` : Number(n).toLocaleString('en-US'));
      if (c.mode === 'split') {
        const cidr = Subnet.parseCidr(c.value('split_cidr'));
        if (cidr.error) { c.fail('split_cidr', cidr.message); return null; }
        c.clear('split_cidr');
        const raw = c.value('split_value').trim();
        if (!/^\d{1,10}$/.test(raw)) { c.fail('split_value', 'Enter a whole number.'); return null; }
        let newPrefix = Number(raw);
        if (c.value('split_by') === 'count') {
          const wanted = BigInt(raw);
          if (wanted < 2n) { c.fail('split_value', 'Ask for at least 2 subnets.'); return null; }
          newPrefix = cidr.prefix + (wanted - 1n).toString(2).length;
        }
        const r = Subnet.split(cidr, newPrefix, 1024);
        if (r.error) { c.fail('split_value', c.value('split_by') === 'count' ? `A /${cidr.prefix} cannot be split into that many subnets. The most is 2^${cidr.bits - cidr.prefix}.` : r.message); return null; }
        c.clear('split_value');
        const f = n => Subnet.formatBig(cidr.family, n);
        const list = r.subnets.map(s => [`${f(s.network)}/${s.prefix}`, f(s.network), f(s.last), count(r.step)]);
        return {
          list,
          metrics: [['Subnets', count(r.total), `2^(${newPrefix} − ${cidr.prefix})`, true], ['Each subnet', `/${newPrefix}, ${count(r.step)} addresses`], ['Source network', `${f(cidr.network)}/${cidr.prefix}`]],
          nodes: [listNode(list, 'Subnets')],
          warning: [cidr.hostBitsSet ? `Host bits were set, so the network was normalized to ${f(cidr.network)}/${cidr.prefix}.` : '', r.truncated ? `Showing the first 1,024 of ${count(r.total)} subnets.` : ''].filter(Boolean).join(' '),
          inputs: [['Network', `${f(cidr.network)}/${cidr.prefix}`], ['New prefix', `/${newPrefix}`]],
          outputs: [['Subnets', r.total.toString()], ...list.slice(0, 50).map((row, i) => [`Subnet ${i + 1}`, row[0]])]
        };
      }
      if (c.mode === 'agg') {
        const text = c.text('agg', { required: true, label: 'The network list', maxBytes: 100000, maxRows: 1000 });
        if (text === null) return null;
        const r = Subnet.aggregate(text.split(/\r?\n/));
        if (r.error) { c.fail('agg', r.message); return null; }
        const f = n => Subnet.formatBig(r.family, n);
        const bits = r.family === 6 ? 128 : 32;
        const list = r.blocks.map(b => { const size = 1n << BigInt(bits - b.prefix); return [`${f(b.network)}/${b.prefix}`, f(b.network), f(b.network + size - 1n), count(size)]; });
        return {
          list,
          metrics: [['Aggregated networks', `${r.input} in, ${r.blocks.length} out`, 'Aligned neighbors of equal size combined repeatedly', true]],
          nodes: [listNode(list, 'Aggregated networks')],
          warning: r.hostBitsFixed ? `${r.hostBitsFixed} entr${r.hostBitsFixed === 1 ? 'y had' : 'ies had'} host bits set and ${r.hostBitsFixed === 1 ? 'was' : 'were'} normalized to the network address.` : '',
          inputs: [['Networks pasted', String(r.input)]],
          outputs: list.map((row, i) => [`Network ${i + 1}`, row[0]])
        };
      }
      if (c.mode === 'v6') {
        const [addrText, slash] = c.value('ip6').trim().split('/');
        if (!addrText) { c.fail('ip6', 'Enter an IPv6 address.'); return null; }
        const address = Subnet.parse6(addrText);
        if (addrText.includes('%')) { c.fail('ip6', 'Remove the zone identifier (the part after %). It names a local interface, not part of the network.'); return null; }
        if (address === null) { c.fail('ip6', 'Enter a valid IPv6 address, such as 2001:db8::1.'); return null; }
        c.clear('ip6');
        const prefixText = slash ?? c.value('prefix6').trim();
        if (!/^\d{1,3}$/.test(prefixText) || Number(prefixText) > 128) { c.fail(slash !== undefined ? 'ip6' : 'prefix6', 'Use a prefix length from 0 to 128.'); return null; }
        c.clear('prefix6');
        const prefix = Number(prefixText);
        const r = Subnet.ipv6(address, prefix);
        const size = r.size.toString();
        const subnets64 = prefix <= 64 ? (1n << BigInt(64 - prefix)).toString() : 'Not applicable';
        return {
          metrics: [['Network prefix', `${Subnet.format6(r.network)}/${prefix}`, 'Address with host bits set to zero', true], ['Last address', Subnet.format6(r.last)], ['Total addresses', size.length > 15 ? `2^${128 - prefix}` : n(Number(size)), `2^(128 − ${prefix})`], ['/64 subnets inside', subnets64.length > 15 ? `2^${64 - prefix}` : subnets64], ['Expanded network', Subnet.expand6(r.network)]],
          lines: [`The /${prefix} prefix runs from ${Subnet.format6(r.network)} to ${Subnet.format6(r.last)}.`, prefix <= 64 ? 'Most IPv6 LANs use a /64, so this prefix can be split into the number of /64 subnets shown.' : 'Prefixes longer than /64 break SLAAC address autoconfiguration on most networks.'],
          inputs: [['Address', addrText], ['Prefix length', `/${prefix}`]],
          outputs: [['Network', `${Subnet.format6(r.network)}/${prefix}`], ['Expanded network', Subnet.expand6(r.network)], ['Last address', Subnet.format6(r.last)], ['Total addresses', r.size.toString()]]
        };
      }
      const [addrText, slash] = c.value('ip').trim().split('/');
      if (!addrText) { c.fail('ip', 'Enter an IPv4 address.'); return null; }
      const address = Subnet.parse4(addrText);
      if (address === null) { c.fail('ip', /(^|\.)0\d/.test(addrText) ? 'Remove leading zeros, such as 010. Some systems read them as octal, so they are not accepted.' : 'Enter four numbers from 0 to 255, such as 192.168.1.10.'); return null; }
      c.clear('ip');
      const prefixText = (slash ?? c.value('prefix')).trim();
      let prefix = null;
      if (/^\d{1,2}$/.test(prefixText) && Number(prefixText) <= 32) prefix = Number(prefixText);
      else if (Subnet.parse4(prefixText) !== null) prefix = Subnet.prefixFromMask(Subnet.parse4(prefixText));
      if (prefix === null) { c.fail(slash !== undefined ? 'ip' : 'prefix', prefixText ? 'Use a prefix from 0 to 32 or a valid mask such as 255.255.255.0.' : 'Add a prefix length, such as /24.'); return null; }
      c.clear('prefix');
      const r = Subnet.ipv4(address, prefix);
      const f = Subnet.format4;
      return {
        nodes: [T.viz.range(`Position inside its /${Math.max(0, prefix - 8)} block`, { low: (r.network - Math.floor(r.network / 2 ** (32 - Math.max(0, prefix - 8))) * 2 ** (32 - Math.max(0, prefix - 8))), high: (r.network - Math.floor(r.network / 2 ** (32 - Math.max(0, prefix - 8))) * 2 ** (32 - Math.max(0, prefix - 8))) + r.size, max: 2 ** (32 - Math.max(0, prefix - 8)), lowDisplay: f(r.network), highDisplay: f(r.broadcast) }), T.viz.stack('Address block', [{ label: 'Usable hosts', value: r.usable, display: n(r.usable), tone: 'blue' }, { label: 'Network and broadcast', value: r.size - r.usable, display: n(r.size - r.usable), tone: 'muted' }])],
        metrics: [['Network address', `${f(r.network)}/${prefix}`, 'Address AND subnet mask', true], ['Usable host range', prefix === 32 ? f(r.first) : `${f(r.first)} to ${f(r.last)}`], ['Usable hosts', n(r.usable), prefix >= 31 ? '/31 and /32 have no reserved addresses' : '2^(32 − prefix) − 2'], ['Broadcast address', prefix >= 31 ? 'None' : f(r.broadcast)], ['Subnet mask', f(r.mask)], ['Wildcard mask', f(r.wildcard)], ['Address type', r.scope]],
        lines: [`${f(address)}/${prefix} belongs to the ${f(r.network)}/${prefix} network, a block of ${n(r.size)} addresses.`, `Binary mask: ${Subnet.binary4(r.mask)}`, `Binary network (network bits | host bits): ${[...r.network.toString(2).padStart(32, '0')].map((bit, i) => `${i === prefix ? '|' : i && i % 8 === 0 ? ' ' : ''}${bit}`).join('')}`, address !== r.network ? `Host bits were set, so the network is shown as ${f(r.network)}/${prefix}.` : ''].filter(Boolean),
        inputs: [['Address', f(address)], ['Prefix', `/${prefix}`]],
        outputs: [['Network', `${f(r.network)}/${prefix}`], ['First usable', f(r.first)], ['Last usable', f(r.last)], ['Broadcast', prefix >= 31 ? 'None' : f(r.broadcast)], ['Usable hosts', n(r.usable)], ['Subnet mask', f(r.mask)], ['Wildcard mask', f(r.wildcard)]]
      };
    }
  });
})();
