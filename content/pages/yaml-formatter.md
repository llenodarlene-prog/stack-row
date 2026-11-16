---
title: YAML Formatter and Validator
seo_title: YAML Formatter and Validator: Format, Check and Convert YAML | Stack Row
description: Format and validate YAML with line and column errors, convert YAML to JSON or JSON to YAML, and sort keys, using the safe YAML 1.2 core schema in your browser.
slug: /tools/yaml-formatter/
type: page
template: calculator
icon: file-code
tool: yaml-formatter
order: 25
category: Developer and Data
app_category: DeveloperApplication
action: Open formatter
card: Tidy and check YAML, find the line of any error, and convert between YAML and JSON.
reviewed: 2026-11-16
primary_keyword: yaml formatter
complete: true
---

# YAML Formatter and Validator

A YAML formatter rewrites a YAML file with consistent indentation, and a validator checks that it parses. This tool formats and validates YAML, points to the line and column of any error, and converts YAML to JSON or JSON to YAML. It uses the safe YAML 1.2 core schema, blocks oversized alias expansion, and runs entirely in your browser.

## How to Use the Formatter

Paste YAML or open a .yaml or .yml file, then choose an action:

- **Format** rewrites the YAML with 2 or 4 space indentation, optionally sorting keys from A to Z.
- **Validate** checks that the YAML parses and reports its size and number of documents.
- **YAML to JSON** converts the data to JSON. Several documents become a JSON array.
- **JSON to YAML** converts JSON to YAML.

Copy the result or download it as .yaml or .json. If something is wrong, a box under the input shows the line, the column and the text around the problem.

## What Formatting Changes

The formatter reads your YAML into data and writes it out again. That gives clean, consistent output, but it also means:

- **Comments are removed.** YAML comments are not part of the data. The tool warns you when the input has comments.
- **Anchors and aliases are expanded.** A value defined once with &name and reused with *name is written out in full each time.
- **Quotes are normalized.** Strings are quoted only where needed.

Keep your original file if its comments matter, and use Validate to check it without changing it.

## Worked Example

Load the example, a short service configuration with a flow-style mapping, a list, an anchor and a merge key. Formatting turns the flow-style image setting into block style. It expands the defaults into the prod section, keeps retries at 5 for prod, and drops the comment.

The example also shows a YAML 1.2 detail: `enabled: yes` stays the string "yes". YAML 1.1 tools read yes as true, but the YAML 1.2 core schema used here only treats true and false as booleans.

## Safety and Limits

The tool parses with [js-yaml](https://github.com/nodeca/js-yaml) using the [YAML 1.2](https://yaml.org/spec/1.2.2/) core schema, plus the common << merge key. Language-specific tags such as `!!js/function` are rejected, so YAML can never run code here. Aliases can make a small file expand to millions of values, the so-called billion laughs attack. The tool counts every value after expansion and stops above 100,000.

- **Size.** Up to 1 MB of text or a 1 MB UTF-8 file, and up to 100 levels of nesting.
- **Dates.** Dates such as 2026-11-16 stay as text, because the core schema has no date type.
- **Privacy.** Files are read on your device only. Nothing is uploaded, saved or put in the page address.

The [JSON validator and formatter](/tools/json-validator-formatter/) gives more detail for JSON, such as duplicate keys and number precision. YAML is common in deployment files, which Stack Row's guides to [CI/CD tools](/developer-data/ci-cd-tools/) and [Kubernetes alternatives](/cloud-infrastructure/kubernetes-alternatives/) cover.

## Frequently Asked Questions

### What Is YAML?

YAML is a text format for configuration and data, built on indentation instead of brackets. Kubernetes manifests, GitHub Actions workflows and Docker Compose files all use it.

### Why Is My YAML Invalid?

The most common causes are tabs used for indentation, inconsistent indentation, a missing space after a colon, and unclosed quotes or brackets. The error box shows the exact line and column.

### Can YAML Use Tabs for Indentation?

No. YAML allows only spaces for indentation. A tab at the start of a line causes an error.

### Does Formatting Keep My Comments?

No. Comments are not part of the data, so they are lost when the YAML is rebuilt. Use Validate if you only need to check the file.

### What Is the Difference Between YAML and JSON?

JSON uses braces, brackets and quotes and has no comments. YAML uses indentation, allows comments and supports anchors for reuse. Any JSON document is also valid YAML 1.2.

### Why Does Yes Not Become True?

In YAML 1.2, only true and false are booleans. Older YAML 1.1 tools also treated yes, no, on and off as booleans, which caused surprises, so this tool follows the 1.2 rule.

### Is My YAML Uploaded or Stored?

No. Formatting, validation and conversion all happen in your browser. Nothing is uploaded, saved or added to a link.

## Resources

- [YAML Ain't Markup Language, version 1.2.2](https://yaml.org/spec/1.2.2/)
- [js-yaml on GitHub](https://github.com/nodeca/js-yaml)
- [OWASP: Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
