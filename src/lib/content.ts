import { getCollection, getEntry } from 'astro:content';
import { fetchPosts } from './strapi/posts';
import { fetchTopics } from './strapi/topics';
import { AUTHOR_IDS, type AuthorId } from './types';

export async function getSiteSettings() {
  const entry = await getEntry('site', 'settings');
  if (!entry) {
    throw new Error('Missing src/content/site/settings.mdx');
  }

  return entry.data;
}

/**
 * Posts come from Strapi. `src/content/posts/` is kept as reference material
 * and is deliberately no longer read by any route.
 */
export async function getPublishedPosts() {
  return fetchPosts();
}

/** Topic filter chips. Defined in Strapi; adding one needs no code change. */
export async function getTopics() {
  return fetchTopics();
}

export async function getAuthors() {
  const authors = await getCollection('authors');
  const order = new Map(AUTHOR_IDS.map((id, index) => [id, index]));

  return [...authors].sort(
    (a, b) =>
      (order.get(a.id as AuthorId) ?? 99) - (order.get(b.id as AuthorId) ?? 99),
  );
}
