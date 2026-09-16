import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/strapi/posts';
import { setCdnCacheHeaders } from '../lib/httpCache';
import { isSiteIndexable, withBase } from '../lib/siteEnv';

/**
 * Replaces `@astrojs/sitemap`, which only enumerates prerendered routes —
 * post pages are server-rendered, so it would silently emit none of them.
 */
export async function GET(context: APIContext) {
  const siteUrl = context.site?.toString() ?? 'https://twinsintheloop.com';

  if (!isSiteIndexable()) {
    return new Response('Not found', { status: 404 });
  }

  const posts = await getPublishedPosts();
  const entries = [
    { path: '/', lastmod: undefined as string | undefined },
    { path: '/about', lastmod: undefined },
    ...posts.map((post) => ({
      path: `/${post.id}`,
      lastmod: (post.data.updated ?? post.data.published).toISOString(),
    })),
  ];

  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = new URL(withBase(path), siteUrl).toString();
      const modified = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${modified}</url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  const headers = new Headers({ 'Content-Type': 'application/xml' });
  setCdnCacheHeaders(headers);

  return new Response(xml, { headers });
}
