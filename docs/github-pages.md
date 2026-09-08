# Publish staging on GitHub Pages

The staging site is a GitHub Pages **project site** built by Actions. It is not production (`twinsintheloop.com`). Staging is always `noindex` for search engines.

Staging URL:

`https://<owner>.github.io/<repo>/`

Example: `https://datum-cloud.github.io/twins-in-the-loop/`

## One-time repo setup

1. In the GitHub repo, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”).
3. Confirm Pages is enabled for the organization and this repository.
4. The workflow uses a GitHub Environment named `staging`. GitHub creates it on the first successful deploy. If the org requires environment protection, create **Settings → Environments → staging** first and add reviewers if needed.

The workflow already requests `pages: write` and `id-token: write`. Repo or org Actions settings must allow GitHub Actions to deploy Pages.

## Publish

1. Merge or push to `main` (or run **Actions → Deploy GitHub Pages → Run workflow**).
2. Workflow [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) builds with:
   - `PUBLIC_SITE_ENV=staging`
   - `SITE=https://<owner>.github.io`
   - `BASE_PATH=/<repo>`
3. It writes `dist/.nojekyll` so Pages does not ignore Astro’s `_astro/` assets, then deploys the `dist` artifact.

Local production vs staging build commands live in the [README](../README.md#build) (same `bun run build`, different env). Copy [`.env.example`](../.env.example) for local overrides.

## Check the run

1. Open **Actions → Deploy GitHub Pages**.
2. Confirm the latest run is green.
3. Open the **staging** environment URL from the job summary, or visit `https://<owner>.github.io/<repo>/`.

Internal links and assets use the repo `base` path. A 404 on CSS or `/about` usually means Pages source is not GitHub Actions, or you opened the URL without the `/<repo>/` prefix.

## Crawlers

Staging sets `<meta name="robots" content="noindex, nofollow">` on every page and serves `robots.txt` with `Disallow: /`. It does not emit a sitemap.

Do not add the Pages URL in Google Search Console as a property you want indexed.

## Production

Production stays on `twinsintheloop.com`. That host must set `PUBLIC_SITE_ENV=production` at build time so pages can be indexed (and per-page `noindex` in MDX still applies).

`bun run dev` and a local `bun run build` without that flag are not indexable. CI sets `PUBLIC_SITE_ENV=production` only so the production-shaped build is checked.
