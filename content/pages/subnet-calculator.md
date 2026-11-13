---
title: Subnet Calculator
seo_title: Subnet Calculator for IPv4 and IPv6 CIDR Ranges | Stack Row
description: Calculate network address, broadcast, usable host range, subnet mask, wildcard mask and host count for any IPv4 CIDR block, plus IPv6 prefix ranges.
slug: /tools/subnet-calculator/
type: page
template: calculator
icon: network
tool: subnet
order: 12
category: Cloud and Infrastructure
card: Find the network, host range, masks and host count for an IPv4 or IPv6 block.
reviewed: 2026-11-13
primary_keyword: subnet calculator
complete: true
---

# Subnet Calculator

A subnet calculator takes an IP address and a prefix length and returns the network it belongs to. This tool shows the network and broadcast addresses, the usable host range, the subnet and wildcard masks, and the host count for IPv4. It also works out the range and size of an IPv6 prefix. Everything runs in your browser.

## How to Use the Subnet Calculator

Choose a tab, type an address, and select Calculate.

- **IPv4 Subnet** accepts CIDR notation such as 192.168.1.10/24. You can also type the address alone and enter a prefix or a mask such as 255.255.255.0 in the second field.
- **IPv6 Prefix** accepts an address such as 2001:db8::1/48, with or without the prefix in the same field.

Load example fills in 192.168.10.77/26, a common way to split a /24 into four parts.

## Subnet Formulas

| Result | Formula |
|---|---|
| Block size | 2^(32 − prefix) |
| Network address | IP address AND subnet mask |
| Broadcast address | Network address + block size − 1 |
| Usable hosts | Block size − 2 (or the full block for /31 and /32) |
| Wildcard mask | 255.255.255.255 − subnet mask |
| IPv6 addresses | 2^(128 − prefix) |

A /31 has no network or broadcast address, because [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021) allows both addresses on point-to-point links. Private ranges follow [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918): 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.

## Worked Example

Take 192.168.10.77/26. A /26 leaves 6 host bits, so each block holds 2^6 = 64 addresses. The fourth octet, 77, falls in the block that starts at 64.

The network address is 192.168.10.64 and the broadcast is 192.168.10.127. Usable hosts run from .65 to .126, which is 62 addresses. The mask is 255.255.255.192 and the wildcard is 0.0.0.63.

## Common IPv4 Prefix Sizes

| Prefix | Subnet mask | Addresses | Usable hosts |
|---|---|---:|---:|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /30 | 255.255.255.252 | 4 | 2 |

Cloud providers reserve some addresses inside each subnet as well. AWS, for example, keeps five addresses in every VPC subnet, so a /28 gives you 11 hosts there. Our guide to [cloud computing service providers](/cloud-infrastructure/cloud-computing-service-providers/) covers how the major platforms differ.

## Planning Subnets for a Network

Size each subnet for the hosts it will hold in a few years, not today. Leave room between blocks so a subnet can grow without renumbering. Keep management networks, servers and user devices apart, which also makes monitoring cleaner. Our comparison of [network monitoring tools](/cloud-infrastructure/network-monitoring-tools/) explains how discovery uses these ranges.

## Methodology and Limitations

- IPv4 math uses unsigned 32-bit values. IPv6 math uses exact big-integer values.
- Usable host counts follow standard practice and do not subtract cloud-provider reservations.
- Address type labels cover private, loopback, link-local, shared, multicast and reserved ranges.
- Masks must be contiguous. Values such as 255.0.255.0 are rejected.
- Inputs stay in your browser. A calculation is saved locally after you select Calculate.

## Frequently Asked Questions

### How Many Hosts Are in a /24?

A /24 holds 256 addresses. Two are reserved for the network and broadcast addresses, which leaves 254 usable hosts.

### What Is a Wildcard Mask?

A wildcard mask is the inverse of the subnet mask. Routers and access lists use it to match address ranges. For a /24, the mask is 255.255.255.0 and the wildcard is 0.0.0.255.

### What Is the Difference Between CIDR and a Subnet Mask?

They describe the same thing in two ways. CIDR writes the number of network bits after a slash, such as /24. A subnet mask writes those bits as four octets, such as 255.255.255.0.

### Why Does a /31 Have Two Usable Hosts?

RFC 3021 lets point-to-point links use both addresses in a /31, because a two-device link needs no broadcast address. That saves addresses on router links.

### What Is a Typical IPv6 Subnet Size?

Most IPv6 LANs use a /64. Address autoconfiguration expects 64 host bits, so a /48 gives an organization 65,536 subnets of that size.

## Resources

- [RFC 4632: Classless Inter-domain Routing](https://www.rfc-editor.org/rfc/rfc4632)
- [RFC 1918: Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918)
- [RFC 3021: Using 31-Bit Prefixes on Point-to-Point Links](https://www.rfc-editor.org/rfc/rfc3021)
- [AWS: Subnet CIDR blocks](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html)
