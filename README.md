# Twins in the Loop

Editorial website for Datum co-founders Zac and Jacob Smith.

## Stack

- Astro 7
- Tailwind CSS 4
- MDX content collections
- Bun

## Develop

```bash
bun install
cp .env.example .env
bun run dev
```

`.env` is gitignored. `.env.example` lists the build-time variables.

## Build

`bun run build` is the same command for both environments. The difference is the env at build time.

| Variable          | Production                               | Staging                                                               |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `PUBLIC_SITE_ENV` | `production`                             | `staging` (or anything except `production`)                           |
| Search            | Pages can be indexed; sitemap is emitted | Site-wide `noindex, nofollow`; `robots.txt` disallows `/`; no sitemap |
| `SITE`            | `https://twinsintheloop.com`             | `https://<owner>.github.io` on GitHub Pages                           |
| `BASE_PATH`       | `/`                                      | `/<repo>` for a project Pages URL                                     |

Production (live domain):

```bash
PUBLIC_SITE_ENV=production SITE=https://twinsintheloop.com BASE_PATH=/ bun run build
```

Staging locally (noindex, site root — useful to inspect robots tags):

```bash
PUBLIC_SITE_ENV=staging SITE=https://twinsintheloop.com BASE_PATH=/ bun run build
```

Staging as GitHub Pages will serve it (matches CI):

```bash
PUBLIC_SITE_ENV=staging SITE=https://<owner>.github.io BASE_PATH=/<repo> bun run build
```

Or copy `.env.example` to `.env` and uncomment the matching block. GitHub Actions sets these in [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) (staging) and [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (production-shaped check). See [docs/github-pages.md](./docs/github-pages.md) to publish staging.

## Checks

```bash
bun run lint
bun run check
bun run test
bun run build
```

Content lives in `src/content`. Page copy should be edited there, not in Astro layouts.

See [docs/](./docs/README.md) for how to add posts, change About/authors/footer copy, update SEO, and [publish staging on GitHub Pages](./docs/github-pages.md).

Alliance No.1 is the UI font. DejaVu Sans Mono is used for author tags (`public/fonts/DejaVuSansMono-*.woff`).
