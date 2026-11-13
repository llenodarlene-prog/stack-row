---
title: Cybersecurity Questions and Answers
seo_title: Cybersecurity Questions Answered | Stack Row
description: Straight answers to common cybersecurity questions on phishing, ransomware, data breaches, zero trust, multifactor authentication and incident response.
slug: /questions/cybersecurity/
type: page
template: questions
icon: lock
category: Cybersecurity
reviewed: 2026-11-13
author: Darlene Aberin
author_url: /about/darlene-aberin/
sections: mail, database, lock, shield
complete: true
---

# Cybersecurity Questions and Answers

Cybersecurity is the work of protecting systems, accounts, and data from attack. These are the most common questions about the threats businesses face. Each answer also covers the controls that stop them.

## Phishing

Phishing is one of the most common ways attackers get in. These answers cover how it works and how to stop it.

### What Is Phishing?

Phishing is a scam where an attacker poses as a trusted person or company. They want you to click a link or open a file. Some ask for a password or payment details instead. Most phishing arrives by email, but texts and phone calls are common too.

The U.S. Cybersecurity and Infrastructure Security Agency (CISA) explains common signs in its [phishing guidance](https://www.cisa.gov/secure-our-world/recognize-and-report-phishing).

### Why Does Phishing Work?

Phishing works because it targets people, not software. Messages create urgency, copy familiar brands, or appear to come from a boss. A busy person may click before checking. Attackers also use real details from social media or past breaches to make messages believable.

### How Can Someone Recognize a Phishing Email?

Check a message for warning signs before you click anything in it. One sign alone may be harmless. Several together usually mean a scam, so report it instead of replying. These are the signs that show up most often.

- **Urgent pressure.** "Your account will close today" or "pay this now."
- **Mismatched sender.** The display name and the real email address don't match.
- **Odd links.** Hovering shows a web address that differs from the one named.
- **Unexpected attachments.** Invoices or documents you weren't expecting.
- **Requests for secrets.** Passwords, codes, or payment changes by email.

Stack Row shows real-world patterns in its collection of [phishing email examples](/cybersecurity/phishing-email-examples/).

### How Can a Business Prevent Phishing?

Combine technical controls with training. Turn on email filtering and set up SPF, DKIM, and DMARC to stop spoofed mail. Require multifactor authentication, so a stolen password isn't enough. Train staff to report suspicious messages, and make reporting easy. Run practice phishing tests a few times a year.

### What Is Spear Phishing?

Spear phishing is a targeted phishing attack aimed at a specific person or team. The attacker researches the target first, then writes a message that uses real names, projects, or vendors. It is harder to spot than mass phishing. Finance and executive staff are frequent targets.

### What Should an Employee Do After Clicking a Phishing Link?

Report it to IT or security right away, without waiting to see if anything happens. If you entered a password, change it at once from a trusted device. Don't delete the email, because security staff may need it. Fast reporting turns a possible breach into a minor event.

## Ransomware and Breaches

Ransomware and data breaches are the attacks that cost businesses the most. These answers cover what happens and how to recover.

### What Is Ransomware?

Ransomware is malicious software that locks or encrypts your files and demands payment to restore them. Many attackers also steal data first and threaten to publish it. Ransomware often enters through phishing, stolen passwords, or unpatched systems. It can halt a whole business for days.

### How Does Ransomware Work?

Ransomware attackers usually get in weeks before anyone notices. They spread quietly, copy valuable data, and then encrypt everything at once. Striking all at once leaves less time to respond. The steps below show a common pattern.

[[flow: A typical ransomware attack | Attacker gets in through phishing or a stolen password > They move across the network and find valuable data > Data is copied out of the company > Files and backups are encrypted > A ransom note demands payment]]

Stack Row's [ransomware statistics](/cybersecurity/ransomware-statistics/) cover how often these attacks happen and what they cost.

### Should a Company Pay a Ransom?

The FBI advises against paying. Payment doesn't guarantee your files come back or that stolen data gets deleted. It also funds future attacks and may mark you as a willing target. Some payments can break sanctions rules. Report the attack to law enforcement and get legal advice first.

### What Should a Business Do After a Data Breach?

Act in a set order. Contain the breach by isolating affected systems. Preserve evidence for investigators. Find out what data was exposed and whose. Notify affected people and regulators as the law requires. Then fix the weakness that let the attacker in.

### How Do Backups Help Ransomware Recovery?

Clean backups let you restore files without paying. Store backups where ransomware can't reach them, such as offline or immutable storage. Test restores regularly. Follow the 3-2-1 rule: three copies, on two types of media, with one off-site.

Stack Row compares tools in its guide to [Windows backup software](/cybersecurity/windows-backup-software/).

### What Is the Difference Between an Incident and a Data Breach?

A security incident is any event that threatens your systems or data, such as malware. A data breach is an incident where someone unauthorized accessed or took data. Every breach is an incident, but most incidents are not breaches.

## Identity and Zero Trust

Many attacks now start with stolen identities. These answers cover zero trust and multifactor authentication.

### What Is Zero Trust Security?

Zero trust trusts no user or device by default, even inside the company network. Every request must prove who it is and that it should have access. Access is limited to what each person needs. NIST describes the model in its [zero trust architecture guide](https://csrc.nist.gov/pubs/sp/800/207/final).

### How Does Zero Trust Work?

Zero trust checks every access request against identity, device health, and context before allowing it. A login from a known laptop at the office may pass easily. The same login from a new country may need extra proof. Users get only the access their role needs.

### What Is Multifactor Authentication?

Multifactor authentication (MFA) requires two or more kinds of proof to log in. That usually means a password plus a code from an app, a security key, or a fingerprint. A stolen password alone is no longer enough. It blocks most automated account takeovers.

Stack Row explains the factor types in its guide to [what MFA is](/cybersecurity/what-is-mfa/).

### What Is Phishing-Resistant MFA?

Phishing-resistant MFA can't be tricked into working on a fake site. Passkeys and hardware security keys use the FIDO2 standard, which ties each login to the real website. Codes typed from an app or a text message can be stolen by a convincing fake page.

### What Is MFA Fatigue?

MFA fatigue is an attack where someone with your password floods you with login approval prompts. They hope you'll tap Approve to make the alerts stop. Number matching, where you type a code shown on screen, defeats most of these attacks. Report unexpected prompts at once.

### Are Passwords Still Needed When MFA Is Enabled?

In most systems, yes. MFA adds a second check on top of the password, so a strong, unique password is still needed. Passkeys are the exception. They replace the password entirely with a key stored on your device. A password manager makes unique passwords practical.

Stack Row compares options in its guide to the [best password manager](/cybersecurity/best-password-manager/).

## Security Operations

Security operations is the day-to-day work of finding and fixing threats. These answers cover the core practices.

### What Is Vulnerability Management?

Vulnerability management is the ongoing process of finding, ranking, and fixing security weaknesses. Teams scan systems for missing patches and misconfigurations. They rank each finding by risk, fix the most serious first, and confirm the fix worked. It runs continuously, not once a year.

### How Are Vulnerabilities Prioritized?

Start with severity, then add context. The Common Vulnerability Scoring System (CVSS) rates technical severity from 0 to 10. CISA's Known Exploited Vulnerabilities catalog lists flaws attackers are using right now, so those go first. Exposure matters too, because internet-facing systems carry more risk.

### What Is Incident Response?

Incident response is the organized way a company detects, contains, and recovers from a security incident. A good plan names who does what and how to communicate. It also says when to involve lawyers or police. NIST's [incident response guide](https://csrc.nist.gov/pubs/sp/800/61/r3/final) is a widely used framework.

### Why Does a Company Need an Incident Response Plan?

A plan turns a chaotic emergency into a set of known steps. Without one, teams waste hours deciding who is in charge while attackers keep working. A plan also helps meet legal deadlines for breach notification. Practice it once a year with a tabletop exercise.

### What Is a Security Operations Center?

A security operations center (SOC) is a team that monitors systems for threats and responds to alerts. Analysts watch logs, network traffic, and endpoint data, often around the clock. Smaller companies usually hire an outside managed SOC instead of building their own.

### What Should an Incident Response Checklist Contain?

A useful checklist covers each stage of a response, from first contact to lessons learned. Keep it short enough to use under pressure. Print a copy too, since systems may be down during an attack.

1. Contact details for the response team, legal, insurer, and law enforcement.
2. Steps to isolate affected systems.
3. How to preserve logs and evidence.
4. Who approves outside communication.
5. Notification rules for customers and regulators.
6. Recovery and lessons-learned steps.

## Sources

- [CISA: Recognize and report phishing](https://www.cisa.gov/secure-our-world/recognize-and-report-phishing)
- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [NIST SP 800-61 Rev. 3: Incident Response Recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
- [FBI: Ransomware](https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-scams-and-crimes/ransomware)
- [CISA: Known Exploited Vulnerabilities catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
