# Documentation

Guides for editing Twins in the Loop without changing layout code.

| Guide                                     | Use it when you want to                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| [Edit content](./content.md)              | Add or update posts, About copy, authors, footer, and nav links             |
| [SEO and sharing](./seo-and-sharing.md)   | Change titles, descriptions, share images, canonical URLs, and indexability |
| [GitHub Pages staging](./github-pages.md) | Enable Actions-based Pages, publish staging, and keep it out of search      |
| [Deploy on Vercel](./vercel.md)           | Connect the GitHub repo, set build env vars, and ship production            |

Copy lives in MDX collections under `src/content/`. Do not hardcode page copy in `.astro` files.

After edits, preview locally:

```bash
bun run dev
```

Then confirm with:

```bash
bun run check
bun run build
```
