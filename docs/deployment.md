# Deployment handoff

Nearmint's application code and tested production build have been pushed to this repository:

- `main`: source, tests, design assets, documentation, and the Pages workflow.
- `gh-pages`: the complete static production build, including offline assets and `.nojekyll`.

## Verified

- 52 unit tests passed locally and in GitHub Actions.
- 10 production-browser tests passed locally and in GitHub Actions.
- The strict TypeScript and Vite production build passed in both environments.
- Browser tests cover manual/CSV imports, comparable-price results, bookmarks, observation persistence, budget alerts, backups, keyboard focus, responsive widths from 320 to 1440 pixels, automated WCAG AA checks, and offline reloads.
- The runtime dependency audit reported no vulnerabilities.

GitHub's verification run: [Test and publish Nearmint](https://github.com/maaznpc/protify-prompt/actions/runs/39065884357). Its `test-and-build` job succeeded. Its `deploy` job failed in `actions/configure-pages` because no Pages site is enabled.

## Remaining external requirement

Direct Pages creation returned **HTTP 403: Resource not accessible by integration**. Repository push access is available, but the connected integration does not have the Pages/administration access needed to activate the site. Repository metadata still reports `has_pages: false`, and the expected public address returns HTTP 404. The website is **not live yet**.

The repository owner can activate it in [Settings → Pages](https://github.com/maaznpc/protify-prompt/settings/pages):

1. Recommended for automatic future deployments: select **GitHub Actions** as the source, save, then rerun the existing workflow or run **Test and publish Nearmint** from the Actions tab. Future pushes to `main` test and deploy automatically.
2. To publish the already-built snapshot directly: select **Deploy from a branch**, choose **gh-pages**, select **/ (root)**, and save. This branch contains the verified build; it is a snapshot and is not refreshed by the Actions-based workflow.

The repository is private, so GitHub's own Pages plan requirements still apply. No repository visibility or account security settings were changed.

Once activation and deployment succeed, the expected address is `https://maaznpc.github.io/protify-prompt/`. Do not treat that address as a verified live link until it responds successfully.
