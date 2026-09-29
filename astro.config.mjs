import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';

import { expressiveCodeOptions } from './src/lib/expressiveCodeOptions.ts';
import { strapiMediaHostname } from './src/lib/strapi/mediaHost.ts';

// ADAPTER=node builds a standalone Node server for the Datum Compute container
// image (see Dockerfile). Everything else (local dev, Vercel CI) keeps the
// default Vercel adapter.
const adapter =
  process.env.ADAPTER === 'node'
    ? node({ mode: 'standalone' })
    : vercel({ imageService: true });

export default defineConfig({
  site: process.env.SITE ?? 'https://twinsintheloop.com',
  base: process.env.BASE_PATH || '/',
  output: 'server',
  adapter,
  server: {
    port: 7788,
  },
  image: {
    domains: [strapiMediaHostname()],
  },
  // The same options drive `renderPostBody()` via `rehype-expressive-code`, so
  // Strapi bodies and MDX pages render code blocks identically.
  integrations: [expressiveCode(expressiveCodeOptions), mdx()],
  vite: {
    plugins: [tailwindcss()],
    // The revalidate package pins zod@^3; bundling it avoids a dual-instance
    // mismatch if this project ever adds zod at a different major.
    ssr: { noExternal: ['zod'] },
  },
});
