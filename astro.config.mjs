import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';

const isProduction = process.env.PUBLIC_SITE_ENV === 'production';

export default defineConfig({
  site: process.env.SITE ?? 'https://twinsintheloop.com',
  base: process.env.BASE_PATH || '/',
  integrations: [
    expressiveCode({
      plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
      themes: ['github-dark', 'github-light'],
      styleOverrides: {
        borderRadius: '0',
      },
    }),
    mdx(),
    ...(isProduction ? [sitemap()] : []),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
