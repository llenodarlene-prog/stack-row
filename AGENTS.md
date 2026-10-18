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

## Repository rules

- Work on a feature branch.
- Never push directly to `staging` or `main`.
- Run `npm run verify` before opening a pull request.
- Run `npm run release:check` before a production release.
- Keep drafts out of production pages, listings, sitemap, feed, and structured data.
- Do not commit secrets or raw private Drive exports.

## Launch policy

Production requires completed core pages, approval records, and at least one fully verified published blog. The remaining 19 launch-set items may remain editorial backlog.
