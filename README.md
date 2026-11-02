# Twins in the Loop

Editorial website for Datum co-founders Zac and Jacob Smith.

## Stack

- Astro 7
- Tailwind CSS 4
- MDX content collections
- npm, on Node 26

## Develop

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` is gitignored. `.env.example` lists the build-time variables.

## Build

`npm run build` is the same command for both environments. The difference is the env at build time.

| Variable          | Production                               | Staging                                                               |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `PUBLIC_SITE_ENV` | `production`                             | `staging` (or anything except `production`)                           |
| Search            | Pages can be indexed; sitemap is emitted | Site-wide `noindex, nofollow`; `robots.txt` disallows `/`; no sitemap |
| `SITE`            | `https://www.twins-in-the-loop.com`      | `https://www.twins-in-the-loop.com`                                   |
| `BASE_PATH`       | `/`                                      | `/`                                                                   |

Production (live domain):

```bash
PUBLIC_SITE_ENV=production SITE=https://www.twins-in-the-loop.com BASE_PATH=/ npm run build
```

Staging (noindex — useful to inspect robots tags):

```bash
PUBLIC_SITE_ENV=staging SITE=https://www.twins-in-the-loop.com BASE_PATH=/ npm run build
```

Or copy `.env.example` to `.env`. [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs a production-shaped check; [`.github/workflows/deploy-vercel.yml`](./.github/workflows/deploy-vercel.yml) ships production on a release tag. Staging is a Vercel Preview URL — see [docs/vercel.md](./docs/vercel.md).

The `STRAPI_*` variables are read at request time, not build time. A build succeeds without them.

## Strapi cache webhook

Publishing in Strapi does not rebuild the site. Register a webhook so the runtime cache is purged. The next request fills it from Strapi.

In Strapi Admin → **Settings → Webhooks → Create new webhook**:

| Field  | Value                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------- |
| URL    | `https://www.twins-in-the-loop.com/api/strapi-webhook`                                             |
| Header | `Authorization: Bearer <STRAPI_WEBHOOK_SECRET>`                                                    |
| Events | `entry.publish`, `entry.unpublish`, `entry.update`, `entry.delete` on **Twins Post** and **Topic** |

The secret must match `STRAPI_WEBHOOK_SECRET` on Vercel (and in `.env` locally). A successful call returns `{"ok":true,"tags":["twins-posts", ...]}` — the tag must be the plural `twins-posts`. If the secret is unset, the endpoint returns **503**.

Strapi Cloud cannot reach `localhost`. To drop the runtime cache by hand, with `npm run dev` already running for a local purge:

```bash
npm run cache:clear
npm run cache:clear -- --url https://www.twins-in-the-loop.com --remote
```

Details: [docs/vercel.md](./docs/vercel.md#manual-cache-purge).

## Checks

```bash
npm run lint
npm run check
npm run test
npm run build
```

Blog posts come from Strapi — see [docs/strapi.md](./docs/strapi.md). Other page copy lives in `src/content` and should be edited there, not in Astro layouts. (`src/content/posts/` is kept as reference only; no route reads it.)

See [docs/](./docs/README.md) for how to add posts, change About/authors/footer copy, update SEO, and [deploy production on Vercel](./docs/vercel.md).

Alliance No.1 is the UI font. DejaVu Sans Mono is used for author tags (`public/fonts/DejaVuSansMono-*.woff`).
