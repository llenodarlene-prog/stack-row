# Deployment

GitHub Actions builds the static site and deploys `dist/` over SSH.

Required environment secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_ROOT`
- `DEPLOY_SSH_KEY`
- `SSH_KNOWN_HOSTS`

Required environment variables:

- `DEPLOY_PORT`
- `SITE_URL`
- `SITE_NAME`

Staging builds are noindex. Production builds require `npm run release:check` and a required reviewer in the GitHub `production` environment.
