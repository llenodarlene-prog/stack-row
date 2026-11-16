---
title: Customer Lifetime Value Calculator
seo_title: Customer Lifetime Value Calculator (CLV and LTV) | Stack Row
description: Estimate customer lifetime value with subscription, repeat-purchase, discounted or historical models, see every formula, and compare LTV to acquisition cost and payback.
slug: /tools/customer-lifetime-value-calculator/
type: page
template: calculator
icon: heart-handshake
tool: customer-lifetime-value-calculator
order: 23
category: SaaS and Startups
card: Estimate CLV four ways, with scenarios, LTV to CAC and payback months.
reviewed: 2026-11-16
primary_keyword: customer lifetime value calculator
complete: true
---

# Customer Lifetime Value Calculator

A customer lifetime value calculator estimates how much gross profit an average customer brings in over the whole relationship. This calculator offers four models: subscription, repeat purchase, discounted and historical. Each one shows its formula with your numbers filled in, a conservative-to-optimistic range, and the LTV to CAC ratio and payback period if you enter an acquisition cost.

## How to Use the Calculator

Pick the model that fits your business, then fill in its inputs. Results update as you type.

- **Subscription** suits SaaS and memberships. Enter revenue per account, gross margin and churn, monthly or yearly.
- **Repeat purchases** suits stores and services without contracts. Enter a period's revenue, orders and unique customers, plus gross margin and an expected lifespan.
- **Discounted** adds up expected profit month by month over a fixed horizon, counting future months for less.
- **Historical** shows what customers have actually contributed so far, after direct costs.

Add a customer acquisition cost to see LTV to CAC and payback. The scenario range moves margin and churn (or lifespan) up and down by the percentage you choose.

## The Formulas

| Model | Formula |
|---|---|
| Subscription | Monthly revenue per account × gross margin ÷ monthly churn |
| Repeat purchase | Average order value × purchases per year × gross margin × lifespan in years |
| Discounted | Sum over each month t of contribution × retention^(t−1) ÷ (1 + monthly discount rate)^t |
| Historical | (Revenue to date − direct costs to date) ÷ customers |
| LTV to CAC | Lifetime value ÷ customer acquisition cost |
| CAC payback | Acquisition cost ÷ monthly gross profit per customer |

Yearly churn is converted to a monthly rate assuming it is steady: 20% a year is about 1.84% a month, not 1.67%. Yearly revenue is divided by 12. The discounted model converts the annual discount rate to a monthly rate the same way.

The subscription formula comes from treating churn as constant. As Fader and Hardie point out in [their note on reconciling CLV formulas](https://www.brucehardie.com/notes/024/), small differences in timing assumptions change the result, which is why the discounted model shows every month.

## Worked Example

Load the example: a subscription at $100 a month with an 80% gross margin and 2% monthly churn.

- Monthly contribution: $100 × 80% = $80
- Average lifetime: 1 ÷ 2% = 50 months
- Lifetime value: $80 ÷ 2% = $4,000
- With a $1,200 acquisition cost, LTV to CAC is 3.33 to 1 and payback takes $1,200 ÷ $80 = 15 months.

With a ±20% range, the conservative case (2.4% churn, 64% margin) gives $2,666.67, and the optimistic case (1.6% churn, 96% margin) gives $6,000. Small changes in churn move the answer a lot.

## Limits of These Estimates

- **No single right formula.** Contracts, purchase patterns and cohorts differ, so pick the model closest to how your customers behave.
- **Constant rates.** The simple models assume churn, spending and margin stay the same. New customers usually churn faster than long-standing ones.
- **Zero churn.** With no churn the subscription formula has no limit. The calculator asks for a horizon instead of showing infinity.
- **Not a valuation.** The result is a planning estimate, not an accounting value or a promise of future revenue.
- **Privacy.** Calculations run in your browser. Inputs save in this browser for next time (use Forget saved calculation to remove them), and a share link carries only these numbers.

For churn in more depth, see Stack Row's [churn rate analysis](/saas/churn-rate-analysis/) with a worked cohort example. The [ARR and MRR calculator](/tools/arr-mrr-calculator/) helps work out revenue per account, and the [SaaS questions and answers](/questions/saas/) cover CAC and LTV benchmarks.

## Frequently Asked Questions

### What Is the Difference Between CLV and LTV?

They mean the same thing: customer lifetime value. SaaS teams often say LTV, while retail and marketing teams often say CLV. Check whether a figure uses revenue or gross profit, because that matters more than the name.

### Should Customer Lifetime Value Use Revenue or Profit?

Use gross profit for decisions about spending. Revenue-based figures look larger but ignore the cost of serving customers. This calculator applies your gross margin in every predictive model.

### What Is the Difference Between Historical and Predictive CLV?

Historical CLV adds up what customers have already contributed. Predictive CLV estimates what they will contribute in future, based on assumptions about churn, spending and lifespan. Use historical figures to check your predictions.

### How Does Churn Affect Lifetime Value?

In the subscription model, lifetime value is divided by churn, so halving churn doubles it. That is why the scenario range moves churn and why small changes make a big difference.

### What Is a Discount Rate in CLV?

A discount rate counts future profit as worth less than profit today, reflecting the cost of money and risk. A 10% annual rate means a dollar earned next year counts as about 91 cents now.

### What Is a Good LTV to CAC Ratio?

Many SaaS investors use 3 to 1 as a rule of thumb, but there is no universal threshold. A ratio that suits a business with fast payback may not suit one that waits years to recover acquisition costs. Look at payback months alongside the ratio.

### What Is CAC Payback?

CAC payback is how many months of gross profit it takes to earn back the cost of winning a customer. A $1,200 CAC with $80 of monthly gross profit pays back in 15 months.

### Why Do Different Cohorts Have Different Lifetime Values?

Customers who joined in different months, through different channels, or on different plans often behave differently. Averages hide this, so calculate CLV for important cohorts separately when you can.

## Resources

- [Fader and Hardie: Reconciling and Clarifying CLV Formulas](https://www.brucehardie.com/notes/024/)
- [Investopedia: Lifetime value](https://www.investopedia.com/terms/l/lifetimevalue.asp)
