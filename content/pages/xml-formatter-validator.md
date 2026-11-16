---
title: XML Formatter and Validator
seo_title: Online XML Formatter and Validator: Beautify and Check XML | Stack Row
description: Format, minify and check XML for well-formedness in your browser, with exact line and column errors, a tree preview, and no external entity loading.
slug: /tools/xml-formatter-validator/
type: page
template: calculator
icon: file-code
tool: xml-formatter-validator
order: 20
category: Developer and Data
app_category: DeveloperApplication
action: Open formatter
card: Beautify or minify XML and find the exact line and column of any syntax error.
reviewed: 2026-11-16
primary_keyword: online xml formatter
complete: true
---

# XML Formatter and Validator

An online XML formatter adds line breaks and indentation so a document is easy to read, and a validator checks that it follows XML syntax rules. This tool beautifies, minifies and checks XML for well-formedness, shows the line and column of any error, and draws a tree preview. It works in your browser, never uploads your file, and never loads external entities or URLs.

## How to Use the Formatter

Paste XML into the box or open a file. Then choose an action:

- **Beautify** puts each element on its own line and indents it with 2 spaces, 4 spaces or a tab.
- **Minify** removes the line breaks and indentation between elements to make the file smaller.
- **Validate** checks the document and reports whether it is well-formed, without changing it.

You can keep or remove comments, show or hide the tree preview, and search the output. Copy the result or download it as an .xml file. If the document has an error, a box under the input shows the line, the column, the text around it and a suggested fix.

## Well-Formed Versus Schema-Valid XML

**Well-formed** XML follows the syntax rules of [XML 1.0](https://www.w3.org/TR/xml/). There is exactly one root element, every tag is closed in the right order, and attribute values are quoted. Special characters must also be written as references, such as &amp; for &. This tool checks well-formedness.

**Schema-valid** XML also matches a schema, such as an XSD file or a DTD, that says which elements and attributes are allowed. This tool does not check schemas. A document can be well-formed and still fail a schema check.

## What Formatting Keeps

Formatting changes only the whitespace between elements. It keeps:

- The XML declaration, namespaces and prefixes
- Comments (unless you choose to remove them), CDATA sections and processing instructions
- The order of elements and of attributes within each tag, and their original quotes and references
- Text exactly as written inside elements that mix text with child elements, such as `<note>Ships in <b>2</b> days</note>`
- Everything inside an element marked `xml:space="preserve"`

## Worked Example

Load the example to format this one-line catalog:

`<catalog xmlns:dc="http://purl.org/dc/elements/1.1/"><book id="b1"><dc:title>Clean Data</dc:title><price currency="USD">29.99</price></book></catalog>`

Beautify with 2 spaces gives:

```
<catalog xmlns:dc="http://purl.org/dc/elements/1.1/">
  <book id="b1">
    <dc:title>Clean Data</dc:title>
    <price currency="USD">29.99</price>
  </book>
</catalog>
```

If you delete `</price>`, the validator reports that it expected `</price>` but found `</book>`, with the line and column of the mistake.

## Security and Limits

XML can reference outside files through a DOCTYPE, and a crafted DTD can define entities that expand into huge amounts of text. The [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html) describes both attacks. To rule them out, this tool rejects any DOCTYPE with an external ID or an internal subset. It also accepts only the five predefined entities and numeric character references.

- **Size.** Up to 1 MB of pasted text or a 1 MB file.
- **Nesting.** Up to 256 levels deep. The tree preview stops at 1,500 nodes, but the formatted text is always complete.
- **Encoding.** Files must be UTF-8. A declaration naming another encoding is kept but flagged.
- **Privacy.** Files are read on your device only. Nothing is uploaded, saved or put in the page address.

The [JSON validator and formatter](/tools/json-validator-formatter/) does the same job for JSON. Teams comparing data formats in APIs can read Stack Row's explainer on [API gateways](/developer-data/api-gateways/). For pipelines that check XML automatically, see the guide to [CI/CD tools](/developer-data/ci-cd-tools/).

## Frequently Asked Questions

### What Is the Difference Between Formatting and Validating XML?

Formatting changes the layout, adding or removing whitespace between elements. Validating checks whether the document follows the rules. This tool always checks well-formedness first, because a broken document cannot be formatted safely.

### What Does Well-Formed XML Mean?

Well-formed XML has one root element, properly nested and closed tags, quoted attribute values, unique attribute names, and correctly written special characters. Any XML parser can read a well-formed document.

### Does This Tool Validate Against an XSD or DTD?

No. It checks XML 1.0 well-formedness only. Use a schema validator in your editor or build pipeline to check a document against an XSD or DTD.

### What Are XML Namespaces?

Namespaces keep element names from different vocabularies apart. A prefix such as dc: is bound to a URI with an xmlns:dc attribute. The tool checks that every prefix you use is declared.

### What Is a CDATA Section?

A CDATA section, written `<![CDATA[ ... ]]>`, holds text that may contain < and & without escaping them. The parser treats its contents as plain text. Formatting leaves CDATA sections exactly as they are.

### Does Minifying XML Change Its Meaning?

It should not. The minifier removes only whitespace between elements that contain no text of their own. Text inside mixed-content elements and anything marked xml:space="preserve" is left alone.

### What Are External Entities and Why Are They Blocked?

External entities let a DOCTYPE pull content from another file or URL into a document. They can leak files or trigger network requests, so this tool never processes them and rejects documents that declare them.

### Can the Formatter Fix Broken XML?

No. If tags are mismatched or unclosed, there is no safe way to guess what was meant. The tool shows where the problem is and how to fix it, and you correct it yourself.

### Is My File Uploaded or Stored?

No. The file is read and processed in your browser tab. It is not uploaded, not saved in browser storage, and never added to a link.

## Resources

- [W3C: Extensible Markup Language (XML) 1.0, Fifth Edition](https://www.w3.org/TR/xml/)
- [W3C: Namespaces in XML 1.0](https://www.w3.org/TR/xml-names/)
- [OWASP: XML External Entity Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html)
