---
title: SaaS Questions and Answers
seo_title: SaaS Metrics and Software Questions Answered | Stack Row
description: Straight answers to common SaaS questions, from what SaaS is to ARR, MRR, churn, net revenue retention, CAC and customer lifetime value.
slug: /questions/saas/
type: page
template: questions
icon: building
category: SaaS
reviewed: 2026-11-13
author: Darlene Aberin
author_url: /about/darlene-aberin/
sections: building, report-money, percentage, users
complete: true
---

# SaaS Questions and Answers

Software as a service runs on subscriptions. A few recurring metrics show whether a SaaS business is healthy. These are the most common questions, each answered in a few lines with formulas and examples.

## SaaS Basics

Start here for what SaaS is and how it differs from other software. These answers also cover how SaaS companies earn money.

### What Is SaaS?

SaaS, or software as a service, is software you use through a browser or app. The vendor runs it on its own servers. You pay a subscription instead of buying a license. The vendor handles hosting, updates, and security patches. Gmail, Slack, and Salesforce are common examples.

The U.S. National Institute of Standards and Technology (NIST) defines SaaS in its [cloud computing definition](https://csrc.nist.gov/pubs/sp/800/145/final). The customer uses the provider's application but doesn't manage the servers, storage, or operating system underneath.

### How Is SaaS Different From Installed Software?

Installed software runs on your own computers, and you usually buy it once and upgrade later. SaaS runs on the vendor's servers, and you pay as long as you use it. Updates arrive automatically. Your data lives with the vendor, so contracts and exports need checking.

| | Installed software | SaaS |
|---|---|---|
| Where it runs | Your devices or servers | Vendor's cloud |
| Payment | One-time license, plus upgrades | Recurring subscription |
| Updates | You install them | Vendor rolls them out |
| Data location | Your systems | Vendor's systems |

### What Is the Difference Between SaaS, PaaS, and IaaS?

The three cloud models differ in how much the provider manages. IaaS rents raw servers and storage, so you manage the operating system and apps. PaaS gives you a platform to run your own code. SaaS gives you finished software, so you manage only your users and data.

[[layers: Who manages what in each model | You: Data and users (all three models) | You: Your application code (IaaS and PaaS) | You: Operating system (IaaS only) | Provider: Servers, storage, and networks (all three)]]

Stack Row's guide to [IaaS versus PaaS](/cloud-infrastructure/iaas-vs-paas/) explains how to choose between the first two.

### How Do SaaS Companies Make Money?

SaaS companies charge recurring subscription fees, usually monthly or yearly. Revenue grows when they win new customers and sell bigger plans to existing ones. Keeping customers from canceling counts just as much. Many add usage charges, setup fees, or paid support. Recurring revenue makes income predictable, which investors value.

### How Is SaaS Priced?

Most SaaS uses one of four pricing models. Per-seat pricing charges for each user. Tiered pricing sells feature bundles at set prices. Usage-based pricing charges for what you consume, such as API calls. Flat-rate pricing charges one price for everything. Many products mix two models.

- **Per seat.** Common for team tools like Slack.
- **Tiered.** Basic, Pro, and Enterprise plans with growing features.
- **Usage-based.** Common for infrastructure and AI tools.
- **Hybrid.** A base fee plus usage above an allowance.

### What Is SaaS Security?

SaaS security covers how a vendor protects your data and how you control access to it. The vendor secures its servers and code. You manage users, passwords, multifactor authentication, and sharing settings. Ask vendors for a SOC 2 report or ISO 27001 certificate before signing.

## ARR and MRR

Recurring revenue is the headline number for any subscription business. These answers explain the two main measures and how to calculate them.

### What Is Annual Recurring Revenue?

Annual recurring revenue (ARR) is the yearly value of all active subscriptions. It counts only repeating charges, not one-time fees. A company with 100 customers each paying $1,200 a year has $120,000 in ARR. ARR is common for businesses that sell annual contracts.

### What Is Monthly Recurring Revenue?

Monthly recurring revenue (MRR) is the predictable subscription revenue a business earns each month. Add up the monthly value of every active plan. Annual plans are divided by 12. MRR leaves out one-time setup fees, services, and usage spikes that won't repeat.

### What Is the Difference Between ARR and MRR?

ARR and MRR measure the same recurring revenue over different periods. ARR is roughly MRR multiplied by 12. Companies selling monthly plans usually track MRR, while companies with annual contracts track ARR. Neither one is the same as recognized revenue on financial statements.

### How Is MRR Calculated?

Add up each customer's monthly plan value. You can also multiply paying customers by average monthly revenue per customer. Convert annual plans by dividing by 12. Then track the changes each month: new, expansion, contraction, and churned MRR.

| MRR movement | Meaning |
|---|---|
| New MRR | Revenue from new customers |
| Expansion MRR | Upgrades and added seats |
| Contraction MRR | Downgrades |
| Churned MRR | Revenue lost to cancellations |

The [ARR and MRR calculator](/tools/arr-mrr-calculator/) works through these movements for you.

### Which Revenue Should Be Excluded From MRR?

Leave out anything that won't repeat on a schedule. That includes setup and onboarding fees, consulting and training, hardware, one-time purchases, and refunds. Usage charges belong in MRR only if they are predictable. Discounts should be subtracted, because MRR reflects what customers pay.

### Can ARR Be Higher Than Total Revenue?

Yes. ARR is a run-rate, so it shows what current subscriptions would earn over the next year. A fast-growing company can end the year with ARR well above that year's recognized revenue. ARR can also drop below revenue if customers cancel.

## Churn and Retention

Keeping customers counts as much as winning them. These answers define the retention metrics and show how they connect.

### What Is Churn Rate?

Churn rate is the share of customers, or revenue, lost during a period. If you start the month with 200 customers and 6 cancel, customer churn is 3%. Revenue churn measures lost dollars instead, so one large account can matter more than many small ones.

Stack Row's [churn rate analysis](/saas/churn-rate-analysis/) walks through a full customer-cohort example and current benchmarks.

### How Is Churn Rate Calculated?

Divide customers lost during a period by customers at the start. Then multiply by 100. Don't count customers who joined during the period in either number. For revenue churn, divide lost recurring revenue by starting recurring revenue.

### What Is a Good Churn Rate?

There's no single answer, because benchmarks measure different things. Recurly's billing data put median annual SaaS churn near 3.2% in 2026. SaaS Capital found 91% median gross revenue retention among bootstrapped companies, which means 9% yearly revenue churn. Compare against companies with similar prices and contracts.

### Can Churn Rate Be Negative?

Customer churn can't be negative, because you can't lose fewer than zero customers. Net revenue churn can be negative. That happens when upgrades from existing customers bring in more revenue than cancellations and downgrades take away. It's a strong sign of product fit.

### What Is Gross Revenue Retention?

Gross revenue retention (GRR) is the share of starting recurring revenue you keep after cancellations and downgrades. It ignores upgrades, so it can never exceed 100%. A GRR of 91% means you lost 9% of last year's revenue base before any expansion.

### What Is Net Revenue Retention?

Net revenue retention (NRR) measures revenue kept from existing customers after churn, downgrades, and upgrades. It can go above 100%. An NRR of 110% means last year's customers now pay 10% more in total. That holds even after some left.

[[flow: How net revenue retention is built | Start with last year's recurring revenue > Subtract cancellations > Subtract downgrades > Add upgrades and extra seats > Divide by the starting revenue]]

## CAC and Customer Lifetime Value

Growth only pays off when customers are worth more than they cost to win. These answers cover the two numbers that tell you.

### What Is Customer Acquisition Cost?

Customer acquisition cost (CAC) is what you spend to win one new customer. Add up sales and marketing costs for a period. Then divide by the new customers gained in that period. Spending $50,000 to win 100 customers gives a CAC of $500.

### Which Expenses Belong in CAC?

Include every cost of winning customers. That means ad spend, sales and marketing pay, commissions, and agency fees. Sales tools, events, and content costs count too. Leave out costs of serving existing customers, such as support and account management. Be consistent from period to period.

### What Is Customer Lifetime Value?

Customer lifetime value (CLV or LTV) is the gross profit you expect from one customer before they leave. A simple version divides average monthly gross profit per customer by the monthly churn rate. A customer worth $100 a month at 2% churn has an LTV of $5,000.

### What Is a Good LTV-to-CAC Ratio?

Many SaaS investors use 3 to 1 as a rule of thumb. A customer should earn three times what they cost to win. Much lower suggests acquisition is too expensive. Much higher can mean you're underinvesting in growth. Use gross profit, not revenue, for LTV.

### What Is CAC Payback Period?

CAC payback period is the months it takes to earn back the cost of winning a customer. Divide CAC by the monthly gross profit per customer. A $600 CAC with $50 of monthly gross profit pays back in 12 months.

### How Can a SaaS Company Reduce CAC?

Focus spend on the channels that bring customers who stay. Improve website conversion, so the same traffic produces more sign-ups. Build referral and content programs that compound over time. Shorten sales cycles with better qualification. Track CAC by channel, because blended averages hide waste.

The [ROAS calculator](/tools/roas-calculator/) helps check whether paid campaigns cover their own cost.

## Sources

- [NIST SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final)
- [Recurly: Churn rate benchmarks](https://recurly.com/research/churn-rate-benchmarks/)
- [SaaS Capital: Bootstrapped SaaS benchmarks](https://www.saas-capital.com/blog-posts/benchmarking-metrics-for-bootstrapped-saas-companies/)
- [AICPA: SOC 2 overview](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2)
