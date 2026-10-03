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

## Page authoring

Pages and posts are markdown with front matter. Content before the first `## ` heading becomes the page hero; each `## ` heading starts a full-width section. Front matter `image` names a file pair in `assets/images/` (`<name>-1600.jpg` and `<name>-800.jpg`) registered in `data/assets.json`.

- `::: actions` wraps a paragraph of links and renders them as buttons.
- `::: cards` renders each `### [Title](/route/)` heading and its paragraph as a card. Add `{icon:name}` after a heading to use an icon from `scripts/icons.mjs`. Headings without a paragraph render as compact chips.
- `::: coverage` renders a hub's articles and blogs as a filterable index table.
- `::: callout` renders a navy highlight section.
- `## Heading {#id}` adds an anchor.

Links and cards that point at a route missing from the build are removed, and a section whose cards or coverage grid end up empty is dropped. A production build therefore never links to a draft. Pages with `draft: true` behave like draft posts.

Sections with only text use a two-column layout. Hubs set `icon` in front matter. Articles and blogs get an outline, a key-points panel, collapsible FAQ entries and related reading automatically. The header has no collapsed menu: topic links stay visible and scroll sideways on narrow screens.

## Branch flow

Use `feature/*` branches, open a pull request into `staging`, verify the staging deployment, then open a release pull request from `staging` into `main`. Never push directly to `staging` or `main`.

## Source of truth

- Google Drive Stack Row folder
- 5-Site SEO GEO AEO Content & Keyword Tracker, `StackRow` tab
- Five-Site Launch Silo Interlinking Plan
- Portfolio Content Publishing Standards
- Stack Row Website Branding Brief

No Google Drive credential or paid cloud sync is required. Source files can be imported locally after editorial approval.
