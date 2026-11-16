---
title: Cron Expression Generator
seo_title: Cron Expression Generator and Explainer with Next Run Times | Stack Row
description: Build or paste a cron expression, read it in plain English, and see its next five run times in any time zone. Supports ranges, lists, steps, names and @daily shortcuts.
slug: /tools/cron-generator/
type: page
template: calculator
icon: calendar-time
tool: cron-generator
order: 27
category: Developer and Data
app_category: DeveloperApplication
action: Open generator
card: Turn a cron schedule into plain English and see its next five run times.
reviewed: 2026-11-16
primary_keyword: cron generator
complete: true
---

# Cron Expression Generator

A cron generator builds the five-field schedule that Linux cron and many job schedulers use, and an explainer turns an existing expression back into plain English. This tool does both. It describes the schedule, lists the next five run times in any time zone, and flags common mistakes such as a sixth field or an impossible date.

## How to Use the Generator

- **Explain an expression** reads a schedule such as `*/15 9-17 * * MON-FRI` and describes it: every 15 minutes from 09:00 to 17:45, Monday to Friday.
- **Build an expression** starts from a common schedule or lets you fill in each field, then shows the expression to copy.

Choose the time zone your server uses to see when the job will actually run. Copy the expression, download it with its description, or share a link to the schedule.

## Cron Syntax

A standard cron expression has five fields, separated by spaces:

| Field | Values | Example |
|---|---|---|
| Minute | 0 to 59 | `30` |
| Hour | 0 to 23 | `9` |
| Day of month | 1 to 31 | `1,15` |
| Month | 1 to 12 or JAN to DEC | `JAN-JUN` |
| Day of week | 0 to 7 or SUN to SAT (0 and 7 are Sunday) | `MON-FRI` |

Each field accepts `*` for every value, a list such as `1,15`, a range such as `1-5`, and a step such as `*/10` or `0-30/5`. Shortcuts replace the whole expression: `@hourly`, `@daily`, `@weekly`, `@monthly` and `@yearly`.

When both day of month and day of week are restricted, most cron versions run the job when **either** matches. So `0 0 1 * MON` runs on the 1st of every month and on every Monday. This follows the classic cron behavior described in the [crontab(5) manual](https://man7.org/linux/man-pages/man5/crontab.5.html).

## Worked Example

Load the example, `*/15 9-17 * * MON-FRI`, shown in America/New_York time:

- `*/15` in the minute field means minutes 0, 15, 30 and 45.
- `9-17` in the hour field means every hour from 9 to 17.
- `MON-FRI` limits it to weekdays.

The tool describes this as "At minute 0, 15, 30 and 45 past hour 9 to 17, on Monday to Friday." The last run each day is at 17:45, not 17:00, because the hour range includes all of hour 17.

## Time Zones and Daylight Saving Time

Cron uses the time zone of the machine it runs on, which is often UTC on cloud servers. If a job runs at 02:30 local time and the clocks jump from 02:00 to 03:00, some cron versions skip it and others run it late. When clocks go back, a job in the repeated hour can run twice. The next-run list skips times that do not exist in the chosen zone. To avoid surprises, schedule important jobs in UTC.

## Limits and Privacy

- **Five-field cron only.** Six-field formats with seconds (Quartz, Spring) or a year field are rejected with a clear message. Non-standard extras such as L, W and # are not supported.
- **Next runs** are searched up to five years ahead. Schedules that never happen, such as February 30, are flagged.
- **Privacy.** Everything runs in your browser. Nothing is saved, and a share link carries only the expression and time zone.

Stack Row's guide to [CI/CD tools](/developer-data/ci-cd-tools/) covers pipelines that run on schedules. The [Unix timestamp converter](/tools/unix-timestamp-converter/) helps read the times in job logs.

## Frequently Asked Questions

### What Does * * * * * Mean in Cron?

Five asterisks mean every minute of every hour of every day. It is the most frequent schedule standard cron allows.

### How Do I Run a Cron Job Every 5 Minutes?

Use `*/5 * * * *`. The step `*/5` in the minute field matches minutes 0, 5, 10 and so on.

### How Do I Run a Job on Weekdays Only?

Put `1-5` or `MON-FRI` in the day of week field, such as `0 9 * * 1-5` for 09:00 on weekdays.

### Is Sunday 0 or 7 in Cron?

Both. Standard cron accepts 0 and 7 for Sunday. This tool treats them the same.

### Why Does My Cron Expression Have Six Fields?

Some schedulers, such as Quartz and Spring, add a seconds field at the start, and some add a year at the end. Linux cron uses exactly five fields, so remove the extra one.

### What Time Zone Does Cron Use?

Cron uses the system time zone of the server unless the cron version supports a CRON_TZ or TZ setting. Check your server's settings and choose the same zone here.

### Can Cron Run a Job Every 30 Seconds?

Not directly, because the smallest unit is one minute. A common workaround is two entries, one of which sleeps for 30 seconds before running the command.

## Resources

- [man7.org: crontab(5)](https://man7.org/linux/man-pages/man5/crontab.5.html)
- [man7.org: cron(8)](https://man7.org/linux/man-pages/man8/cron.8.html)
- [The Open Group: crontab utility (POSIX)](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/crontab.html)
