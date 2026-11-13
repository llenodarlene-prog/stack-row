// IP subnet and CIDR calculator interface. Formulas live in tool-formulas.js.
(function () {
  'use strict';
  const { Subnet } = window.StackRowFormulas;
  const T = window.StackRowTool;
  if (!Subnet || !T) return;
  const n = v => T.formatNumber(v, 0);
  T.mount({
    icon: 'network',
    name: 'Subnet Calculator', file: 'subnet-calculation', storeKey: 'stackrow:subnet:v1',
    modeNames: { v4: 'IPv4 Subnet', v6: 'IPv6 Prefix' },
    example: { mode: 'v4', values: { ip: '192.168.10.77/26' } },
    compute(c) {
      if (c.mode === 'v6') {
        const [addrText, slash] = c.value('ip6').trim().split('/');
        if (!addrText) { c.fail('ip6', 'Enter an IPv6 address.'); return null; }
        const address = Subnet.parse6(addrText);
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
          metrics: [['Network prefix', `${Subnet.format6(r.network)}/${prefix}`, 'Address with host bits set to zero', true], ['Last address', Subnet.format6(r.last)], ['Total addresses', size.length > 15 ? `2^${128 - prefix}` : n(Number(size)), `2^(128 − ${prefix})`], ['/64 subnets inside', subnets64.length > 15 ? `2^${64 - prefix}` : subnets64]],
          lines: [`The /${prefix} prefix runs from ${Subnet.format6(r.network)} to ${Subnet.format6(r.last)}.`, prefix <= 64 ? 'Most IPv6 LANs use a /64, so this prefix can be split into the number of /64 subnets shown.' : 'Prefixes longer than /64 break SLAAC address autoconfiguration on most networks.'],
          inputs: [['Address', addrText], ['Prefix length', `/${prefix}`]],
          outputs: [['Network', `${Subnet.format6(r.network)}/${prefix}`], ['Last address', Subnet.format6(r.last)], ['Total addresses', `2^${128 - prefix}`]]
        };
      }
      const [addrText, slash] = c.value('ip').trim().split('/');
      if (!addrText) { c.fail('ip', 'Enter an IPv4 address.'); return null; }
      const address = Subnet.parse4(addrText);
      if (address === null) { c.fail('ip', 'Enter four numbers from 0 to 255, such as 192.168.1.10.'); return null; }
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
        nodes: [T.viz.stack('Address block', [{ label: 'Usable hosts', value: r.usable, display: n(r.usable), tone: 'blue' }, { label: 'Network and broadcast', value: r.size - r.usable, display: n(r.size - r.usable), tone: 'muted' }])],
        metrics: [['Network address', `${f(r.network)}/${prefix}`, 'Address AND subnet mask', true], ['Usable host range', prefix === 32 ? f(r.first) : `${f(r.first)} to ${f(r.last)}`], ['Usable hosts', n(r.usable), prefix >= 31 ? '/31 and /32 have no reserved addresses' : '2^(32 − prefix) − 2'], ['Broadcast address', prefix >= 31 ? 'None' : f(r.broadcast)], ['Subnet mask', f(r.mask)], ['Wildcard mask', f(r.wildcard)], ['Address type', r.scope]],
        lines: [`${f(address)}/${prefix} belongs to the ${f(r.network)}/${prefix} network, a block of ${n(r.size)} addresses.`, `Binary mask: ${Subnet.binary4(r.mask)}`],
        inputs: [['Address', f(address)], ['Prefix', `/${prefix}`]],
        outputs: [['Network', `${f(r.network)}/${prefix}`], ['First usable', f(r.first)], ['Last usable', f(r.last)], ['Broadcast', prefix >= 31 ? 'None' : f(r.broadcast)], ['Usable hosts', n(r.usable)], ['Subnet mask', f(r.mask)], ['Wildcard mask', f(r.wildcard)]]
      };
    }
  });
})();
