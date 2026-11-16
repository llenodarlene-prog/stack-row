---
title: URL Encoder and Decoder
seo_title: URL Encoder and Decoder: Percent-Encode Online | Stack Row
description: Encode or decode URL components, parse a full URL into its parts, edit query parameters, and convert form data, with UTF-8 support and strict error checks.
slug: /tools/url-encoder-decoder/
type: page
template: calculator
icon: link
tool: url-encoder-decoder
order: 19
category: Developer and Data
app_category: DeveloperApplication
action: Open encoder
card: Percent-encode or decode text, split a URL into parts, and edit query strings safely.
reviewed: 2026-11-16
primary_keyword: url encoder
complete: true
---

# URL Encoder and Decoder

A URL encoder replaces characters that are not allowed in a web address with percent codes, such as a space becoming %20. This tool encodes and decodes URL components, splits a full URL into its parts, edits query parameters, and converts HTML form data. It reads text as UTF-8, flags broken input instead of guessing, and never visits the URL you enter.

## How to Use the Encoder

Choose the mode that matches what you are working on. Results update as you type.

- **Encode** turns text into a safe URL component, such as a search term or one path segment. Choose how spaces are written and whether existing %XX codes stay as they are.
- **Decode** turns percent codes back into text. A + sign stays a + sign in this mode.
- **Parse URL** splits a full address into scheme, user name, host, port, path, query and fragment. A password, if present, is hidden.
- **Edit query** lists every parameter in order, including repeated keys. Change, add or remove parameters and copy the rebuilt URL.
- **Form encoding** encodes or decodes data in the format HTML forms send, where a space is a +.

Swap moves the output of Encode or Decode into the other mode, so you can check a round trip.

## Percent Encoding Explained

Percent encoding writes a byte as a % followed by two hexadecimal digits. Text is first turned into bytes with UTF-8, so one character can become several codes: é becomes %C3%A9.

Some characters are always safe. Letters, digits and - . _ ~ are called unreserved characters. Others, such as / ? # & = and :, are reserved because they separate the parts of a URL. Encode a reserved character when it is data rather than a separator, for example a / inside a file name.

The [WHATWG URL Standard](https://url.spec.whatwg.org/) defines how browsers parse addresses and which characters each part allows. The original syntax comes from [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986).

## Worked Example

The text `café menu/2026?size=large & hot`, encoded as one component with spaces as %20, becomes:

`caf%C3%A9%20menu%2F2026%3Fsize%3Dlarge%20%26%20hot`

The é becomes two UTF-8 bytes, the spaces become %20, and the reserved characters / ? = and & are encoded because they are part of the value. Decoding the result gives back the original text exactly.

## How the Modes Differ

| Mode | Space | Keeps as is | Use for |
|---|---|---|---|
| Encode component | %20 (or + if chosen) | Letters, digits, - _ . ! ~ * ' ( ) | One path segment or one query value |
| Form encoding | + | Letters, digits, * - . _ | HTML form bodies and form-style query strings |
| Decode | + stays + | Not applicable | Reading percent-encoded text |

Component encoding matches JavaScript's `encodeURIComponent`. Form encoding follows the WHATWG `application/x-www-form-urlencoded` rules. Encoding a whole URL as one component breaks it, because the slashes and question mark get encoded too. Use Parse URL or Edit query for full addresses.

## Limits and Privacy

- **Size.** Up to 100 KB of input. Highlighting of encoded characters is turned off above 5,000 characters.
- **Strict decoding.** A % that is not followed by two hex digits, or bytes that are not valid UTF-8, produce an error with the position, rather than a silent replacement.
- **No double encoding by default.** Existing %XX codes are left alone unless you choose to encode the % sign too.
- **Nothing is fetched.** The tool reads the URL as text only. It does not check whether the page exists.
- **Privacy.** Processing stays in your browser. Nothing is saved, and the page address never includes what you type. URLs often carry access tokens or personal data, so be careful where you paste or send them.

Developers testing requests can find more tools in Stack Row's guide to [API testing tools](/developer-data/api-testing-tools/). If you are working with gateways that rewrite query strings, the explainer on [API gateways](/developer-data/api-gateways/) covers where that happens.

## Frequently Asked Questions

### What Is URL Encoding?

URL encoding, also called percent encoding, writes characters that cannot appear in a URL as a % and two hexadecimal digits. It lets spaces, accented letters and reserved symbols travel safely inside an address.

### Why Does a Space Sometimes Become %20 and Sometimes +?

%20 is the standard code for a space anywhere in a URL. The + sign means a space only in form-encoded data, such as HTML form submissions and many query strings. In a path, a + is just a plus sign.

### What Is the Difference Between Encoding a Component and a Full URL?

A component is one piece of a URL, such as a search term. Encoding it turns reserved characters like / and ? into codes. A full URL needs those characters to stay as separators, so it should be parsed into parts, not encoded as one string.

### What Is Double Encoding?

Double encoding happens when already-encoded text is encoded again, so %20 becomes %2520. It usually causes broken links. This tool leaves existing %XX codes alone unless you ask it not to.

### Why Do Accented Letters Become Several Codes?

URLs carry bytes, and UTF-8 uses more than one byte for most non-English characters. The letter é is two bytes, %C3%A9, and an emoji is four.

### Is the Fragment Part of the Query?

No. The fragment starts at # and stays in the browser. It is never sent to the server and is not part of the query string. This tool keeps it separate when it parses or rebuilds a URL.

### Can a Query String Repeat the Same Key?

Yes. Many servers read repeated keys, such as tag=a&tag=b, as a list. The query editor keeps every repeated key in its original order.

### Is URL Encoding a Form of Encryption?

No. Anyone can decode percent-encoded text instantly. Encoding only makes characters safe to send. It does not hide them, so never rely on it to protect passwords or tokens.

### Is My Text Uploaded or Stored?

No. Encoding, decoding and parsing all happen in your browser. The text is not uploaded, not saved and never added to the page address.

## Resources

- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)
- [MDN: encodeURIComponent()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
- [MDN: URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
