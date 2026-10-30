---
title: Statistical Significance Calculator
seo_title: Statistical Significance Calculator for A/B Tests | Stack Row
description: Check whether an A/B test result is statistically significant with a two-proportion z-test, p-value, relative uplift, and confidence interval.
slug: /tools/statistical-significance-calculator/
type: page
template: calculator
tool: statistical-significance
order: 9
category: Developer and Data
card: Test whether an A/B test's difference in conversion rate is statistically significant.
reviewed: 2026-10-30
primary_keyword: statistical significance calculator
complete: true
---

# Statistical Significance Calculator

A statistical significance calculator tells you whether the difference between two conversion rates in an A/B test is likely to be real or could be random noise. Enter visitors and conversions for the control and the variant. The calculator runs a two-proportion z-test and returns the p-value, relative uplift, and a confidence interval for the difference.

## How to Use the Calculator

Enter the visitors and conversions for each version, choose a confidence level and hypothesis, and select Calculate.

- **Visitors** are the people or sessions assigned to each version.
- **Conversions** are the people who completed the goal, such as a sign-up or purchase.
- **Confidence level** is usually 95%. Higher levels need more data but produce fewer false positives.
- **Two-sided** asks whether B is different from A. **One-sided** asks only whether B is better, and should be chosen before the test starts.

Load example fills in a test with 10,000 visitors per version.

## The Two-Proportion Z-Test

The calculator compares the two conversion rates using the pooled conversion rate under the assumption that both versions perform the same.

| Step | Formula |
|---|---|
| Conversion rates | p = conversions ÷ visitors |
| Pooled rate | (conversions A + conversions B) ÷ (visitors A + visitors B) |
| Standard error | √(pooled × (1 − pooled) × (1 ÷ visitors A + 1 ÷ visitors B)) |
| Z-score | (rate B − rate A) ÷ standard error |
| p-value (two-sided) | 2 × (1 − Φ(│z│)), where Φ is the standard normal distribution |
| Confidence interval | (rate B − rate A) ± critical z × unpooled standard error |

This follows the method in the NIST/SEMATECH [Engineering Statistics Handbook](https://www.itl.nist.gov/div898/handbook/prc/section3/prc33.htm) for comparing two proportions. A result is significant when the p-value is below 1 minus the confidence level, for example below 0.05 at 95% confidence.

## Worked Example

Version A had 10,000 visitors and 500 conversions, a 5.00% rate. Version B had 10,000 visitors and 580 conversions, a 5.80% rate. That is a 16% relative uplift.

The z-score is about 2.50 and the two-sided p-value is about 0.012. That is below 0.05, so the result is significant at 95% confidence. The 95% confidence interval for the difference runs from about 0.17 to 1.43 percentage points, which does not include zero.

## Common A/B Testing Mistakes

- **Stopping early.** Checking results repeatedly and stopping at the first significant reading inflates false positives. Evan Miller's guide on [how not to run an A/B test](https://www.evanmiller.org/how-not-to-run-an-ab-test.html) explains why. Set a sample size first and check once.
- **Testing too many variants.** Each extra comparison adds a chance of a false positive. Adjust the confidence level or test fewer variants.
- **Ignoring practical size.** A tiny uplift can be significant on huge traffic yet not worth shipping. Look at the confidence interval, not only the p-value.
- **Mixing populations.** Changing traffic sources mid-test can create differences unrelated to the variant.

Product teams often track test results alongside retention, because a change that lifts sign-ups can still hurt long-term customers. A [churn rate analysis](/saas/churn-rate-analysis/) shows how to measure that. Results also belong in the same reporting stack as other metrics, which the review of [business intelligence software](/developer-data/business-intelligence-software/) covers.

## Methodology and Limitations

- The calculator uses the normal approximation, which needs at least about 5 conversions and 5 non-conversions in each group. It warns when a group falls below that.
- It assumes visitors were randomly assigned and counted once each.
- It tests one comparison between two versions. It does not correct for multiple variants or repeated checking.
- The p-value is the probability of a difference at least this large if there were no real difference. It is not the probability that B is better.
- Inputs stay in your browser. A calculation is saved locally after you select Calculate.

## Frequently Asked Questions

### What Does Statistically Significant Mean?

It means a difference as large as the one observed would be unlikely if both versions truly performed the same. At 95% confidence, that chance is below 5%.

### What Is a Good Confidence Level for A/B Tests?

95% is the common default. Use 99% when a false positive is costly, and accept 90% only for low-risk decisions where speed matters more.

### What Is a P-Value?

The p-value is the probability of seeing a difference at least as large as yours if there were no real difference between the versions. A smaller p-value is stronger evidence against no difference.

### Should I Use a One-Sided or Two-Sided Test?

Use two-sided unless you decided before the test that you only care whether B is better. Switching to one-sided after seeing the data overstates the evidence.

### How Many Visitors Does an A/B Test Need?

It depends on your baseline conversion rate and the smallest uplift you care about. Smaller uplifts and lower baseline rates need far more visitors. Plan the sample size before the test begins.

## Resources

- [NIST/SEMATECH e-Handbook: comparing two proportions](https://www.itl.nist.gov/div898/handbook/prc/section3/prc33.htm)
- [Evan Miller: how not to run an A/B test](https://www.evanmiller.org/how-not-to-run-an-ab-test.html)
- [Two-proportion z-test](https://en.wikipedia.org/wiki/Two-proportion_Z-test)
- [Statistical significance](https://en.wikipedia.org/wiki/Statistical_significance)
