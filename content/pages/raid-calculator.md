---
title: RAID Calculator
seo_title: RAID Calculator for Usable Capacity and Fault Tolerance | Stack Row
description: Calculate usable capacity, storage efficiency, fault tolerance, and theoretical performance for RAID 0, 1, 5, 6, 10, 50, 60, and JBOD arrays.
slug: /tools/raid-calculator/
type: page
template: calculator
tool: raid
order: 3
category: Storage
card: Work out usable capacity, overhead, and fault tolerance for RAID 0, 1, 5, 6, 10, 50, 60, and JBOD.
reviewed: 2026-10-28
primary_keyword: raid calculator
complete: true
---

# RAID Calculator

A RAID calculator shows how much usable storage an array provides after parity or mirroring, and how many disks can fail without data loss. Enter a RAID level, the number of disks, and the capacity of each disk. The calculator returns usable capacity in TB and TiB, efficiency, fault tolerance, theoretical performance, and a disk layout.

## How to Use the RAID Calculator

Choose a RAID level, enter the disk count and the capacity per disk, then select Calculate.

- **Number of disks** includes any hot spares.
- **Capacity per disk** should be the smallest drive in the array. Drive labels use decimal terabytes.
- **Hot spares** stay idle until a disk fails, then the controller rebuilds onto them.
- **RAID groups** appear for RAID 50 and 60 and set how many RAID 5 or RAID 6 sets are striped together.
- **Largest disk** is optional. Enter it to see how much space mixed drive sizes leave unused.

Load example fills in an eight-disk RAID 6 array of 12 TB drives with one hot spare.

## RAID Capacity Formulas

In the table, n is the number of active disks after hot spares, s is the capacity of the smallest disk, and g is the number of groups.

| Level | Usable capacity | Minimum disks | Disks that can fail |
|---|---|---|---|
| RAID 0 | n × s | 2 | 0 |
| RAID 1 | s | 2 | n - 1 |
| RAID 5 | (n - 1) × s | 3 | 1 |
| RAID 6 | (n - 2) × s | 4 | 2 |
| RAID 10 | n ÷ 2 × s | 4, even | 1 guaranteed, up to n ÷ 2 |
| RAID 50 | (n - g) × s | 6 | 1 guaranteed, up to g |
| RAID 60 | (n - 2g) × s | 8 | 2 guaranteed, up to 2g |
| JBOD | Sum of disks | 1 | 0 |

The [standard RAID levels](https://en.wikipedia.org/wiki/Standard_RAID_levels) reference describes how each level stripes, mirrors, or stores parity. [Nested RAID levels](https://en.wikipedia.org/wiki/Nested_RAID_levels) covers RAID 10, 50, and 60.

## TB Versus TiB

Drive makers label capacity in decimal terabytes, where 1 TB is 1,000,000,000,000 bytes. Many operating systems report binary tebibytes, where 1 TiB is 1,099,511,627,776 bytes. NIST's guide to [binary prefixes](https://physics.nist.gov/cuu/Units/binary.html) defines both units.

The difference explains why a new 12 TB drive appears as about 10.9 TiB. The calculator shows both values so you can match vendor specifications and operating system reports.

## Worked Example

An array has eight 12 TB disks in RAID 6, and one disk is a hot spare. Seven disks are active, and two disks' worth of capacity holds parity.

Usable capacity is (7 - 2) × 12 TB = 60 TB, or about 54.57 TiB. Raw capacity is 96 TB, so storage efficiency is 62.5%. The array survives any two simultaneous disk failures, and the spare starts rebuilding as soon as one fails.

## Performance and Rebuild Considerations

Read performance scales with the number of disks that hold data, because reads can be spread across them. Writes cost more on parity levels. Each random write to RAID 5 takes four disk operations, and RAID 6 takes six, which is known as the write penalty. Mirrors take two.

These figures are theoretical. Controller cache, drive type, and workload change real results, so treat them as a comparison between levels rather than a forecast.

Rebuild time grows with drive size. While a RAID 5 array rebuilds, one more failure loses the array, which is why many administrators choose RAID 6 or RAID 10 for large drives. RAID protects against disk failure, not deletion, corruption, or ransomware, so keep backups too. Stack Row's [ransomware statistics](/cybersecurity/ransomware-statistics/) show why offline copies matter. Teams sizing storage for a [private cloud](/cloud-infrastructure/private-cloud/) can use the calculator to compare levels before buying drives.

## Methodology and Limitations

- Capacity uses the smallest disk for every member, which is how standard RAID levels allocate space.
- JBOD capacity assumes equal drives. Mixed JBOD capacity is the sum of every drive.
- Usable capacity is before file system formatting and reserved space, which reduce it further.
- Performance multipliers and write penalties are theoretical and ignore caching.
- Fault tolerance assumes failures happen one at a time with no read errors during rebuild.
- Inputs stay in your browser. A calculation is saved locally after you select Calculate.

## Frequently Asked Questions

### How Much Usable Space Does RAID 5 Give?

RAID 5 gives the capacity of all disks except one. Four 4 TB disks provide 12 TB of usable space, with one disk's worth used for parity.

### What Is the Difference Between RAID 5 and RAID 6?

RAID 6 stores two sets of parity, so it survives two disk failures and needs at least four disks. RAID 5 survives one failure and needs at least three.

### Is RAID 10 Better Than RAID 5?

RAID 10 writes faster and rebuilds more quickly, but it uses half the raw capacity. RAID 5 stores more data per disk but has a higher write penalty and longer rebuilds.

### Why Is My Usable Capacity Lower Than Expected?

Parity or mirroring uses part of the raw space, and operating systems often report TiB rather than TB. File system overhead reduces the figure further.

### Can I Mix Drive Sizes in a RAID Array?

You can, but standard RAID levels treat every drive as the size of the smallest one. Extra space on larger drives stays unused unless the system supports flexible volumes.

### Is RAID a Backup?

No. RAID keeps data available when a disk fails, but it copies deletions, corruption, and encryption by ransomware instantly. Keep separate backups.

## Resources

- [Standard RAID levels](https://en.wikipedia.org/wiki/Standard_RAID_levels)
- [Nested RAID levels](https://en.wikipedia.org/wiki/Nested_RAID_levels)
- [NIST: prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html)
