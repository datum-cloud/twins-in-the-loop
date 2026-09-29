# Documentation

Guides for editing Twins in the Loop without changing layout code.

| Guide                                                     | Use it when you want to                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Edit content](./content.md)                              | Add or update posts, About copy, authors, footer, and nav links                  |
| [SEO and sharing](./seo-and-sharing.md)                   | Change titles, descriptions, share images, canonical URLs, and indexability      |
| [Strapi integration](./strapi.md)                         | Understand or change how posts are fetched, cached, and invalidated              |
| [Deploy on Vercel](./vercel.md)                           | Connect the GitHub repo, set env vars, and ship production                       |
| [Deploy on Datum Compute](./datum-compute.md)             | Run the container build on Datum Cloud alongside Vercel                          |
| [Datum Compute report](./datum-compute-report.md)         | See the known platform problems (Secrets, egress, stuck rollouts) and next steps |
| [Datum Compute Secret bug](./datum-compute-secret-bug.md) | Reproduce the `envFrom` Secret `ConfigurationError` for the Compute team         |

**Blog posts live in Strapi**, not in this repo. Other copy lives in MDX collections under `src/content/`. Do not hardcode page copy in `.astro` files.

After edits, preview locally:

```bash
bun run dev
```

Then confirm with:

```bash
bun run check
bun run build
```
