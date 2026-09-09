# Edit content

The site is an MDX CMS. Change copy in `src/content/`, not in Astro pages.

| Collection | Folder                          | What it drives                                     |
| ---------- | ------------------------------- | -------------------------------------------------- |
| Posts      | `src/content/posts/*.mdx`       | Article pages at `/{filename}`                     |
| Pages      | `src/content/pages/*.mdx`       | Static pages. `about.mdx` is `/about`              |
| Authors    | `src/content/authors/*.mdx`     | About cards and article bylines                    |
| Site       | `src/content/site/settings.mdx` | Homepage SEO, footer, socials, default share image |

Allowed field values are enforced in `src/content.config.ts`. Invalid frontmatter fails `bun run check` and `bun run build`.

## Add a blog post

1. Put a cover image in `src/assets/covers/` if the post should have a card/hero image. PNG or JPEG. Aim for a landscape crop similar to existing covers.
2. Create `src/content/posts/my-post-slug.mdx`.
3. The **filename without `.mdx` is the URL**. `my-post-slug.mdx` becomes `https://twinsintheloop.com/my-post-slug`.
4. Fill frontmatter, then write the body in Markdown (MDX).

```yaml
---
title: "Arm's Next Chapter: What Custom Silicon Means for Cloud-Native Apps"
description: 'Custom silicon is reshaping how cloud-native apps are built, deployed, and priced.'
excerpt: "Custom silicon is no longer a hyperscaler hobby. Here is what Arm's next chapter means for the rest of us."
published: 2026-08-28
updated: 2026-09-01
author: jacob
type: post
topics:
  - hardware
featured: false
draft: false
cover: ../../assets/covers/arms-next-chapter.png
tldr: 'Custom silicon is moving from a hyperscaler advantage to a default assumption for cloud-native teams.'
---
```

Body copy goes under that frontmatter. Headings, lists, images, and fenced code blocks all work.

`about` is reserved. Do not name a post `about.mdx`.

Written posts can omit `embedUrl` and `og`. Video and podcast entries should set `type`, `embedUrl`, and usually `og` so the share card matches the cover. Use `tldr` only when the sidebar needs different copy than `excerpt`.

### Post fields

| Field         | Required                                    | Effect                                                                                                                                   |
| ------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | Yes                                         | Article H1, browser title, RSS title, Web Share title. Also `og:title` unless `og.title` is set                                          |
| `description` | Yes                                         | Meta description, RSS description, and social description unless `og.description` is set                                                 |
| `excerpt`     | Yes                                         | Homepage card/list teaser. Also fills the TL;DR box if `tldr` is omitted                                                                 |
| `published`   | Yes                                         | Sort order, card date, article date, RSS `pubDate`. Use `YYYY-MM-DD`                                                                     |
| `updated`     | No                                          | Optional last-updated date (`YYYY-MM-DD`)                                                                                                |
| `author`      | Yes                                         | `zac` or `jacob`. Colors, tags, About lookup, author filter                                                                              |
| `type`        | Yes                                         | `post`, `musing`, `video`, or `podcast`. Sets the icon on cards                                                                          |
| `topics`      | Yes                                         | One or more of `ai`, `data-centers`, `infrastructure`, `hardware`. Powers homepage topic chips                                           |
| `featured`    | No                                          | Default `false`. `true` puts the post in the homepage card grid instead of the list                                                      |
| `draft`       | No                                          | Default `false`. `true` hides the post from production builds. Drafts still show in `bun run dev`                                        |
| `cover`       | No                                          | Homepage card image and article image. Share cards use `og.image` or `/images/og-news.jpg`                                               |
| `tldr`        | No                                          | Sidebar TL;DR on the article page. Falls back to `excerpt`                                                                               |
| `embedUrl`    | No                                          | Optional video/podcast URL (`https://…`). Required in practice for `type: video` or `podcast`; stored only, not rendered as an embed yet |
| SEO fields    | See [SEO and sharing](./seo-and-sharing.md) | Nested `og` (`title`, `description`, `image`, `type`), plus `canonical`, `noindex`, `keywords`                                           |

### Content type icons

| `type`    | Icon     |
| --------- | -------- |
| `post`    | Notepad  |
| `musing`  | Quote    |
| `video`   | Play     |
| `podcast` | Waveform |

### Homepage placement

- `featured: true` → large image card.
- `featured: false` → text row under Zac or Jacob, based on `author`.
- Topic chips filter by `topics`. Author dropdown filters by `author`. Query params: `?topic=ai`, `?author=zac`.

### Edit or unpublish a post

- Edit the `.mdx` file and save. Dev server hot-reloads.
- To change the URL, rename the file. Old URLs 404 unless you add a redirect later.
- To unpublish in production, set `draft: true`. To remove it, delete the file.

## Edit the About page

File: `src/content/pages/about.mdx`.

| Field         | Required | Effect                                                              |
| ------------- | -------- | ------------------------------------------------------------------- |
| `title`       | Yes      | Browser tab and share title (`About this blog · Twins in the Loop`) |
| `description` | Yes      | Meta and share description                                          |
| `heading`     | Yes      | Large title in the dark hero                                        |
| Body          | Yes      | Intro paragraphs under the hero                                     |

Author cards come from `src/content/authors/`, not from this file. SEO extras are in [SEO and sharing](./seo-and-sharing.md).

## Edit authors

Files: `src/content/authors/zac.mdx` and `src/content/authors/jacob.mdx`.

The filename (`zac`, `jacob`) must match `author` on posts.

```yaml
---
title: Zac Smith
description: Co-founder of Datum. Infrastructure obsessive and one half of Twins in the Loop.
name: Zac Smith
role: Co-founder of Datum. Infrastructure obsessive and one half of Twins in the Loop.
photo: ../../assets/authors/zac.png
linkedin: https://www.linkedin.com/in/zacsmith
email: zac@datum.net
---
```

| Field                   | Effect                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| `name`                  | About card heading, article byline                                   |
| `role`                  | About card subtitle, article byline                                  |
| `photo`                 | About card and article avatar. Store files in `src/assets/authors/`  |
| `linkedin`              | About “LinkedIn” button                                              |
| `email`                 | About “Email” button (`mailto:`)                                     |
| `title` / `description` | Author SEO fields (reserved; authors are not standalone pages today) |

Zac is green, Jacob is purple. Those colors are coded to the ids `zac` and `jacob`. Adding a third author needs a code change in `src/lib/types.ts` and the UI — do not invent a new id in MDX alone.

## Edit site-wide chrome

File: `src/content/site/settings.mdx`.

| Field            | Effect                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `title`          | Site name. Homepage document title. Suffix on other pages (`Page · Twins in the Loop`)                            |
| `description`    | Homepage meta/share description. RSS channel description                                                          |
| `tagline`        | Stored for the site; the hero wordmark is the logo component                                                      |
| `footerBlurb`    | Footer paragraph (the layout appends “Learn more”)                                                                |
| `subscribeUrl`   | Footer “Subscribe on LinkedIn”                                                                                    |
| `datumUrl`       | Header and footer Datum.net links                                                                                 |
| `copyright`      | Footer `© {year} {copyright}`                                                                                     |
| `defaultOgImage` | Fallback share image for non-article pages without `og.image`. Path from `public/`, e.g. `/images/og-default.jpg` |
| `socials`        | Footer icons. `name` must be `github`, `discord`, `youtube`, `linkedin`, or `x`                                   |

```yaml
socials:
  - name: github
    href: https://github.com/datum-cloud
```

Replace `public/images/og-default.jpg` to change the homepage and About social card. Replace `public/images/og-news.jpg` to change the default article social card.

## Images and icons

| Asset             | Location                                                                        | How to change                                                                         |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Post covers       | `src/assets/covers/`                                                            | Add the file, then set `cover:` in the post                                           |
| Author photos     | `src/assets/authors/`                                                           | Replace the file or point `photo:` at a new one                                       |
| Homepage OG image | `public/images/og-default.jpg`                                                  | Replace the file, or point `defaultOgImage` / `og.image` at another file in `public/` |
| Article OG image  | `public/images/og-news.jpg`                                                     | Replace the file, or set `og.image` on a post                                         |
| Favicon           | `public/favicon.ico`, `public/favicon-32x32.png`, `public/apple-touch-icon.png` | Replace those files. Source pack is `src/assets/favicons/`                            |
| UI icons          | `public/icons/`                                                                 | Used by the `Icon` component. Do not inline new SVGs in pages                         |

Cover paths in posts are relative to the MDX file:

```yaml
cover: ../../assets/covers/my-cover.png
```

Share-image paths (`og.image`, `defaultOgImage`) can be a content image or a public URL:

```yaml
og:
  image: ../../assets/covers/my-cover.png
# or
og:
  image: /images/og-default.jpg
defaultOgImage: /images/og-default.jpg
```

## What you cannot change from MDX alone

These need a developer change (schema + UI):

- New authors besides `zac` / `jacob`
- New topics besides `ai`, `data-centers`, `infrastructure`, `hardware`
- New content types besides `post`, `musing`, `video`, `podcast`
- Header nav labels and the Blog / About / Stay in the loop structure
- Logo artwork (`src/assets/logo/`)
- Site origin (`site` in `astro.config.mjs`, currently `https://twinsintheloop.com`)

## Preview checklist

1. `bun run dev` and open the URL.
2. Homepage: card vs list, topic chip, author filter.
3. Article: hero, TL;DR, body, related list, share buttons.
4. About: heading, intro, both author cards.
5. `bun run check` and `bun run build` before you commit.
