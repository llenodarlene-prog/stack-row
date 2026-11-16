---
title: Free Invoice Generator
seo_title: Free Invoice Generator with Logo: Make a PDF Invoice | Stack Row
description: Create a professional invoice in your browser with your logo, line items, discounts, tax and payments, then print it or save it as a PDF. No account and nothing uploaded.
slug: /tools/invoice-generator/
type: page
template: calculator
icon: file-invoice
tool: invoice-generator
order: 22
category: Business Technology
action: Open generator
card: Build an invoice with your logo, discounts and tax, then print it or save it as a PDF.
reviewed: 2026-11-16
primary_keyword: invoice generator
complete: true
---

# Free Invoice Generator

An invoice generator turns your business details, your customer's details and a list of charges into a finished invoice you can send. This free generator adds your logo, works out discounts, tax, shipping and payments to the cent, and lets you print the invoice or save it as a PDF. There is no account, and nothing you type leaves your browser.

## How to Create an Invoice

1. **Add your business.** Enter your name, address and contact details, plus a tax ID if you use one. Add a logo if you like.
2. **Add the customer.** Fill in who the invoice is for.
3. **Set the details.** Give the invoice a number, an issue date and payment terms. The due date fills in from the terms, and you can change it.
4. **List the work.** Add a line for each product or service with a quantity and a rate. Each line can have its own discount. Use Move up and Move down to reorder lines, or Duplicate to copy one.
5. **Add discount, tax and payments.** Choose one tax rate for the invoice or a rate on each line, add shipping or another charge, and record any amount already paid.
6. **Print or save.** Select Print or save as PDF, then choose Save as PDF in your browser's print window. The page uses a [print stylesheet](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing) so only the invoice is printed.

The invoice updates as you type. Duplicate invoice copies everything to the next invoice number with today's date. Load example shows a complete invoice.

## How the Totals Are Calculated

| Step | Formula |
|---|---|
| Line amount | Quantity × rate − line discount |
| Subtotal | Sum of line amounts |
| Invoice discount | A percentage of the subtotal, or a fixed amount |
| Tax | Tax rate × taxable amount |
| Total | Subtotal − invoice discount + shipping + other charges + tax |
| Balance due | Total − amount paid |

The generator uses exact decimal arithmetic, not floating point, so 0.1 × 0.2 is always 0.02. Amounts are rounded to the currency's smallest unit (cents for dollars, whole yen for yen), half away from zero, at three points: each line amount, the invoice discount, and the tax.

**Tax modes.** With **one rate for the invoice**, tax is worked out once on the subtotal after the discount. Shipping and other charges are included only if you choose. With **a rate on each line**, the invoice discount is shared across lines in proportion to their amounts, tax is rounded on each line, and shipping and charges are not taxed. Check which method applies to you, because tax rules vary by country and region.

## Worked Example

Load the example to see this invoice in US dollars:

- 3 pages of website design at $49.99 = $149.97
- 1.5 hours of content migration at $120, less a $20 discount = $160.00
- Subtotal $309.97, less a 10% discount of $31.00 = $278.97
- Tax at 8.25% on $278.97 = $23.02, rounded from $23.015
- Shipping $15.00, so the total is $316.99
- $100.00 already paid leaves a balance due of $216.99

If a customer pays more than the total, the invoice shows a credit balance instead of a negative amount due.

## Privacy and Drafts

- **Browser only.** Your invoice, customer details and logo stay on this device. Nothing is uploaded or sent to Stack Row.
- **Saving is your choice.** Tick "Save this draft in this browser" to keep your work in this browser's storage. Forget saved draft deletes it. Nothing is saved otherwise.
- **Draft files.** Download draft (JSON) saves a file you can import later on any device. Imported files are checked field by field before anything changes.
- **Logos.** PNG, JPEG, WebP and GIF images up to 1 MB are redrawn in your browser as a small PNG. SVG files are refused, because they can contain scripts.
- **Not accounting software.** This tool does not send invoices, collect payments, track who has paid, or give tax or legal advice.

For recurring billing, payments and bookkeeping, compare the options in Stack Row's guide to the [best accounting software for small business](/business-technology/best-accounting-software-small-business/). Freelancers setting rates can use the [billable hours calculator](/tools/billable-hours-calculator/) first. The [profit margin calculator](/tools/profit-margin-calculator/) helps check what a job earns.

## Frequently Asked Questions

### What Should an Invoice Include?

Most invoices show your business name and contact details and the customer's details. They also carry a unique invoice number, the issue and due dates, and an itemized list of charges with the total and how to pay. Some countries require extra details, such as a tax registration number, so check local rules. Electronic invoicing standards such as [OASIS UBL](https://docs.oasis-open.org/ubl/UBL-2.4.html) define the same core fields.

### How Should I Number My Invoices?

Use a unique number for every invoice, in a sequence you can follow, such as INV-0001, INV-0002. Duplicate invoice moves to the next number automatically and keeps any zero padding.

### What Is the Difference Between the Issue Date and the Due Date?

The issue date is when you send the invoice. The due date is when payment is expected. Payment terms such as Net 30 mean payment is due 30 days after the issue date.

### How Are Discounts and Tax Applied?

Line discounts reduce each line first. An invoice discount then reduces the subtotal. Tax is worked out on the amount after discounts, using the mode you choose. Every step is shown in the totals.

### Can I Make an Invoice in Another Currency?

Yes. Choose from 16 currencies, including the euro, the pound and the yen. Amounts round to each currency's usual smallest unit, so yen and won invoices show no decimals.

### How Do I Save an Invoice as a PDF?

Select Print or save as PDF, then pick Save as PDF as the printer in your browser's print window. The printed page shows only the invoice, without the form.

### Is My Invoice Data Stored Anywhere?

Only if you tick the save box, and then only in this browser's local storage. Use Forget saved draft or Start a new invoice to remove it. Nothing is ever sent to a server.

### Is an Invoice Generator the Same as Accounting Software?

No. An invoice generator creates a document. Accounting software also records payments, tracks overdue invoices, reconciles bank accounts and produces tax reports.

## Resources

- [OASIS Universal Business Language (UBL) 2.4](https://docs.oasis-open.org/ubl/UBL-2.4.html)
- [US SBA: Manage your finances](https://www.sba.gov/business-guide/manage-your-business/manage-your-finances)
- [MDN: Printing web pages](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing)
