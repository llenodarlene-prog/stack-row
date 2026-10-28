---
title: ARR and MRR Calculator
seo_title: ARR and MRR Calculator for SaaS Revenue | Stack Row
description: Calculate MRR, ARR, net new MRR, revenue growth, churn, GRR and NRR using monthly subscription revenue data.
slug: /tools/arr-mrr-calculator/
type: page
template: calculator
tool: arr-mrr
order: 6
category: SaaS
card: Convert MRR and ARR, normalize billing intervals, and measure monthly MRR movement.
reviewed: 2026-10-28
primary_keyword: annual recurring revenue calculator
complete: true
---

# ARR and MRR Calculator

An ARR and MRR calculator converts recurring subscription revenue into monthly and annual values. It can also measure new, expansion, contraction, reactivation, and churned MRR. Use this annual recurring revenue calculator to convert a single figure, normalize several billing intervals, or measure one month of revenue movement. Every result shows its formula, and nothing you enter leaves your browser.

## How to Use the Calculator

Choose the tab that matches the question you need to answer, enter values, and select Calculate.

- **Quick Conversion** turns MRR into ARR or ARR into MRR.
- **Subscription Plans** converts monthly, quarterly, semiannual, and annual prices into normalized MRR for up to 20 plans.
- **MRR Movement** measures one month of new, expansion, reactivation, contraction, and churned MRR.

Load example fills the MRR Movement tab with a sample month. Copy results, Copy share link, Download CSV, and Print results become available after a calculation. Share links carry numbers only, never plan or company names.

## ARR and MRR Formulas

Each result in the calculator uses one of these formulas. Rates need a starting MRR above zero.

| Metric | Formula |
|---|---|
| ARR | MRR × 12 |
| MRR | ARR ÷ 12 |
| Ending MRR | Starting MRR + new + expansion + reactivation - contraction - churned MRR |
| Net new MRR | New + expansion + reactivation - contraction - churned MRR |
| MRR growth rate | Net new MRR ÷ starting MRR × 100 |
| Gross MRR churn rate | (Contraction + churned MRR) ÷ starting MRR × 100 |
| GRR | (Starting MRR - contraction - churned MRR) ÷ starting MRR × 100 |
| NRR | (Starting MRR + expansion + reactivation - contraction - churned MRR) ÷ starting MRR × 100 |

The calculator keeps full precision internally and rounds only the displayed results. Displayed GRR is capped at 100%.

## What Counts as Recurring Revenue

Recurring revenue is the subscription amount a customer is committed to pay on a repeating schedule, normalized to one month for MRR. It includes active subscription fees after any recurring discount.

Classify each change consistently from month to month:

- **New MRR** comes from customers who were not paying at the start of the month.
- **Expansion MRR** comes from existing customers who upgrade or add seats.
- **Reactivation MRR** comes from former customers who return.
- **Contraction MRR** comes from existing customers who downgrade.
- **Churned MRR** comes from customers whose final paid subscription ends.

Analytics tools can recognize churn on different dates, so record your rule before comparing months. ChartMogul's [gross MRR churn rate definition](https://help.chartmogul.com/article/204-chart-gross-mrr-churn-rate) shows one documented convention.

## What Should Not Be Included

Leave these items out of MRR and ARR, or track them separately:

- One-time setup, onboarding, or implementation fees.
- Professional services and training charged per engagement.
- Usage or overage charges that vary month to month, unless your policy defines a committed minimum.
- Taxes collected on behalf of a government.
- Refunds and credits for past periods.

MRR is an operating metric, not recognized revenue or cash received. Follow your accounting policy for financial reporting.

## How Monthly and Annual Contracts Are Normalized

A contract billed less often than monthly is divided by the number of months it covers. Quarterly prices are divided by 3, semiannual prices by 6, and annual prices by 12.

For example, 10 customers paying $1,200 a year add $1,000 of MRR. A mix of 10 customers at $100 a month, 12 at $300 a quarter, and 5 at $1,200 a year produces $2,700 of MRR and $32,400 of ARR. Billing structures vary across [B2B SaaS pricing models](/saas/what-is-b2b-saas/), so normalize each plan before adding them together.

## How to Calculate Net New MRR

Net new MRR is the change in MRR during the month. Add new, expansion, and reactivation MRR, then subtract contraction and churned MRR.

Net new MRR also connects the two balances: starting MRR plus net new MRR equals ending MRR. Divide net new MRR by starting MRR to get the MRR growth rate.

## GRR Versus NRR

Gross revenue retention measures how much starting MRR remains after contraction and churn. It ignores expansion and reactivation, so it cannot exceed 100%.

Net revenue retention adds expansion and reactivation back. It can exceed 100% when existing customers grow faster than others leave. Neither metric includes revenue from new customers, which keeps both focused on the existing base. ChartMogul documents a [net MRR churn calculation](https://help.chartmogul.com/article/207-chart-net-mrr-churn-rate) that treats expansion the same way.

## Worked SaaS Example

This example uses invented figures for one month. Select Load example to reproduce it.

| Movement | Amount |
|---|---:|
| Starting MRR | $50,000 |
| New MRR | $6,000 |
| Expansion MRR | $3,000 |
| Reactivation MRR | $1,000 |
| Contraction MRR | $1,500 |
| Churned MRR | $2,500 |

Net new MRR is $6,000 + $3,000 + $1,000 - $1,500 - $2,500 = $6,000. Ending MRR is $56,000, and ending ARR is $672,000.

The MRR growth rate is 12.00%. Gross MRR churn is $4,000 of $50,000, or 8.00%. GRR is 92.00%, and NRR is 100.00% because expansion and reactivation exactly offset losses from existing customers.

Customer counts tell a different story from revenue. A [churn rate analysis](/saas/churn-rate-analysis/) separates lost customers from lost revenue using the same starting-population method.

## Methodology and Limitations

- The calculator provides mathematical estimates from the values you enter.
- Results depend on consistent classification of new, expansion, reactivation, contraction, and churned revenue.
- Currency selection changes the displayed symbol. It does not perform exchange-rate conversion.
- Taxes, refunds, usage charges, services, and one-time fees require separate treatment.
- Accounting recognition may differ from operational SaaS metrics, so follow your accounting policy for financial reporting.
- The calculator is not an accounting system or a replacement for financial reporting.
- Inputs stay in your browser. A calculation is saved locally only after you select Calculate, and Forget saved calculation or Reset calculator removes it.

Stripe's guide to [calculating churn rates](https://stripe.com/resources/more/how-to-calculate-churn-rates) describes the starting-population approach these rates follow.

## Frequently Asked Questions

### What Is the Formula for ARR?

ARR equals MRR multiplied by 12. Use normalized MRR from active subscriptions, excluding one-time fees, so the annual figure reflects recurring revenue rather than total billings.

### What Is the Formula for MRR?

MRR is the sum of each active subscription's monthly-equivalent price. Divide quarterly prices by 3, semiannual by 6, and annual by 12 before adding them.

### Should One-Time Setup Fees Be Included in MRR?

No. Setup, onboarding, and implementation fees do not repeat, so they belong outside MRR. Track them separately so recurring revenue trends stay comparable from month to month.

### How Do Annual Contracts Affect MRR?

An annual contract adds its yearly price divided by 12 to MRR each month. MRR does not spike in the billing month, even though cash arrives all at once.

### What Is Net New MRR?

Net new MRR is new, expansion, and reactivation MRR minus contraction and churned MRR. It equals the change between starting and ending MRR for the period.

### What Is the Difference Between GRR and NRR?

GRR shows starting revenue kept after contraction and churn, so it cannot exceed 100%. NRR adds expansion and reactivation, so it can rise above 100%.

### Can NRR Exceed 100%?

Yes. NRR exceeds 100% when expansion and reactivation from existing customers outweigh their contraction and churn. It shows growth within the existing base, not overall company growth.

### Should New-Customer Revenue Be Included in NRR?

No. NRR measures revenue retained and expanded from customers who were paying at the start of the period. New-customer MRR belongs in net new MRR and growth instead.

## Resources

- [ChartMogul gross MRR churn rate](https://help.chartmogul.com/article/204-chart-gross-mrr-churn-rate)
- [ChartMogul net MRR churn rate](https://help.chartmogul.com/article/207-chart-net-mrr-churn-rate)
- [ChartMogul net MRR retention](https://help.chartmogul.com/article/163-net-mrr-retention)
- [Stripe: how to calculate churn rates](https://stripe.com/resources/more/how-to-calculate-churn-rates)
