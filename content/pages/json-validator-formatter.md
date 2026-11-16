---
title: JSON Validator and Formatter
seo_title: JSON Validator and Formatter: Beautify, Check and Convert JSON | Stack Row
description: Validate JSON with exact line and column errors, beautify or minify it, sort keys, browse a tree view, and convert arrays of objects to CSV, all in your browser.
slug: /tools/json-validator-formatter/
type: page
template: calculator
icon: braces
tool: json-validator-formatter
order: 21
category: Developer and Data
app_category: DeveloperApplication
action: Open formatter
card: Check, beautify, minify and sort JSON, explore it as a tree, or turn it into CSV.
reviewed: 2026-11-16
primary_keyword: json validator and formatter
complete: true
---

# JSON Validator and Formatter

A JSON validator checks that text follows the JSON syntax rules, and a formatter lays it out with consistent indentation. This tool validates JSON against RFC 8259 with the exact line, column and character of any error. It also warns about duplicate keys and numbers other software may round, beautifies, minifies or sorts keys, shows a searchable tree, and converts arrays of objects to CSV. It all runs in your browser.

## How to Use the Formatter

Paste JSON or open a file, then pick an action. Results update as you type.

- **Beautify** indents the JSON with 2 spaces, 4 spaces or a tab.
- **Minify** removes all whitespace between tokens.
- **Validate** checks the JSON without changing it and lists any warnings.
- **Tree view** shows the structure with a type label on each value. Search it, choose how many levels open, and copy the path to any value.
- **JSON to CSV** turns an array of objects into a spreadsheet file.

Choose **Sort A to Z** to reorder object keys alphabetically when you beautify or minify. Arrays always keep their order. Copy the result, or download it as .json or .csv.

## What the Validator Checks

The parser follows the grammar in [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259), the JSON standard. Any JSON value is accepted at the top level, including a single string or number. Errors name the problem and its position: a trailing comma, single quotes, a comment, an unquoted key, a bad escape, a raw line break inside a string, or input that ends too early.

It also warns about valid JSON that can still cause trouble:

- **Duplicate keys.** RFC 8259 says names should be unique. Most parsers keep only the last value, so the tool finds duplicates before anything is lost and keeps both in the output.
- **Large integers.** Whole numbers beyond 9,007,199,254,740,991 cannot be stored exactly as JavaScript numbers. The formatter keeps your digits exactly, but other software may round them.
- **Extreme numbers.** Values such as 1e400 become Infinity in most languages.

## Worked Example

Load the example to see an order record with a mistake in it: the key orderId appears twice. Beautify lays it out like this, keeping both values:

```
{
  "orderId": "A-1042",
  "total": 129.50,
  "paid": true,
  ...
  "orderId": "A-1043"
}
```

The warning explains that most parsers would read orderId as "A-1043" and drop "A-1042". Note that 129.50 keeps its trailing zero, because numbers are copied exactly as written.

## JSON to CSV Rules

CSV conversion works only for a top-level array of objects, such as a list of records from an API.

- Columns are every key found, in the order they first appear.
- A missing key leaves an empty cell, and null becomes an empty cell.
- Nested objects or arrays stop the conversion with an error, unless you choose to write them as compact JSON text in the cell.
- Cells starting with =, +, - or @ get an apostrophe in front, so spreadsheet apps do not run them as formulas. [OWASP describes this CSV injection risk](https://owasp.org/www-community/attacks/CSV_Injection).
- The limit is 10,000 rows and 200 columns.

## Limits and Privacy

- **Size.** Up to 1 MB of pasted text or a 1 MB UTF-8 file.
- **Depth.** Up to 256 levels of nesting and 200,000 values. The tree view shows the first 1,500 values.
- **No code runs.** The parser reads the text character by character and never uses `eval`, `Function` or `JSON.parse` on your input.
- **Privacy.** Nothing is uploaded, saved or put in the page address. Even so, avoid pasting passwords or API keys into any online tool.

The [XML formatter and validator](/tools/xml-formatter-validator/) handles XML documents the same way. Developers checking API payloads can find more options in Stack Row's guide to [API testing tools](/developer-data/api-testing-tools/).

## Frequently Asked Questions

### What Makes JSON Valid?

Valid JSON uses double-quoted strings and names, the values true, false and null in lowercase, and numbers without leading zeros. Commas separate items, with none after the last one. Comments are not allowed, and the whole document is a single value.

### What Is the Difference Between Formatting and Validating JSON?

Validating checks that the text follows the rules. Formatting changes only the whitespace, adding indentation or removing it. The formatter always validates first, because it cannot format broken JSON.

### Is a JavaScript Object the Same as JSON?

No. JavaScript object literals allow unquoted keys, single quotes, trailing commas, comments and values like undefined. JSON allows none of these. Valid JSON is always a valid JavaScript expression, but not the other way round.

### Why Are Duplicate Keys a Problem?

RFC 8259 says object names should be unique, and parsers handle duplicates differently. Most keep only the last value, some keep the first, and a few raise an error. The tool warns you so you can decide which value is correct.

### Can JSON Numbers Lose Precision?

Yes, in many programs. JavaScript and many other languages store numbers as 64-bit floating point, which is exact for whole numbers only up to 9,007,199,254,740,991. Send larger IDs as strings if they must stay exact.

### Does JSON Allow Comments or Trailing Commas?

No. Both are common in configuration files written in formats such as JSON5 or JSONC, but standard JSON rejects them. The validator points to the exact character to remove.

### Does Sorting Keys Change My Data?

It changes the order of object members but not their values, and arrays stay in their original order. Most programs ignore member order, but some, such as those comparing signatures or hashes, do not.

### Why Can't Every JSON File Be Converted to CSV?

CSV is a flat table, while JSON can nest objects and arrays to any depth. The converter handles arrays of flat objects and can write nested values as JSON text. Deeply structured data needs flattening rules that depend on what you need.

### Is My JSON Uploaded or Stored?

No. All processing happens in your browser tab. Nothing is uploaded, saved in browser storage, or added to a link.

## Resources

- [RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259)
- [ECMA-404: The JSON Data Interchange Syntax](https://ecma-international.org/publications-and-standards/standards/ecma-404/)
- [OWASP: CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)
- [MDN: Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER)
