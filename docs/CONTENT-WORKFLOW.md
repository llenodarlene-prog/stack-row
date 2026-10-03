# Editorial Workflow

1. Select an approved route from `data/content-plan.json`.
2. Complete live Ubersuggest research and map five ranking competitors.
3. Verify primary sources and record dates, definitions, samples, and limitations.
4. Move the matching research record from `scaffolded` to `verified`.
5. Draft with the approved keyword, natural internal links, and contextual external citations.
6. Run factual QA, content QA, SEO checks, and the AI-language check.
7. Record sign-offs using the UTC date.
8. Change `draft: true` to `draft: false` only after every gate passes.
9. Open a feature pull request into `staging`, review the noindex deployment, then promote `staging` to `main`.

Historical Ahrefs metrics may be retained as historical context. They do not replace live Ubersuggest research.
