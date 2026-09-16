import rehypeExpressiveCode from 'rehype-expressive-code';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { expressiveCodeOptions } from './expressiveCodeOptions';
import { resolveMarkdownMediaUrls } from './strapi/media';

/**
 * Render a Strapi post body. `render()` from `astro:content` only works on
 * content-layer entries, so CMS bodies need their own pipeline — this mirrors
 * the MDX one in `astro.config.mjs` so code blocks look identical.
 *
 * Raw HTML in a body is passed through unsanitised, matching the other Datum
 * sites. Editors are trusted; add `rehype-sanitize` here if that ever changes.
 */
export async function renderPostBody(markdown: string): Promise<string> {
  if (!markdown.trim()) return '';

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeExpressiveCode, expressiveCodeOptions)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(resolveMarkdownMediaUrls(markdown));

  return String(file);
}
