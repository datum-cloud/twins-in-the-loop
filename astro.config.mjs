import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';

import { expressiveCodeOptions } from './src/lib/expressiveCodeOptions.ts';
import { strapiMediaHostname } from './src/lib/strapi/mediaHost.ts';

export default defineConfig({
  site: process.env.SITE ?? 'https://twinsintheloop.com',
  base: process.env.BASE_PATH || '/',
  output: 'server',
  adapter: vercel({ imageService: true }),
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
