# SEO and sharing

How titles, descriptions, and images show up in search, Slack, LinkedIn, X, and the in-page share buttons.

The resolver lives in `src/lib/seo.ts`. Pages pass MDX fields through `BaseLayout` → `Seo.astro`.

## What visitors and crawlers see

| Surface                           | Source                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Browser tab                       | `title`, then ` · Twins in the Loop` unless the title already is the site name                  |
| Google snippet                    | `<title>`, `description`, `canonical`, `robots`                                                 |
| Slack / LinkedIn / iMessage       | Open Graph: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`                       |
| X / Twitter cards                 | `twitter:title`, `twitter:description`, `twitter:image` (`summary_large_image`)                 |
| RSS (`/rss.xml`)                  | Channel from site settings; items from post `title`, `description`, `published`                 |
| Sitemap                           | Built at `/sitemap-index.xml` in production. Omitted when `PUBLIC_SITE_ENV` is not `production` |
| robots.txt                        | Production: allows `/` and points at the sitemap. Other envs: `Disallow: /`                     |
| Copy article link / Share article | Copies or shares the canonical article URL. Web Share uses the post `title`                     |

## Shared frontmatter (every collection)

These fields exist on posts, pages, authors, and site settings:

| Field         | Type         | Default          | Effect                                                                          |
| ------------- | ------------ | ---------------- | ------------------------------------------------------------------------------- |
| `title`       | string       | required         | Document title (`<title>`). Also used for `og:title` unless `og.title` is set   |
| `description` | string       | required         | Meta description. Also used for `og:description` unless `og.description` is set |
| `canonical`   | absolute URL | current page URL | `<link rel="canonical">` and `og:url`                                           |
| `og`          | object       | omitted          | Nested Open Graph: `title`, `description`, `image`, `type`                      |
| `noindex`     | boolean      | `false`          | `true` → `noindex, nofollow`                                                    |
| `keywords`    | string array | omitted          | `<meta name="keywords">`                                                        |

Example:

```yaml
title: "Arm's Next Chapter: What Custom Silicon Means for Cloud-Native Apps"
description: 'Custom silicon is reshaping how cloud-native apps are built, deployed, and priced.'
canonical: https://twinsintheloop.com/arms-next-chapter
og:
  title: Custom silicon is reshaping cloud-native apps
  description: What Arm's next chapter means for how cloud-native apps are built, deployed, and priced.
  image: ../../assets/covers/arms-next-chapter.png
  type: article
noindex: false
keywords:
  - arm
  - custom silicon
  - cloud-native
```

## Title

- Set `title` in the relevant MDX file.
- Homepage uses `src/content/site/settings.mdx` `title` as-is (`Twins in the Loop`).
- Other pages become `{title} · Twins in the Loop`.
- Changing the site suffix means changing `title` in settings (the homepage title will match, so it will not double-suffix).

Keep titles unique and roughly under 60 characters when you can; longer titles still work. Quotes in YAML need wrapping: `title: "The AI and datacenter conversations I'm having with my neighbors."`.

## Description

- Homepage: `description` in `settings.mdx`.
- About: `description` in `pages/about.mdx`.
- Articles: `description` in the post. This is **not** the same as `excerpt` or `tldr`.
  - `description` → search + RSS; also social snippet unless `og.description` is set
  - `excerpt` → homepage cards and TL;DR fallback
  - `tldr` → article sidebar only
  - Example: [ai-and-datacenter-conversations.mdx](../src/content/posts/ai-and-datacenter-conversations.mdx) uses a short `description` for snippets and a longer `excerpt` for the card. It has no `tldr`, so the sidebar uses `excerpt`.

Aim for one or two sentences (about 150–160 characters).

## Share / Open Graph

Nested `og` in frontmatter maps to `og:*` and `twitter:*` tags:

```yaml
og:
  title: We’re on a mission to help the next 1k clouds thrive
  description: We are infrastructure, open source software, and design nerds who love building for the future.
  image: ../images/og/about.png
  type: website
```

| Field            | Tag                                     | Fallback                                                                                                   |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `og.title`       | `og:title`, `twitter:title`             | Page `title` plus ` · Twins in the Loop`                                                                   |
| `og.description` | `og:description`, `twitter:description` | Page `description`                                                                                         |
| `og.image`       | `og:image`, `twitter:image`             | Articles: framed cover at `/og/{slug}.jpg`, then `/images/og-news.jpg`. Other pages: site `defaultOgImage` |
| `og.type`        | `og:type`                               | `website` (posts default to `article`)                                                                     |

`og.title` is used as-is (no site suffix). Omit any `og` field to use its fallback.

Image paths:

| Kind             | Example                                                  | Where the file lives               |
| ---------------- | -------------------------------------------------------- | ---------------------------------- |
| Content image    | `image: ../../assets/covers/ai-datacenter-neighbors.png` | `src/assets/` (Astro processes it) |
| Public file      | `image: /images/og-default.jpg`                          | `public/images/og-default.jpg`     |
| Public subfolder | `image: /share/my-post.png`                              | `public/share/my-post.png`         |
| Absolute         | `image: https://cdn.example.com/card.png`                | Remote URL                         |

Recommended card size: 1200×675 JPEG (16:9), matching the generated article cards.

Defaults:

| Surface            | File                                                        | Wired from                                            |
| ------------------ | ----------------------------------------------------------- | ----------------------------------------------------- |
| Homepage and About | `public/images/og-default.jpg`                              | `og.image` and `defaultOgImage` in settings/MDX       |
| Article pages      | `/og/{slug}.jpg` from cover + `src/assets/covers/frame.png` | Last fallback after `og.image`: `/images/og-news.jpg` |

To change the **homepage / site-wide fallback**, replace `public/images/og-default.jpg` or set:

```yaml
# src/content/site/settings.mdx
defaultOgImage: /images/og-default.jpg
```

To give **one article** a share image that is not the framed cover:

```yaml
cover: ../../assets/covers/ai-datacenter-neighbors.png
og:
  image: /share/ai-datacenter-neighbors-og.png
```

Articles with a `cover` and no `og.image` generate a 1200×675 JPEG at `/og/{slug}.jpg`: the cover is cropped to fill the card, then `src/assets/covers/frame.png` is laid on top (brand bar + wordmark). Posts without a cover still use `/images/og-news.jpg`.

`embedUrl` is not an SEO field. It does not become `og:video` or a Twitter player card.

Homepage and About have no cover, so they use `og.image` or `defaultOgImage` (`/images/og-default.jpg`). Article share images use `og.image`, then the framed cover, then `/images/og-news.jpg`.

Crawlers cache social cards. After changing an image, use LinkedIn Post Inspector, Facebook Sharing Debugger, or X Card Validator to refresh.

## Canonical URL

Omit `canonical` unless you need to point elsewhere (syndication, trailing-slash policy, domain move).

When omitted, the site builds `https://twinsintheloop.com{path}` from `site` in `astro.config.mjs`.

```yaml
canonical: https://twinsintheloop.com/ai-and-datacenter-conversations
```

Must be an absolute URL (`https://…`). A relative path will fail the schema.

## Hide a page from search

```yaml
noindex: true
```

That sets `robots` to `noindex, nofollow`. Draft posts (`draft: true`) are already omitted from the production build, sitemap, and RSS, so they do not need `noindex`.

Indexing is allowed only when `PUBLIC_SITE_ENV=production`. Staging GitHub Pages and any other env force site-wide `noindex, nofollow` and a disallowing `robots.txt`, even if MDX sets `noindex: false`. See [GitHub Pages staging](./github-pages.md).

## Keywords

Optional. Many crawlers ignore this tag. If you set it:

```yaml
keywords:
  - infrastructure
  - ai
```

## Per-route map

### Homepage `/`

From `src/content/site/settings.mdx`:

- `title`, `description`, `canonical`, `og`, `noindex`, `keywords`
- Share image fallback: `og.image` or `defaultOgImage` (`/images/og-default.jpg`)
- JSON-LD `Blog` uses site `title` and `description`

### About `/about`

From `src/content/pages/about.mdx`:

- `title`, `description`, `heading` (on-page only, not the social title)
- Same SEO fields as above
- Share image: page `og.image` or `defaultOgImage` (`/images/og-default.jpg`)

### Article `/{slug}`

From `src/content/posts/{slug}.mdx`:

- `title` → tab and share-sheet title; `og.title` → `og:title` / `twitter:title` when set
- `description` → meta and RSS; `og.description` → social description when set
- Share image: `og.image`, then framed cover `/og/{slug}.jpg`, then `/images/og-news.jpg`
- `og.type` on posts defaults to `article` even if `og` is omitted
- JSON-LD `BlogPosting` uses `title`, `published`, author `name`, and cover
- `embedUrl` is unused for meta tags

### RSS `/rss.xml`

Not configured per post beyond `title`, `description`, and `published`. Changing site `title` / `description` updates the feed channel.

## Site origin

Absolute URLs for canonical, sitemap, RSS, and OG images use:

```js
// astro.config.mjs
site: process.env.SITE ?? 'https://twinsintheloop.com';
```

Override `SITE` and `BASE_PATH` for GitHub Pages staging. Production hosts must set `PUBLIC_SITE_ENV=production`. `defaultOgImage: /images/og-default.jpg` becomes `https://twinsintheloop.com/images/og-default.jpg` when `SITE` is the production origin.

## Favicon

Replace:

- `public/favicon.ico` (tabs and legacy browsers)
- `public/favicon-32x32.png` (modern browsers)
- `public/apple-touch-icon.png` (Safari / iOS)

Source pack lives in `src/assets/favicons/`. Only those three public files are wired in `<head>`.

## Verify after an SEO change

1. `bun run dev` and View Source on the page.
2. Confirm `<title>`, `meta name="description"`, `og:image`, `link rel="canonical"`.
3. Open `/rss.xml` if you changed post titles or descriptions.
4. `bun run build` and check `dist/` for the same tags.
5. After deploy, paste the live URL into a social debugger.
