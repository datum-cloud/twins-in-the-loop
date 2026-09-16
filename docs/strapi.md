# Strapi integration

How blog posts get from the CMS onto this site, why it is built this way, and the traps worth knowing before you change it.

Operational setup (env vars, webhook registration, deploy settings) lives in [vercel.md](./vercel.md). Authoring lives in [content.md](./content.md).

## Architecture

```
Strapi Cloud ──REST──► fetchCollection() ──► CacheManager ──► normalizePost() ──► pages
     │                                    (Vercel Runtime Cache, 24h)
     └──webhook──► /api/strapi-webhook ──► invalidate tag + re-warm
```

The site is `output: 'server'` on `@astrojs/vercel`. Only `/about` and `/robots.txt` are prerendered; everything else renders per request off the cache. Publishing in Strapi does not require a rebuild.

| Layer                          | File                              |
| ------------------------------ | --------------------------------- |
| Cache driver (Vercel Runtime)  | `src/lib/strapi/cacheDriver.ts`   |
| Cache manager, config, tag map | `src/lib/strapi/revalidate.ts`    |
| REST client + cache wrapper    | `src/lib/strapi/client.ts`        |
| Types, queries, normalization  | `src/lib/strapi/posts.ts`         |
| Media URL resolution           | `src/lib/strapi/media.ts`         |
| Markdown → HTML                | `src/lib/markdown.ts`             |
| Webhook receiver               | `src/pages/api/strapi-webhook.ts` |

`src/lib/content.ts` is the single seam. `getPublishedPosts()` is the only thing that changed when posts moved to Strapi — `index.astro`, `rss.xml.ts`, `sitemap.xml.ts`, and every `components/article/*` consume the same shape as before.

## Why it is built this way

Two sibling Astro sites already consume this CMS, and they made opposite choices. This site borrows from each:

|                      | **datum.net**                  | **ab.dk**               | **here**                       |
| -------------------- | ------------------------------ | ----------------------- | ------------------------------ |
| Output               | `static` + Node adapter        | `server` + Vercel       | `server` + Vercel              |
| Transport            | GraphQL                        | REST (`@strapi/client`) | REST                           |
| Cache primary        | Redis + file                   | Vercel Runtime Cache    | Vercel Runtime Cache           |
| Cache fallback       | persistent file                | memory                  | memory                         |
| Body format          | markdown in `shared.rich-text` | Strapi Blocks JSON      | markdown in `shared.rich-text` |
| Webhook hardening    | 503 fail-closed + re-warm      | thin passthrough        | 503 fail-closed + re-warm      |
| Content layer loader | no                             | no                      | no                             |

- **Content shape follows datum.net.** `twins-post` stores its body as markdown inside a `shared.rich-text` block, exactly like datum.net's `article`. Its `unified` + `rehype-expressive-code` pipeline ports directly, which is what keeps code blocks rendering identically to the old MDX build. ab.dk's Blocks renderer would have been the wrong tool.
- **Runtime shape follows ab.dk.** This site deploys to Vercel, so datum.net's Redis + Docker + `server.mjs` stack does not apply.
- **REST over GraphQL.** REST is faster (no schema resolution or boot cost), and the CMS caps GraphQL at `amountLimit: 50` per query with introspection disabled. At 15 posts either works; REST has no ceiling.
- **No Astro content layer loader.** The content layer is a build-time mechanism — using it would reintroduce the rebuild-per-publish that this work removes. Neither sibling site uses one either.

## Traps

**The tag map must be plural.** `@datum-cloud/strapi-revalidate` derives a _singular_ tag from the uid (`api::twins-post.twins-post` → `twins-post`), but cache entries are tagged `twins-posts`. Without the explicit `TAG_MAP` in `revalidate.ts`, the webhook returns `200` while invalidating **nothing**. ab.dk shipped this bug (their commit `707d78d`). The tags in the webhook response are how you verify it.

**The webhook must fail closed.** The library skips signature verification _entirely_ when no secret is configured. `strapi-webhook.ts` returns 503 before delegating, so a missing `STRAPI_WEBHOOK_SECRET` can never silently open the cache-purge endpoint.

**The fetcher must return `null`, never throw.** `cache.getWithFallback` only reads the last-known-good copy when it sees `null`. A thrown error skips the fallback and surfaces as an empty list.

**Strapi paginates at 25 by default.** `fetchCollection` always passes `pageSize: 100`. Silently dropping post 26 is the failure mode.

**`author` and `type` are compile-time locked; topics are not.** Both must match `src/lib/types.ts`, and a post with an unrecognised value is skipped entirely with a warning. They stay locked because each drives something that must exist in code: `author` produces `shadow-zac` / `shadow-jacob` Tailwind classes, and `type` maps to icon names. Tailwind cannot compile a class name built at runtime, so a third author genuinely needs a code change.

Topics have no such coupling — `Chip.astro` styles every chip identically — so they are fully CMS-driven. Adding a topic in Strapi is enough; chips come from `fetchTopics()` and are labelled from the topic's `name`, sorted alphabetically. Any slug is accepted, so a topic matching no posts just renders a chip that filters everything out.

**Vercel Output Directory must be empty.** The adapter emits Build Output API v3 into `.vercel/output`. Setting it to `dist` breaks the deploy.

**Covers need intrinsic dimensions.** Astro's `<Image>` cannot size a remote source without width/height. Strapi records these on upload, and `normalizePost` drops a cover that lacks them rather than rendering a broken image.

## Open task: upload the cover images

The `twins-post` schema has a `cover` media field and the site renders it correctly. The data is simply missing: verified with `populate=*`, all 15 entries have `cover: null` in **both** their published and draft versions, and none of the source images are in the Strapi Cloud media library.

`datum.net-cms/scripts/migrate-twins-post.js` has working `uploadCover()` logic, but it boots Strapi in-process via `createStrapi()` — it was run against a local instance, so the uploads never reached Cloud.

Until the covers are in, every post card renders a solid dark panel and `/og/{slug}.jpg` returns 404, so share cards fall back to `/images/og-news.jpg`. Nothing is broken, and adding a cover in the admin takes effect without a code change or redeploy.

Upload each file in Strapi → **Twins Post** → the matching entry → **cover**. Source files are in `src/assets/covers/`:

| Post slug                                 | Cover file                        |
| ----------------------------------------- | --------------------------------- |
| `ai-and-datacenter-conversations`         | `ai-datacenter-neighbors.png`     |
| `arms-next-chapter`                       | `arms-next-chapter.png`           |
| `ask-me-about-the-weather`                | `ask-me-about-the-weather.png`    |
| `i-invented-bare-metal`                   | `i-invented-bare-metal.png`       |
| `implications-of-geopolitical-decoupling` | `geopolitical-decoupling.png`     |
| `nobody-cares-about-gandalf`              | `nobody-cares-about-gandalf.png`  |
| `simplify-then-add-lightness`             | `simplify-then-add-lightness.png` |

The other eight posts never had a cover — that is intentional, not missing data.

**Do not upload `frame.png`.** It is the OG card border, read from the local filesystem by `src/lib/ogImage.ts`, not from the CMS. `arms-inline.png` and `geopolitical-decoupling-alt.png` are unused leftovers; no post body references an image.

After uploading, republish the entry so the webhook fires, then confirm `/og/{slug}.jpg` returns a framed JPEG instead of 404.

## Deliberate inheritances

Both worth a conscious decision rather than treating as oversights:

- **CMS HTML is not sanitised.** `src/lib/markdown.ts` uses `allowDangerousHtml` + `rehype-raw` with no `rehype-sanitize`, matching datum.net and ab.dk. This is a trust-the-editors posture consistent across Datum sites. Adding `rehype-sanitize` is a one-line change.
- **No draft preview.** datum.net has none either; the CMS also hard-disables preview in `config/admin.js`. ab.dk's `AsyncLocalStorage` + cookie approach is the model if it is ever wanted.

## Verifying a change

```bash
bun run lint && bun run check && bun run test
# must pass with Strapi env unset — no route may reach the CMS at build time
env -u STRAPI_URL -u STRAPI_TOKEN -u STRAPI_WEBHOOK_SECRET bun run build
```

Webhook, in order — the last one is what proves the tag map:

```bash
# wrong secret            -> 401
# malformed body          -> 400
# no secret configured    -> 503
curl -X POST localhost:7788/api/strapi-webhook \
  -H "Authorization: Bearer $STRAPI_WEBHOOK_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"event":"entry.publish","model":"twins-post","uid":"api::twins-post.twins-post","createdAt":"2026-09-16T00:00:00Z","entry":{"id":1,"documentId":"x","slug":"on-device-ai"}}'
# -> {"ok":true,"tags":["twins-posts","twins-post:on-device-ai"]}
```

If the API token is misconfigured, posts vanish while `/about` still works. Look for `[strapi] fetchCollection(twins-posts) failed` in the logs — the token needs read access to **both** `twins-post` and `topic`, neither of which is public in the CMS `bootstrap.js`.
