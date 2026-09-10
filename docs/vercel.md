# Deploy on Vercel

This site is a **static Astro 7** build. Vercel does not need `@astrojs/vercel` unless you add SSR later. Production is `twinsintheloop.com`. Preview deployments are staging: site-wide `noindex` and no sitemap.

Local `bun run build` commands live in the [README](../README.md#build). Copy [`.env.example`](../.env.example) for local overrides.

## One-time project setup

1. Sign in at [vercel.com](https://vercel.com) with the GitHub account that can access this repo.
2. **Add New… → Project** and import `twins-in-the-loop`.
3. Confirm Vercel detected **Astro**. If not, set **Framework Preset** to Astro.
4. Confirm these build settings (Vercel usually infers them from `bun.lock` and `package.json`):

   | Setting          | Value           |
   | ---------------- | --------------- |
   | Root Directory   | `.` (repo root) |
   | Install Command  | `bun install`   |
   | Build Command    | `bun run build` |
   | Output Directory | `dist`          |
   | Node.js Version  | `22.x`          |

   `package.json` requires Node `>=22.12.0`. Set **Settings → General → Node.js Version** to 22.x if the first build fails on an older runtime.

5. Set environment variables (below) **before** the first production deploy.
6. Turn **off** automatic Production deploys from `main` (see [Production from release tags](#production-from-release-tags)). Keep Git Preview deploys for branches and PRs.

Git integration: every push to a non-production branch and every pull request gets a Preview URL. Production should go live only when Release Please publishes a `v*` tag — not on every merge to `main`.

## Environment variables

These are **build-time** values (`astro.config.mjs` and SEO). Set them in **Settings → Environment Variables**. Assign each variable to the matching Vercel environment.

### Production

| Name              | Value                        | Environments |
| ----------------- | ---------------------------- | ------------ |
| `PUBLIC_SITE_ENV` | `production`                 | Production   |
| `SITE`            | `https://twinsintheloop.com` | Production   |
| `BASE_PATH`       | `/`                          | Production   |

`PUBLIC_SITE_ENV=production` allows indexing and emits the sitemap. Per-page `noindex` in MDX still applies.

### Preview (and Development, if you use `vercel dev`)

| Name              | Value                        | Environments         |
| ----------------- | ---------------------------- | -------------------- |
| `PUBLIC_SITE_ENV` | `staging`                    | Preview, Development |
| `SITE`            | `https://twinsintheloop.com` | Preview, Development |
| `BASE_PATH`       | `/`                          | Preview, Development |

Preview is always `noindex`. Keep `BASE_PATH=/` — Vercel serves the site at the hostname root, unlike GitHub Pages (`/<repo>/`).

After changing env vars, **Redeploy** the latest production (and a preview) so the static HTML is rebuilt. Changing variables alone does not update already-built pages.

Do not put secrets in `PUBLIC_*` variables. This project only uses public build-time site config.

## Domain

1. **Settings → Domains** → add `twinsintheloop.com` (and `www` if you use it).
2. Point DNS as Vercel shows (usually Apex + `www` CNAME, or Datum/Cloud DNS records to Vercel).
3. Set the production domain as the primary. `SITE` must match the canonical origin you want in metadata (`https://twinsintheloop.com`).

Until the custom domain is attached, Production still works on `*.vercel.app`. Update `SITE` only if that apex URL is what you want in canonicals.

## CLI (optional)

From the repo root, with [Vercel CLI](https://vercel.com/docs/cli) logged in:

```bash
bunx vercel login
bunx vercel link
bunx vercel env pull .env.local
bunx vercel          # preview
bunx vercel --prod   # production
```

Do not commit `.vercel/` if your team prefers dashboard-only linking; `.env.local` is gitignored.

## Production from release tags

Release Please (`.github/workflows/release-please.yml`) cuts GitHub Releases with tags like `v1.1.0` (`include-v-in-tag: true`). Vercel’s Git connector **cannot** treat those tags as the Production branch. Production-on-tag is a GitHub Action that calls `vercel deploy --prod`.

### Vercel dashboard

1. Stop Git from shipping Production on every merge to `main`. Use **one** of these (A is enough):

   **A — Ignored Build Step (dashboard, keep PR previews)**

   1. Open the project on Vercel.
   2. **Settings → Build and Deployment**.
   3. **Ignored Build Step** → **Only build preview** → Save.

   Git still builds feature branches and pull requests. Pushes to `main` are treated as Production by Git, then skipped. `vercel deploy --prod` from the tag workflow is a CLI deploy and is not skipped.

   **B — `vercel.json` (skip Git deploys for `main` entirely)**

   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "git": {
       "deploymentEnabled": {
         "main": false
       }
     }
   }
   ```

   Other branches still get Preview deploys. Do **not** set `git.deploymentEnabled` to `false` (boolean) unless you also want to turn off PR previews.

   **C — Dummy production branch (optional extra lock)**

   1. **Settings → Environments → Production**.
   2. **Branch Tracking** → set the production branch to a name that never exists, e.g. `vercel-prod-disabled`.
   3. Save.

   Do **not** use **Auto-assign Custom Production Domains** for this. That still builds Production on `main`; it only delays attaching the domain.

2. Leave **Preview** deploys enabled for branches and pull requests (A and B already do this).
3. Create `VERCEL_TOKEN` on the [Account Tokens](https://vercel.com/account/tokens) page (personal account, not the team switcher). Scope it to the team, then the `twins-in-the-loop` project. Copy the value once (`vcp_…`); Vercel will not show it again.
4. Copy **Team ID** and **Project ID** from the dashboard (or from `.vercel/project.json` after `bunx vercel link`):

   | GitHub secret       | Vercel name | Where to copy                                                                                                                       |
   | ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
   | `VERCEL_ORG_ID`     | Team ID     | Team switcher → **Settings → General** (starts with `team_`). Personal Hobby accounts use **Account Settings → General → User ID**. |
   | `VERCEL_PROJECT_ID` | Project ID  | Project → **Settings → General** (starts with `prj_`)                                                                               |

   Direct Team ID URL: `https://vercel.com/teams/<team-slug>/settings#team-id`

### GitHub secrets

In the repo: **Settings → Secrets and variables → Actions**:

| Secret              | Source                                 |
| ------------------- | -------------------------------------- |
| `VERCEL_TOKEN`      | Vercel access token                    |
| `VERCEL_ORG_ID`     | Team ID (`team_…`) or User ID on Hobby |
| `VERCEL_PROJECT_ID` | Project → Settings → General (`prj_…`) |

### Workflow

[`.github/workflows/deploy-vercel.yml`](../.github/workflows/deploy-vercel.yml) deploys Production. Release Please creates tags with `GITHUB_TOKEN`, which does **not** start other tag workflows, so [`.github/workflows/release-please.yml`](../.github/workflows/release-please.yml) calls this workflow in the same run when a release is created. You can also run **Actions → Deploy Vercel production → Run workflow** (picks the selected branch or tag).

Set the GitHub Actions secrets above first. GitHub creates the `production` Environment on the first run; add required reviewers under **Settings → Environments → production** if you want a manual gate before the deploy job starts.

### Release flow

1. Merge work to `main` → CI + Preview deploys; Release Please opens or updates the release PR.
2. Merge the release PR → Release Please tags `vX.Y.Z` and creates the GitHub Release.
3. The Release Please run calls Deploy Vercel production for that commit.

Merging a content PR to `main` does **not** update `twinsintheloop.com` until the next release tag.

Do not use a custom Ignored Build Step that tries to detect tags. Git Production deploys are branch pushes (`main`), not tag events. Use option A or B above plus this workflow.

## Check the deploy

1. Open the project in Vercel → **Deployments**.
2. Confirm the latest Production deploy is **Ready**.
3. Open `https://twinsintheloop.com` (or the production `*.vercel.app` URL).
4. Confirm a Preview deploy from a branch: robots meta is `noindex, nofollow`, and there is no `/sitemap-index.xml`.
5. On Production, confirm pages can be indexed (unless an MDX entry sets `noindex`) and the sitemap is present.

CSS 404s or missing `/about` usually mean **Output Directory** is not `dist`, or **Root Directory** is not the repo root.

## Install failures (`lefthook`)

`package.json` `prepare` runs `lefthook install`. If `bun install` fails on Vercel because git hooks cannot be installed, set **Install Command** to:

```bash
bun install --frozen-lockfile
```

If it still fails, use:

```bash
bun install --frozen-lockfile --ignore-scripts
```

Only use `--ignore-scripts` if the default install cannot complete. This project allows `esbuild` scripts in `package.json`; skipping all scripts can break native deps.

## Production vs GitHub Pages staging

| Host                          | Role                                                        | `PUBLIC_SITE_ENV` | `BASE_PATH` |
| ----------------------------- | ----------------------------------------------------------- | ----------------- | ----------- |
| Vercel + `twinsintheloop.com` | Production                                                  | `production`      | `/`         |
| Vercel Preview URLs           | Review / staging (noindex)                                  | `staging`         | `/`         |
| GitHub Pages                  | Optional staging (see [github-pages.md](./github-pages.md)) | `staging`         | `/<repo>`   |

You can keep Pages staging and Vercel production at the same time. Do not add Preview or Pages URLs in Search Console as properties you want indexed.
