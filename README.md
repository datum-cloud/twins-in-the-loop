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
| `SITE`            | `https://twinsintheloop.com`             | `https://twinsintheloop.com`                                          |
| `BASE_PATH`       | `/`                                      | `/`                                                                   |

Production (live domain):

```bash
PUBLIC_SITE_ENV=production SITE=https://twinsintheloop.com BASE_PATH=/ bun run build
```

Staging (noindex — useful to inspect robots tags):

```bash
PUBLIC_SITE_ENV=staging SITE=https://twinsintheloop.com BASE_PATH=/ bun run build
```

Or copy `.env.example` to `.env`. [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs a production-shaped check; [`.github/workflows/deploy-vercel.yml`](./.github/workflows/deploy-vercel.yml) ships production on a release tag. Staging is a Vercel Preview URL — see [docs/vercel.md](./docs/vercel.md).

The `STRAPI_*` variables are read at request time, not build time. A build succeeds without them.

## Checks

```bash
bun run lint
bun run check
bun run test
bun run build
```

Blog posts come from Strapi — see [docs/strapi.md](./docs/strapi.md). Other page copy lives in `src/content` and should be edited there, not in Astro layouts. (`src/content/posts/` is kept as reference only; no route reads it.)

See [docs/](./docs/README.md) for how to add posts, change About/authors/footer copy, update SEO, and [deploy production on Vercel](./docs/vercel.md).

Alliance No.1 is the UI font. DejaVu Sans Mono is used for author tags (`public/fonts/DejaVuSansMono-*.woff`).
