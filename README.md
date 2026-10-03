# Stack Row

Static Node.js publishing repository for [stackrow.org](https://stackrow.org/).

Stack Row is an operator-minded technology publication covering cybersecurity, SaaS, enterprise AI, business technology, and cloud infrastructure.

## Commands

```bash
npm ci
npm run dev
npm run verify
npm run release:check
```

`npm run verify` validates the repository and builds a noindex local preview. `npm run release:check` is the production gate and is expected to fail until all core approvals are complete and at least one verified blog is published.

## Branch flow

Use `feature/*` branches, open a pull request into `staging`, verify the staging deployment, then open a release pull request from `staging` into `main`. Never push directly to `staging` or `main`.

## Source of truth

- Google Drive Stack Row folder
- 5-Site SEO GEO AEO Content & Keyword Tracker, `StackRow` tab
- Five-Site Launch Silo Interlinking Plan
- Portfolio Content Publishing Standards
- Stack Row Website Branding Brief

No Google Drive credential or paid cloud sync is required. Source files can be imported locally after editorial approval.
