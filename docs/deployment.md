# Deployment handoff

- `main` contains source, tests, original illustrations, documentation, and the publication workflow.
- `gh-pages` contains the tested static build, offline assets, `.nojekyll`, and its publication workflow.

## Verified catalog update

- 80 unit tests and 12 production-browser tests passed locally and in GitHub Actions.
- Strict TypeScript, the Vite production build, formatting, and the runtime dependency audit passed.
- The parser recognizes 382 phone model/variant entries across 18 brands. The synthetic sample market covers 82 phone models in each of Lahore, Karachi, and Islamabad.
- Browser checks cover brand filtering, combined category filters, pagination, new-brand discount alerts, price history, imports, persistence, backups, accessibility, mobile layouts, and offline reloads.

The successful [GitHub verification and branch-publication run](https://github.com/maaznpc/protify-prompt/actions/runs/39089670708) refreshed the compiled `gh-pages` branch and dispatched its publication workflow.

## Publication flow

The existing `github-pages` environment permits deployment from `gh-pages`. The original workflow attempted publication from `main`, which GitHub rejected. The corrected workflow retains that protection rule:

1. A push to `main` installs locked dependencies, runs unit and browser tests, and builds the site.
2. After success, it commits the compiled site and publication workflow to `gh-pages`, preserving branch history.
3. It dispatches publication with `gh-pages` as the actual Git reference.
4. That run uploads the compiled files and uses the standard GitHub Pages deployment action in the protected environment.

## Remaining external requirement

The [publication run from the allowed branch](https://github.com/maaznpc/protify-prompt/actions/runs/39089797085) reached `actions/configure-pages`, but GitHub returned **Not Found: no enabled Pages site**. Direct activation through the connected integration is denied with **HTTP 403: Resource not accessible by integration**. The expected public address still returns HTTP 404, so it has not been verified live.

The repository owner can finish activation in [Settings → Pages](https://github.com/maaznpc/protify-prompt/settings/pages): select **GitHub Actions** as the source, retain `gh-pages` in the environment's allowed deployment branches, then run **Test and publish Nearmint** with **gh-pages** selected in the branch dropdown. Future pushes to `main` test, refresh the build, and dispatch publication automatically.

For a one-off publication of the current build, **Deploy from a branch → gh-pages → / (root)** is also available. The automated workflow above uses GitHub Actions for subsequent publications.

This private repository remains subject to GitHub's Pages plan requirements. No repository visibility, account security settings, or deployment protection rules were changed.

Expected address after successful activation and publication: `https://maaznpc.github.io/protify-prompt/`.
