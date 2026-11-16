---
title: UUID Generator
seo_title: UUID Generator: Create v4 and v7 UUIDs Online | Stack Row
description: Generate up to 1,000 random UUID v4 or time-ordered UUID v7 values in your browser, and validate any UUID or GUID to see its version, variant and timestamp.
slug: /tools/uuid-generator/
type: page
template: calculator
icon: fingerprint
tool: uuid-generator
order: 18
category: Developer and Data
app_category: DeveloperApplication
action: Open generator
card: Generate v4 or v7 UUIDs in bulk and check any UUID's version, variant and timestamp.
reviewed: 2026-11-16
primary_keyword: uuid generator
complete: true
---

# UUID Generator

A UUID generator creates universally unique identifiers, 128-bit values written as 36 characters such as 3f2b8c1e-9a4d-4e6f-8b21-7c5d0e9f1a23. This generator makes random version 4 UUIDs or time-ordered version 7 UUIDs, up to 1,000 at a time, and checks any UUID you paste. Everything runs in your browser, and nothing is saved or sent anywhere.

## How to Use the Generator

**Generate** creates new values. Choose a version and a quantity, then pick a format: lowercase or uppercase, with or without hyphens, and with or without braces. Select Generate. Copy one value with its Copy button, copy them all, or download a TXT or CSV file.

**Validate and inspect** checks a UUID you already have. It shows whether the value is valid and gives its standard lowercase form, its version and its variant. For version 7 it also shows the time the UUID was created. Load the example to see a braced, uppercase GUID normalized.

## Version 4 or Version 7?

| | Version 4 | Version 7 |
|---|---|---|
| Built from | 122 random bits | A 48-bit Unix millisecond timestamp, a counter and random bits |
| Sort order | Random | Creation order |
| Reveals creation time | No | Yes, to the millisecond |
| Good fit | Opaque IDs, tokens shown in URLs, any case where order does not matter | Database primary keys and logs where time order and index locality help |

Neither version is better in every case. Use version 4 when an ID should give nothing away. Consider version 7 when you want new rows to land near each other in a database index, and you are comfortable with the creation time being readable.

## How the Generator Works

The generator follows [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562), the current UUID standard.

- **Version 4** uses the browser's `crypto.randomUUID()` where available. Otherwise it fills 16 bytes with `crypto.getRandomValues()` and sets the version and variant bits exactly. Both come from the [Web Cryptography API](https://www.w3.org/TR/webcrypto-2/). The generator never uses `Math.random()`.
- **Version 7** writes the current Unix time in milliseconds into the first 48 bits. A 12-bit counter follows, starting at a random value each millisecond and rising for each extra UUID in that millisecond. If the counter would overflow, the generator stops with a message instead of wrapping around, so values from this page always sort in creation order.

Every standard UUID sets a version digit (the first character of the third group) and variant bits (the first character of the fourth group, which is 8, 9, a or b).

## Limits and Privacy

- **Quantity.** Up to 1,000 UUIDs per click.
- **Ordering scope.** Version 7 order is kept within this page. It is not coordinated with other tabs, browsers, devices or servers.
- **Not secrets.** A UUID is an identifier, not a password. Version 7 values also reveal their creation time.
- **Privacy.** Values are created in this tab. They are not uploaded, not saved in browser storage, and never put in the page address. Reset or reload clears them.

Developers working on APIs may also want the [Unix timestamp converter](/tools/unix-timestamp-converter/) for reading version 7 times, and Stack Row's guide to [API testing tools](/developer-data/api-testing-tools/). Teams designing database keys can compare schema tools in the guide to [database visualization tools](/developer-data/database-visualization-tools/).

## Frequently Asked Questions

### What Is a UUID?

A UUID, or universally unique identifier, is a 128-bit value used to label records without a central counter. It is usually written as 32 hexadecimal digits in five groups, 8-4-4-4-12, separated by hyphens.

### Is a GUID the Same as a UUID?

Yes, in practice. GUID, or globally unique identifier, is Microsoft's name for the same 128-bit format. Microsoft tools often show GUIDs in uppercase and inside braces, which this validator accepts and normalizes.

### What Is the Difference Between UUID Version 4 and Version 7?

Version 4 is almost entirely random. Version 7 starts with a Unix timestamp in milliseconds, so values created later sort after earlier ones. Both have the same 36-character layout.

### Is UUID Version 7 Sortable?

Yes. Sorting version 7 UUIDs as text or bytes puts them in creation order, to the millisecond. Values made in the same millisecond on this page also stay in order, thanks to the counter.

### Can Two UUIDs Collide?

In theory yes, but the odds are tiny with a good random source. A version 4 UUID has 122 random bits. Even after generating a billion of them, the chance of any duplicate is far below one in a billion.

### Are UUIDs Secret or Suitable as Passwords?

No. UUIDs are designed to be unique, not secret, and they often appear in URLs and logs. Use a password manager or a purpose-built token for anything that grants access.

### What Do the Version and Variant Bits Mean?

The version is the first digit of the third group, such as 4 or 7, and says how the UUID was built. The variant is in the first digit of the fourth group. A value of 8, 9, a or b marks the RFC 9562 layout.

### Is Uppercase Valid?

Yes. RFC 9562 treats the letters a to f as case-insensitive when reading a UUID. It recommends lowercase when writing one, so lowercase is the default here.

### Can UUIDs Omit Hyphens?

Many systems store the 32 digits without hyphens, and this tool can produce and read that form. The standard text form keeps the hyphens, so expect some software to require them.

### What Are the Nil and Max UUIDs?

The Nil UUID is all zeros, 00000000-0000-0000-0000-000000000000. The Max UUID is all ones, ffffffff-ffff-ffff-ffff-ffffffffffff. RFC 9562 defines both as special values, often used as placeholders, and the validator labels them.

### Can a Version 7 UUID Reveal When It Was Generated?

Yes. The first 48 bits hold the creation time in milliseconds, and the validator shows it. Do not use version 7 where the creation time should stay private.

### Are Generated Values Stored or Transmitted?

No. Generation and validation run in your browser. Values are not sent to Stack Row, not saved, and not added to a share link.

## Resources

- [RFC 9562: Universally Unique IDentifiers (UUIDs)](https://www.rfc-editor.org/rfc/rfc9562)
- [W3C: Web Cryptography Level 2](https://www.w3.org/TR/webcrypto-2/)
- [MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [MDN: Crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
