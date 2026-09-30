import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSiteSettings } from '../lib/content';
import { getPublishedPosts } from '../lib/strapi/posts';
import { withBase } from '../lib/siteEnv';

export async function GET(context: APIContext) {
  const site = await getSiteSettings();
  const posts = await getPublishedPosts();

  const siteUrl = context.site ?? 'https://www.twins-in-the-loop.com';

  return rss({
    title: site.title,
    description: site.description,
    site: siteUrl,
    customData: '<language>en-us</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      // Absolute links skip the package's trailing-slash rewrite, so items
      // match the canonical URL.
      link: new URL(withBase(`/${post.id}`), siteUrl).toString(),
      categories: post.data.topics,
    })),
  });
}
