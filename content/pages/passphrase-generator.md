---
title: Passphrase Generator
seo_title: Passphrase Password Generator: Strong, Random and Memorable | Stack Row
description: Generate strong, memorable passphrases from the EFF word list with your browser's cryptography, choose words, separators and capitals, and see the real entropy.
slug: /tools/passphrase-generator/
type: page
template: calculator
icon: key
tool: passphrase-generator
order: 24
category: Cybersecurity
app_category: SecurityApplication
action: Open generator
card: Make strong, easy-to-type passphrases from random words, with their entropy shown.
reviewed: 2026-11-16
primary_keyword: passphrase password generator
complete: true
---

# Passphrase Generator

A passphrase generator creates a password made of several random words, such as Shelter-Ripen-Gloomy-Ascend-Tidal-Mower. Random words are easier to remember and type than random characters, yet just as hard to guess when there are enough of them. This generator picks words from the EFF's 7,776-word list using your browser's cryptography, shows the exact entropy, and never sends or saves what it creates.

## How to Use the Generator

Choose how many words you want, a separator, and whether to add capital letters or a digit, then select Generate. Copy one passphrase with its Copy button, copy them all, or download a text file. Generate as many times as you like; each result is new.

Six words is a good default for most accounts. Use seven or more for a password manager's master password or for anything that protects encryption keys.

## How Strong Is a Passphrase?

Strength depends on how many equally likely choices were made, measured in bits of entropy. Each word picked at random from 7,776 adds log2(7,776) ≈ 12.9 bits.

| Words | Entropy | Possible passphrases |
|---:|---:|---:|
| 4 | 51.7 bits | about 3.7 × 10^15 |
| 5 | 64.6 bits | about 2.8 × 10^19 |
| 6 | 77.5 bits | about 2.2 × 10^23 |
| 7 | 90.5 bits | about 1.7 × 10^27 |
| 8 | 103.4 bits | about 1.3 × 10^31 |

Choosing **random capitals** adds one bit per word, and **adding a digit** to a random word adds about 3.3 bits plus the bits for its position. Capitalizing every first letter, or every letter, adds nothing, because an attacker can assume it.

The "time to try them all" figure assumes one trillion guesses a second, which is roughly what a well-funded attacker can manage offline against a fast hash. Real attacks on online accounts are usually far slower, because services limit login attempts.

## Worked Example

Load the example to make three 6-word passphrases with capitalized words, hyphens and one digit. The entropy is 6 × 12.925 + 3.32 + 2.58 ≈ 83.5 bits. Trying every combination at a trillion guesses a second would take about 420,000 years.

## How the Words Are Chosen

The word list is the [EFF Large Wordlist](https://www.eff.org/dice), designed for passphrases: the words are easy to spell and type and avoid offensive terms. Each word is picked with `crypto.getRandomValues()` from the [Web Cryptography API](https://www.w3.org/TR/webcrypto-2/), using rejection sampling so every word is exactly as likely as every other. `Math.random()` is never used.

[NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) recommends allowing long passwords and passphrases rather than forcing complexity rules, because length adds far more strength than a few symbols.

## Limits and Privacy

- **Entropy assumes you keep the result.** If you edit words, or pick your favorite from a long list, the real strength drops.
- **One passphrase per account.** Reusing a passphrase means one breach exposes every account that uses it. Stack Row's guide to the [best password manager](/cybersecurity/best-password-manager/) covers tools that store a unique password for each site.
- **Add a second factor.** A strong passphrase works best with multifactor authentication, explained in the guide to [what MFA is](/cybersecurity/what-is-mfa/).
- **Privacy.** Passphrases are generated in this tab. They are not sent to Stack Row, saved in your browser or added to the page address.

## Frequently Asked Questions

### What Is a Passphrase?

A passphrase is a password made of several words, often separated by a character such as a hyphen. Randomly chosen words make it both strong and memorable.

### Is a Passphrase Stronger Than a Password?

It can be. A 6-word random passphrase has about 77 bits of entropy, more than a random 12-character password made from letters and digits (about 71 bits). What matters is randomness and length, not whether it looks complicated.

### How Many Words Should a Passphrase Have?

Use at least five words for ordinary accounts and six or seven for anything important, such as a password manager or email account. Each extra word multiplies the number of possibilities by 7,776.

### Do Symbols and Numbers Make a Passphrase Stronger?

Only a little, and only if they are added at random. A digit in a random place adds about 6 bits in total, while one more word adds about 13. Some sites require a digit or symbol, which is why the option exists.

### Can I Make Up My Own Passphrase?

You can, but people choose predictable phrases, song lyrics and quotes that attackers try first. Letting a computer pick truly random words is what makes the entropy figure valid.

### Where Do the Words Come From?

They come from the Electronic Frontier Foundation's Large Wordlist of 7,776 words, published for creating passphrases with dice. The list is used here under its Creative Commons license.

### Are My Passphrases Stored or Sent Anywhere?

No. They are created in your browser and disappear when you leave or reset the page. Nothing is uploaded, logged or saved.

## Resources

- [EFF: Dice-generated passphrases and wordlists](https://www.eff.org/dice)
- [NIST SP 800-63B: Digital Identity Guidelines, Authentication](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [W3C: Web Cryptography Level 2](https://www.w3.org/TR/webcrypto-2/)
