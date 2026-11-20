---
title: Cyberattack Tracker
seo_title: Cyberattack Tracker: Live Incidents, Outages and Exploited Vulnerabilities | Stack Row
description: Follow recent cyberattacks, major outages and AI agent incidents with sources and status, plus a live feed of vulnerabilities attackers are exploiting now.
slug: /tools/cyberattack-tracker/
type: page
template: calculator
icon: shield
tool: cyberattack-tracker
order: 28
category: Cybersecurity
app_category: SecurityApplication
action: Open tracker
card: Follow recent cyberattacks, outages and AI agent incidents, plus live exploited vulnerabilities.
reviewed: 2026-11-20
primary_keyword: cyberattack tracker
complete: true
---

# Cyberattack Tracker

A cyberattack tracker collects recent attacks and outages in one place, with what happened, the stated cause and where things stand. This tracker covers supply-chain attacks, ransomware, major outages and AI agent incidents, each checked against named reporting. A live panel shows the vulnerabilities CISA says attackers are exploiting right now.

## How to Use the Tracker

- **Incidents** lists events newest first. Filter by type, search for a company or cause, or filter by status. Open "Cause, impact, timeline and sources" on any card for the details, and copy a direct link to share it.
- **Live: exploited vulnerabilities** loads CISA's Known Exploited Vulnerabilities catalog in your browser and refreshes every 15 minutes while the page is open. Search by vendor or CVE, show only flaws linked to ransomware, or change the time window.

The four numbers at the top count tracked incidents, cyberattacks, outages and attacks where AI involvement has been confirmed.

## What Each Label Means

| Label | Meaning |
|---|---|
| Supply chain | Attackers compromised a vendor whose code or service many customers use |
| Ransomware | A ransomware group stole, leaked or encrypted data |
| Outage | A service failed; the cause was not an attack unless stated |
| AI agents | AI agent behavior, misuse, or a policy restricting agents |
| Investigating | Companies or researchers are still establishing the facts |
| Contained | The attack path is closed, but the investigation continues |
| Resolved | Service restored or the issue closed |

The AI label on each card shows what is known about AI involvement. "No AI involvement found" means investigators said so explicitly. "No AI link reported" means no source has suggested one.

## How Incidents Are Chosen and Checked

An event is added when it affects widely used services or many organizations, and when at least one established outlet, vendor statement or researcher report describes it. Every card links to its sources. Statuses change only when a company or investigator says something new, and the page shows when the incidents were last checked.

The live panel uses the [CISA Known Exploited Vulnerabilities catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog), the US government's list of flaws with evidence of active exploitation. US federal agencies must fix each one by its due date. The data loads from [CISA's public GitHub mirror](https://github.com/cisagov/kev-data). If the feed cannot be reached, the panel shows a recent snapshot and says so.

## Limits and Privacy

- **Not exhaustive.** The tracker covers notable incidents, not every attack.
- **Named is not breached.** Being listed means an organization was affected or named in reporting, not that its own systems were compromised.
- **Reported figures.** Numbers such as page visits or losses come from researchers and companies, and early figures often change.
- **Privacy.** Filters run in your browser and nothing you type is saved. Opening the live panel makes your browser request the CISA data file from GitHub, which receives standard request information such as your IP address.

For a full walkthrough of the biggest recent event, read Stack Row's [cyberattack case study of the Optimizely supply-chain attack](/cybersecurity/cyberattack-case-study-optimizely/). For AI agents, see the report on [rogue AI agents](/ai/rogue-ai-agent/), and for longer-term figures, the [cybersecurity statistics](/cybersecurity/cybersecurity-statistics/).

## Frequently Asked Questions

### What Is a Cyberattack?

A cyberattack is a deliberate attempt to steal, change, destroy or block access to data or systems. Common types include ransomware, phishing, supply-chain attacks and denial-of-service attacks.

### Is Every Outage a Cyberattack?

No. Most large outages come from internal changes, software bugs, misconfigurations or power failures. The Apple, Microsoft 365, US bank and Google Cloud outages in this tracker all had non-attack causes.

### What Is a Supply-Chain Attack?

A supply-chain attack compromises a supplier so that its customers are affected. In the Optimizely case, attackers changed scripts that many websites loaded, so malicious code ran on all of them at once.

### What Is the CISA Known Exploited Vulnerabilities Catalog?

It is a list maintained by the US Cybersecurity and Infrastructure Security Agency of vulnerabilities that attackers are known to be exploiting. It helps organizations decide what to patch first.

### How Often Is the Tracker Updated?

The live vulnerability panel refreshes every 15 minutes while open. Incidents are checked and updated by Stack Row editors as new information is published, and the date of the last check appears at the top.

### Were Any of These Attacks Carried Out by AI?

None of the attacks tracked here has confirmed AI involvement. The researcher who found the Optimizely attack said there was no evidence of it. The AI agent entries cover a government test and companies restricting agents.

## Resources

- [CISA: Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [CISA KEV data on GitHub](https://github.com/cisagov/kev-data)
- [NIST National Vulnerability Database](https://nvd.nist.gov/)
