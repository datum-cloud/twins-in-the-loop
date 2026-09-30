import type { APIContext } from 'astro';
import { getSiteSettings } from '../lib/content';
import { setCdnCacheHeaders } from '../lib/httpCache';
import { llmsTxt } from '../lib/llmsTxt';
import { isSiteIndexable, withBase } from '../lib/siteEnv';
import { getPublishedPosts } from '../lib/strapi/posts';

export async function GET(context: APIContext) {
  if (!isSiteIndexable()) {
    return new Response('Not found', { status: 404 });
  }

  const siteUrl = context.site?.toString() ?? 'https://twinsintheloop.com';
  const [site, posts] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts(),
  ]);

  const body = llmsTxt({
    title: site.title,
    description: site.description,
    siteUrl,
    posts: posts
      .filter((post) => !post.data.noindex)
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        url: new URL(withBase(`/${post.id}`), siteUrl).toString(),
      })),
  });

  const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
  setCdnCacheHeaders(headers);

  return new Response(body, { headers });
}
