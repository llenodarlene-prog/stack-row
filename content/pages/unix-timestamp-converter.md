---
title: Unix Timestamp Converter
seo_title: Unix and Linux Timestamp Converter (Epoch to Date) | Stack Row
description: Convert Unix and Linux timestamps in seconds, milliseconds, microseconds or nanoseconds to UTC, any time zone and RFC 3339, and turn dates back into epoch time.
slug: /tools/unix-timestamp-converter/
type: page
template: calculator
icon: clock-hour-4
tool: unix-timestamp-converter
order: 17
category: Developer and Data
app_category: DeveloperApplication
action: Open converter
card: Convert epoch time in any unit to UTC, a time zone or RFC 3339, in single or bulk mode.
reviewed: 2026-11-16
primary_keyword: linux timestamp converter
complete: true
---

# Unix Timestamp Converter

A Unix timestamp converter turns epoch time, the count of seconds since January 1, 1970 UTC, into a readable date, and turns a date back into a timestamp. This converter handles seconds, milliseconds, microseconds and nanoseconds exactly, shows any time zone, and converts up to 500 lines at once. It runs in your browser and saves nothing.

## How to Use the Converter

Pick a tab and type or paste a value. Results update as you type.

- **Timestamp to date** reads one timestamp. Leave the unit on Auto detect or choose it yourself, then pick a display time zone.
- **Date to timestamp** reads a date and time as UTC, as your browser's local time, or with an offset you type, such as +05:30.
- **Bulk convert** reads one timestamp per line, keeps the original order, and marks any line it cannot read. Download the table as CSV.

The current Unix time at the top updates every second. Use its Copy buttons to grab the value in seconds or milliseconds.

## What the Results Mean

**UTC** is the instant in Coordinated Universal Time. The **time zone** result shows the same instant as a wall-clock time in the zone you chose, with its offset from UTC on that date. **RFC 3339** is the standard Internet timestamp format, such as 2023-11-14T22:13:20Z. **ISO 8601 (milliseconds)** is what JavaScript's `toISOString()` produces.

The **sub-millisecond remainder** shows the microseconds and nanoseconds that a JavaScript Date cannot hold. The converter keeps them exact and includes them in the RFC 3339 result.

## Worked Example: One Instant in Every Unit

The same moment, 22:13:20 UTC on November 14, 2023, written in each unit:

| Unit | Timestamp |
|---|---|
| Seconds | 1700000000 |
| Milliseconds | 1700000000000 |
| Microseconds | 1700000000000000 |
| Nanoseconds | 1700000000000000000 |

Each value converts to 2023-11-14T22:13:20Z. In New York that instant is 17:13:20 on November 14, because Eastern Standard Time is five hours behind UTC in November. A value of -86400 is one day before the epoch: 1969-12-31T00:00:00Z.

## How the Conversion Works

Unix time counts seconds from 1970-01-01T00:00:00Z. The converter reads your input as an exact integer, multiplies it to nanoseconds, then splits off whole milliseconds for display. Output follows [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339), and time-zone names come from the browser's [Intl.DateTimeFormat](https://tc39.es/ecma402/#datetimeformat-objects) support for the IANA time-zone database.

Auto detect guesses the unit from the number's size. Today, a seconds value has 10 digits, milliseconds 13, microseconds 16 and nanoseconds 19. That rule works for dates between about 1973 and 5138, but it is a guess. Choose the unit yourself when you know it.

## Limits and Privacy

- **Display range.** Browsers can show dates from about 271,821 BC to AD 275,760, the limit set by the [ECMAScript Date specification](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-objects). Larger values get a clear error.
- **Leap seconds.** Unix time and JavaScript ignore leap seconds, so the converter does too.
- **Local time.** A date typed as browser local time can fall in a daylight saving gap, which the converter rejects. It can also fall in an overlap that happens twice, in which case the earlier instant is used and flagged.
- **RFC 3339 years.** RFC 3339 only covers years 0000 to 9999. Dates outside that range show ISO 8601 only.
- **Privacy.** Nothing is uploaded or stored. A share link can carry one timestamp, its unit and the time zone. Dates, offsets and bulk lists never enter the address.

Developers who check API responses can pair this with the tools in Stack Row's guide to [API testing tools](/developer-data/api-testing-tools/). The [binary and hex calculator](/tools/binary-hex-calculator/) helps when timestamps appear in raw hexadecimal logs.

## Frequently Asked Questions

### What Is a Unix Timestamp?

A Unix timestamp is the number of seconds since 00:00:00 UTC on January 1, 1970, called the Unix epoch. Linux, databases and most APIs store time this way because a single number is easy to compare and sort.

### Is Unix Time Measured in Seconds or Milliseconds?

The original definition uses seconds. Many systems, including JavaScript and Java, use milliseconds, and some logging and database tools use microseconds or nanoseconds. Check the documentation of the system that produced the value.

### How Can I Tell Seconds, Milliseconds, Microseconds and Nanoseconds Apart?

Count the digits of a present-day value: 10 for seconds, 13 for milliseconds, 16 for microseconds and 19 for nanoseconds. Very old, very far future, or negative values break this pattern, so set the unit by hand when you are unsure.

### Does Unix Time Include a Time Zone?

No. A Unix timestamp is always measured from the epoch in UTC. The time zone only matters when you display the instant as a local wall-clock time.

### What Happens Before January 1, 1970?

Earlier dates use negative timestamps. For example, -86400 is December 31, 1969 at 00:00 UTC. Some older systems cannot store negative values, so check before you rely on them.

### What Is the Year 2038 Problem?

Systems that store Unix time as a signed 32-bit integer run out of room at 2147483647, which is 03:14:07 UTC on January 19, 2038. One second later the value overflows. Systems that use 64-bit time do not have this limit.

### Does Unix Time Count Leap Seconds?

No. POSIX Unix time treats every day as exactly 86,400 seconds, so leap seconds are not counted as separate instants. This converter and JavaScript follow the same rule.

### Why Can a Local Time Be Ambiguous During Daylight Saving Time?

When clocks go back, one hour of local time happens twice, so a time like 01:30 matches two instants. When clocks go forward, an hour is skipped and some local times never happen. Use UTC or an explicit offset to avoid both problems.

### What Is the Difference Between ISO 8601 and RFC 3339?

RFC 3339 is a stricter profile of ISO 8601 for Internet use. It requires a full date, a full time and a UTC offset or Z, such as 2023-11-14T22:13:20Z. ISO 8601 allows many more layouts.

### Is Pasted Bulk Data Uploaded or Stored?

No. Bulk conversion runs in your browser tab. The list is not uploaded, not saved in browser storage, and never added to a share link. It is cleared when you reset or leave the page.

## Resources

- [RFC 3339: Date and Time on the Internet](https://www.rfc-editor.org/rfc/rfc3339)
- [ECMA-262: Date objects](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-objects)
- [ECMA-402: Intl.DateTimeFormat](https://tc39.es/ecma402/#datetimeformat-objects)
- [The Open Group: Seconds Since the Epoch (POSIX)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html#tag_04_19)
- [HTML: datetime-local input](https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type=datetime-local))
