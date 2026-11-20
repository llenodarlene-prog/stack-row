// Stack Row cyberattack and outage tracker data. Each entry is checked
// against the linked reporting before it is added or changed. Keep entries
// factual: what happened, the stated cause, current status, and whether any
// AI involvement has been reported. Dates are UTC, YYYY-MM-DD.
(function (root) {
  'use strict';
  root.StackRowIncidents = {
    updated: '2026-11-20T09:00:00Z',
    incidents: [
      {
        id: 'optimizely-2026-11', date: '2026-11-16', title: 'Malicious code served through Optimizely scripts on 178 organizations\' websites',
        orgs: ['Optimizely', 'Zoom', 'BBC', 'CNN', 'Salesforce', 'GitLab', 'IKEA', 'HSBC (UAE)', 'Equifax', 'Air France-KLM', 'Ledger', 'Peacock', 'Fox News', 'Alaska Airlines'],
        type: 'supply-chain', sector: 'Cross-sector', status: 'contained', ai: 'none-found',
        summary: 'Attackers exploited a flaw in Optimizely Web Experimentation and added malicious JavaScript to customer projects. Report URI found 188 infected scripts across 178 organizations, including 32 finance or banking sites. The code swapped crypto wallet addresses, skimmed cards, stole cookies and screenshots, and sent older iPhones and iPads to the Coruna and DarkSword exploit kits.',
        cause: 'A flaw in Optimizely\'s Experimentation account signup process let the attacker impersonate customer administrators and change their sites\' code. Optimizely said it blocked the path, removed the injected code, ended sessions and revoked tokens.',
        impact: 'About $7,000 in cryptocurrency traced to attacker wallets. Card, cookie and device losses are unknown. Roughly 34 million page visits loaded the code (range 6 to 150 million).',
        timeline: [
          ['2026-09', 'Report URI first sees the same injected code on Turkish websites.'],
          ['2026-11-16', 'Malicious code appears in Optimizely projects; Report URI raises the alarm.'],
          ['2026-11-16', 'Optimizely confirms and contains the incident; customers contacted.'],
          ['2026-11-17', 'Salesforce disables Optimizely scripts; Equifax stops using Optimizely; IKEA investigating.'],
          ['2026-11-17', 'HSBC says unauthorized scripts were not active on its websites; Apple says the targeted iOS flaws were already patched.']
        ],
        sources: [
          ['The Record', 'https://therecord.media/optimizely-malicious-code-customer-sites'],
          ['Krebs on Security', 'https://krebsonsecurity.com/2026/11/attackers-used-optimizely-to-a-b-test-malware-on-top-websites/'],
          ['Newsweek', 'https://www.newsweek.com/cyber-attack-websites-affected-12725863'],
          ['FinChannel (citing Reuters and BleepingComputer)', 'https://finchannel.com/optimizely-cyberattack-company-fixes-flaw-after-websites-served-malicious-code/141982/tech-2/2026/11/']
        ]
      },
      {
        id: 'card-benefit-provider-2026-11', date: '2026-11-19', title: 'Customer data of Visa, Mastercard and JPMorgan Chase leaked through a third-party provider',
        orgs: ['Visa', 'Mastercard', 'JPMorgan Chase'],
        type: 'ransomware', sector: 'Finance', status: 'investigating', ai: 'none-reported',
        summary: 'A ransomware group leaked data on thousands of customers from an outside company that serves the three firms, The Wall Street Journal reported. Visa said no card numbers were affected and its own systems were not involved. Mastercard said a limited amount of information from cardholders in a specific benefit program was exposed.',
        cause: 'An attack on an unnamed third-party service provider in the Asia-Pacific region. The n0n ransomware group claimed responsibility, according to SOCRadar as cited by the Journal.',
        impact: 'No disruption to payment networks or customer services, according to the companies.',
        timeline: [['2026-11-19', 'Data leaked; the firms confirm a third-party provider was hit.']],
        sources: [['Investing.com via Yahoo (citing The Wall Street Journal)', 'https://www.yahoo.com/news/us/articles/visa-mastercard-jpmorgan-customer-data-163732859.html']]
      },
      {
        id: 'apple-outage-2026-11', date: '2026-11-17', title: 'Apple Account, iCloud, App Store, Apple Music and Apple Pay outage',
        orgs: ['Apple'], type: 'outage', sector: 'Consumer tech', status: 'resolved', ai: 'none-reported',
        summary: 'Sign-in, iCloud, the App Store, Apple Music, Apple Pay, Support, iPhone activation and App Store Connect failed for many users from about 11:30 a.m. ET. Most services recovered that afternoon.',
        cause: 'Apple said an internal update caused the outage and ruled out a cyberattack.',
        impact: 'Thousands of Downdetector reports; mixed reports on Apple Pay transactions.',
        timeline: [['2026-11-17', 'Outage begins late morning ET; most services restored by afternoon.']],
        sources: [['9to5Mac', 'https://9to5mac.com/2026/11/17/icloud-app-store-and-other-apple-services-hit-by-ongoing-outage/'], ['Engadget', 'https://www.engadget.com/2319504/icloud-and-other-apple-services-are-down-in-an-apparent-outage/']]
      },
      {
        id: 'us-banks-outage-2026-11', date: '2026-11-16', title: 'Online banking outages at Chase, Bank of America, Wells Fargo and others',
        orgs: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'U.S. Bank', 'Capital One', 'Truist', 'Zelle'], type: 'outage', sector: 'Finance', status: 'resolved', ai: 'none-reported',
        summary: 'Customers reported trouble reaching accounts and completing transfers, including Zelle payments, until early the next day.',
        cause: 'Chase cited a technical bug, not a cyber issue.',
        impact: 'Delayed transactions; services back to normal by early November 17.',
        timeline: [['2026-11-16', 'Outage reports spike across several banks.'], ['2026-11-17', 'Downdetector shows services back to normal.']],
        sources: [['CBS News', 'https://www.cbsnews.com/news/banks-online-service-outages-jpmorgan-chase-bank-of-america-wells-fargo/']]
      },
      {
        id: 'm365-outage-2026-11', date: '2026-11-12', title: 'Microsoft 365 outage hits Outlook, Exchange Online and Teams',
        orgs: ['Microsoft'], type: 'outage', sector: 'Workplace software', status: 'resolved', ai: 'none-reported',
        summary: 'Exchange Online failed from 16:17 UTC, then the problem spread to Teams, SharePoint, Copilot and parts of Defender. Downdetector logged more than 130,000 Outlook reports at the peak.',
        cause: 'Many Exchange Online servers became unexpectedly unavailable. Microsoft was still revising its account of the cause a day later.',
        impact: 'Email and collaboration disrupted worldwide for more than a day.',
        timeline: [['2026-11-12', 'Exchange Online incident opens at 16:17 UTC.'], ['2026-11-13', 'Recovery continues; fixes not yet fully effective.']],
        sources: [['CIO.com', 'https://www.cio.com/article/4248249/microsoft-struggles-to-get-m365-services-back-online-after-widespread-outage.html']]
      },
      {
        id: 'united-ai-agents-2026-11', date: '2026-11-11', title: 'United Airlines blocks third-party AI agents from booking and managing trips',
        orgs: ['United Airlines'], type: 'ai-agent', sector: 'Travel', status: 'policy', ai: 'policy',
        summary: 'United restricted personal and third-party AI agents from booking flights and changing reservations, while still letting them search flights. It warned that sharing credentials with agents can lead to unintended purchases, account changes or use of miles.',
        cause: 'Security and regulatory risk from agents acting in customer accounts, including check-in steps that need human acknowledgment.',
        impact: 'Agents limited to search; customers who suspect unauthorized agent access are told to change passwords.',
        timeline: [['2026-11-11', 'United announces the restriction.']],
        sources: [['The Record', 'https://therecord.media/united-airlines-to-block-customers-using-ai-agents'], ['Skift', 'https://skift.com/2026/11/11/united-airlines-moves-to-block-personal-ai-agents-from-booking-flights/']]
      },
      {
        id: 'bank-ai-agents-2026-10', date: '2026-10-22', title: 'Major US banks block unverified AI agents in customer accounts',
        orgs: ['Major US banks'], type: 'ai-agent', sector: 'Finance', status: 'policy', ai: 'reported',
        summary: 'Banks flagged and blocked third-party agent sessions, often where customers had shared their login credentials. Some activity appeared to go beyond users\' instructions, Axios reported. Morgan Stanley said it had not seen rogue agents on its platforms.',
        cause: 'Banks could not verify the agent, the customer\'s consent, or whether actions matched instructions.',
        impact: 'Unquantified; no confirmed losses published.',
        timeline: [['2026-10-22', 'Axios and Reuters report the blocking.'], ['2026-11-16', 'Federal Reserve Governor Barr describes the issue in a speech.']],
        sources: [['Reuters', 'https://www.reuters.com/legal/government/us-banks-detect-unauthorized-ai-agents-customer-accounts-axios-reports-2026-10-22/'], ['Federal Reserve', 'https://www.federalreserve.gov/newsevents/speech/barr20261116a.htm']]
      },
      {
        id: 'gcp-london-2026-10', date: '2026-10-20', title: 'Google Cloud London zone outage disrupts UK banks and businesses',
        orgs: ['Google Cloud', 'Lloyds', 'HSBC', 'Royal Mail'], type: 'outage', sector: 'Cloud', status: 'resolved', ai: 'none-reported',
        summary: 'The europe-west2-b zone lost power for about six hours, taking down compute and data services used by banks and other businesses.',
        cause: 'Emergency generators did not start because of a control system misconfiguration, while one utility feed was already offline for repairs.',
        impact: 'Service interruptions at Lloyds, HSBC, Royal Mail and others.',
        timeline: [['2026-10-20', 'Power event in europe-west2-b.'], ['2026-11-04', 'Google publishes its incident report.']],
        sources: [['The Register', 'https://www.theregister.com/a/5307739']]
      },
      {
        id: 'aisi-agent-test-2026-07', date: '2026-07-28', title: 'UK AI Security Institute finds agents took unsanctioned actions during cyber testing',
        orgs: ['UK AI Security Institute'], type: 'ai-agent', sector: 'Government research', status: 'resolved', ai: 'confirmed',
        summary: 'In 122 evaluation runs with internet access and some safety filters off, agents took 19 unsanctioned actions in 10 runs, including a malicious pull request to a real open-source project backed by fake identities. A maintainer refused the code.',
        cause: 'Deliberately permissive test conditions that do not match normal deployments.',
        impact: 'No real-world harm found.',
        timeline: [['2026-07-28', 'AISI detects unusual data transfers and declares an incident.']],
        sources: [['UK AISI', 'https://www.aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing']]
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
