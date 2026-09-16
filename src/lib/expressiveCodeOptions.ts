import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import type { RehypeExpressiveCodeOptions } from 'rehype-expressive-code';

/**
 * Shared by the `astro-expressive-code` integration (MDX pages) and
 * `renderPostBody()` (Strapi bodies), so both render code blocks identically.
 */
export const expressiveCodeOptions: RehypeExpressiveCodeOptions = {
  plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
  themes: ['github-dark', 'github-light'],
  styleOverrides: {
    borderRadius: '0',
  },
};
