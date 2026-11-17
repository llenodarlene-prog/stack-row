---
title: Uptime and SLA Calculator
seo_title: Uptime and SLA Calculator: Allowed Downtime and Error Budgets | Stack Row
description: Convert an SLA percentage into allowed downtime per day, month and year, work out availability from downtime or incidents, track an error budget, and combine components.
slug: /tools/uptime-calculator/
type: page
template: calculator
icon: clock-check
tool: uptime-calculator
order: 26
category: Cloud and Infrastructure
card: Turn an SLA into allowed downtime, track an error budget, or combine components.
reviewed: 2026-11-16
primary_keyword: uptime calculator
complete: true
---

# Uptime and SLA Calculator

An uptime calculator turns an availability percentage, such as 99.9%, into the downtime it allows, and turns downtime back into a percentage. This calculator also tracks an error budget, estimates availability from incidents and repair time, and combines components that depend on each other or back each other up.

## How to Use the Calculator

- **Allowed downtime** shows how much downtime a target allows per day, week, month, quarter and year.
- **Uptime from downtime** converts downtime in a period into an availability percentage.
- **Error budget** shows how much of this period's allowed downtime is left.
- **Incidents and MTTR** estimates availability from the number of incidents and the mean time to repair.
- **Combined systems** multiplies the availability of components in a request path and adds redundant copies.

Results update as you type, and you can copy, share, download or print them.

## Allowed Downtime by SLA

| Availability | Per day | Per month | Per year |
|---|---|---|---|
| 99% | 14m 24s | 7h 18m 17s | 3d 15h 39m |
| 99.5% | 7m 12s | 3h 39m 9s | 1d 19h 49m |
| 99.9% | 1m 26s | 43m 50s | 8h 45m 57s |
| 99.95% | 43.2s | 21m 55s | 4h 22m 58s |
| 99.99% | 8.6s | 4m 23s | 52m 36s |
| 99.999% | 864 ms | 26.3s | 5m 16s |

A month here is one twelfth of an average Gregorian year, 30.44 days.

## The Formulas

| Result | Formula |
|---|---|
| Allowed downtime | Period length × (1 − availability) |
| Availability | 1 − downtime ÷ period length |
| Error budget left | Allowed downtime − downtime used |
| Availability from incidents | 1 − (incidents × MTTR) ÷ period length |
| Components in series | A1 × A2 × … × An |
| Redundant copies | 1 − (1 − A)^copies |

The error budget idea comes from site reliability engineering. As [Google's SRE book](https://sre.google/sre-book/embracing-risk/) explains, a 99.9% target leaves a 0.1% budget that teams can spend on releases and experiments. When it runs out, reliability work comes first.

## Worked Example

Load the example to see a 99.9% target. It allows 1 minute 26 seconds of downtime a day, 43 minutes 50 seconds a month and 8 hours 45 minutes 57 seconds a year.

Now suppose your app needs three services that are each 99.9% available. In series they give 99.9% × 99.9% × 99.9% ≈ 99.7%, about 2 hours 11 minutes of downtime a month. Run two independent copies of the whole path and the combined figure rises to about 99.999%. That assumes the copies fail independently, which shared databases or a single region break.

## Limits

- **Contract definitions differ.** SLAs define the month, scheduled maintenance and what counts as down in different ways. Read yours before relying on a number.
- **Independence is assumed.** Combined results assume components fail independently. Real outages often hit several components at once.
- **Averages hide spikes.** Availability from incidents uses mean repair time, so one long outage looks the same as many short ones.
- **Privacy.** Calculations run in your browser. Inputs save in this browser for next time, and share links contain only the numbers.

Stack Row's [cloud computing statistics](/cloud-infrastructure/cloud-computing-statistics/) cover how outages affect businesses. The guide to [network monitoring tools](/cloud-infrastructure/network-monitoring-tools/) compares tools that measure uptime. For monitoring platforms, see [Datadog alternatives](/cloud-infrastructure/datadog-alternatives/).

## Frequently Asked Questions

### How Much Downtime Does 99.9% Uptime Allow?

About 43 minutes 50 seconds a month, 1 minute 26 seconds a day, or 8 hours 46 minutes a year. Each extra nine cuts the allowed downtime by a factor of ten.

### What Is the Difference Between an SLA, an SLO and an SLI?

An SLI is a measurement, such as the share of successful requests. An SLO is your internal target for it, such as 99.9%. An SLA is a contract with customers, usually with a lower target and credits if it is missed.

### What Is an Error Budget?

An error budget is the downtime your target allows in a period. If the target is 99.9% a month, the budget is about 43 minutes. Teams track how much they have used and slow down risky changes when it runs low.

### What Is MTTR?

MTTR, or mean time to repair, is the average time from an incident starting to service being restored. Cutting MTTR raises availability as much as having fewer incidents.

### Why Is a System Less Available Than Its Parts?

When a request needs every component, any one failing causes an outage, so availabilities multiply. Three 99.9% services in series give about 99.7%, not 99.9%.

### Does Redundancy Always Improve Availability?

Only if the copies fail independently. Two servers in the same rack, region or behind the same database can fail together, so the real gain is smaller than the formula suggests.

## Resources

- [Google SRE book: Embracing Risk](https://sre.google/sre-book/embracing-risk/)
- [Google SRE book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [NIST SP 800-34 Rev. 1: Contingency Planning Guide](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)
