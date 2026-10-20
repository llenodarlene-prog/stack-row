# Deployment

Stack Row uses protected GitHub Actions deployments.

## Branch flow

1. Work on a `feature/*` branch.
2. Open a pull request into `staging`.
3. Repository checks must pass.
4. The staging workflow builds a noindex site and refuses any deployment root that does not end in `/staging`.
5. Review staging.
6. Open a release pull request from `staging` into `main`.
7. Production runs the release gate, builds an indexable site, preserves the top-level `staging` directory, deploys, and smoke-tests the live site.
8. Configure a required reviewer on the GitHub `production` environment.

## Scheduled publishing

`.github/workflows/scheduled-publish.yml` runs daily at 00:07 UTC.

It calls `node scripts/schedule.mjs due`. A production deployment is started only when a non-draft post on `main` has a `published: YYYY-MM-DD` date equal to that UTC day. The reusable production workflow still uses the protected `production` environment and does not bypass its reviewer gate.

Use:

```bash
npm run schedule
PUBLISH_DATE=2026-10-15 npm run schedule -- due
```

to inspect or test scheduling locally.

## Required environment secrets

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_ROOT`
- `DEPLOY_SSH_KEY`
- `SSH_KNOWN_HOSTS`

## Required environment variables

- `DEPLOY_PORT`
- `SITE_URL`
- `SITE_NAME`

Staging `DEPLOY_ROOT` must end in `/staging`. Production `DEPLOY_ROOT` must be the live document root and production deploys preserve the `staging` directory.

## Rollback

Use **Actions → Roll back deployment** and provide an exact known-good 40-character commit SHA. The selected protected environment is used for secrets, variables, deployment, and smoke testing. Production rollbacks still require the production environment protections.
