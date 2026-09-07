import { getCollection, getEntry } from 'astro:content';
import { AUTHOR_IDS, type AuthorId } from './types';

export async function getSiteSettings() {
  const entry = await getEntry('site', 'settings');
  if (!entry) {
    throw new Error('Missing src/content/site/settings.mdx');
  }

  return entry.data;
}

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );

  return [...posts].sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime(),
  );
}

export async function getAuthors() {
  const authors = await getCollection('authors');
  const order = new Map(AUTHOR_IDS.map((id, index) => [id, index]));

  return [...authors].sort(
    (a, b) => (order.get(a.id as AuthorId) ?? 99) - (order.get(b.id as AuthorId) ?? 99),
  );
}
