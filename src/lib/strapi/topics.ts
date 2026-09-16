import { fetchCollection } from './client';
import { POSTS_TAG, TOPICS_LIST_KEY } from './revalidate';

interface StrapiTopicRecord {
  slug: string;
  name: string;
}

export interface Topic {
  slug: string;
  name: string;
}

/** Sorted alphabetically by label; Strapi has no ordering field. */
export async function fetchTopics(): Promise<Topic[]> {
  const records = await fetchCollection<StrapiTopicRecord>(
    'topics',
    { sort: ['name:asc'], fields: ['slug', 'name'] },
    { key: TOPICS_LIST_KEY, tags: [POSTS_TAG] },
  );

  return records
    .filter((topic) => topic.slug && topic.name)
    .map(({ slug, name }) => ({ slug, name }));
}

export async function getTopics(): Promise<Topic[]> {
  return fetchTopics();
}
