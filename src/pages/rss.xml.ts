import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts, getSiteSettings } from '../lib/content';

export async function GET(context: APIContext) {
  const site = await getSiteSettings();
  const posts = await getPublishedPosts();

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? 'https://twinsintheloop.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: `/${post.id}`,
    })),
  });
}
