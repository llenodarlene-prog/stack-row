# Stack Row Repository Rules

## Non-negotiable editorial rules

- Never invent statistics, prices, features, dates, authors, quotes, rankings, or first-party findings.
- Verify changeable facts against current primary sources immediately before publication.
- Keep incidents, breaches, exposed records, complaints, attacks, and losses distinct.
- Historical Ahrefs data may be retained for context, but Ubersuggest is the required live SEO research tool.
- Use 2 to 3 contextual internal links and at least 3 useful contextual external links where evidence supports them.
- Follow hub-and-spoke (silo) linking. Each top-level folder is a silo with one pillar article (role Hub or Bridge in `data/content-plan.json`). Every spoke links to its pillar in the body, the pillar links to every published spoke in the body (pillars may exceed 3 internal links for this), and every published post receives at least 2 contextual body links from other posts. Navigation, cards, and coverage tables do not count. `npm run check` enforces this.
- Do not publish a draft without a verified research record, fact-check sign-off, and QA sign-off.
- Apply the AI kill list. Do not use em dashes.

## Final QA and fact-check layer

Run every check in `docs/EDITORIAL-QA-SOP.md` (direct answers, title promise, evidence, added value, no invented information, link test, keyword counts, PASS/REVISE/HOLD). This file's rules are the Stack Row-specific instructions that override that SOP's defaults.

Every blog the content owner hands over gets one more independent pass from the AI assistant before scheduling, even when the owner has already researched, fact-checked, and QA'd it. The owner's sign-off does not replace this layer.

1. Fact-check: verify every statistic, price, date, quote, ranking, and named source against a current primary source. Correct, reword, or remove anything that cannot be verified, and never substitute an unverified figure.
2. QA: check the keyword in the title, intro, and one H2; no intro text under Key Takeaways or FAQs; AI kill list; no em dashes; internal links per the silo rule; working external links; image and alt text.
3. Report: list every change and every removed claim to the owner before scheduling. The owner gives final approval; the assistant never records approval on the owner's behalf.

## Repository rules

- Work on a feature branch.
- Never push directly to `staging` or `main`.
- Run `npm run verify` before opening a pull request.
- Run `npm run release:check` before a production release.
- Keep drafts out of production pages, listings, sitemap, feed, and structured data.
- Do not commit secrets or raw private Drive exports.

## Launch policy

Production requires completed core pages, approval records, and at least one fully verified published blog. The remaining 19 launch-set items may remain editorial backlog.
