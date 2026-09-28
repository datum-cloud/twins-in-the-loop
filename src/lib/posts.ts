import type { AuthorFilter, AuthorId, ContentType, TopicId } from './types';
import { isAuthorFilter } from './types';

export interface FilterablePost {
  id: string;
  author: AuthorId;
  topics: TopicId[];
  published: Date;
}

export interface PostFilters {
  topic?: TopicId;
  author: AuthorFilter;
}

export function parseFilters(search: string | URLSearchParams): PostFilters {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  const topicRaw = params.get('topic') ?? '';
  const authorRaw = params.get('author') ?? 'all';

  return {
    topic: topicRaw || undefined,
    author: isAuthorFilter(authorRaw) ? authorRaw : 'all',
  };
}

export function matchesFilters(
  post: FilterablePost,
  filters: PostFilters,
): boolean {
  if (filters.author !== 'all' && post.author !== filters.author) {
    return false;
  }

  if (filters.topic && !post.topics.includes(filters.topic)) {
    return false;
  }

  return true;
}

export function filterPosts<T extends FilterablePost>(
  posts: T[],
  filters: PostFilters,
): T[] {
  return posts.filter((post) => matchesFilters(post, filters));
}

export function sortByPublishedDesc<T extends { published: Date }>(
  posts: T[],
): T[] {
  return [...posts].sort(
    (a, b) => b.published.getTime() - a.published.getTime(),
  );
}

/**
 * Follow-on reading for an article page: same content type first, then the
 * rest, so a podcast page leads with other episodes but never runs short.
 */
export function relatedPosts<T extends { id: string; type: ContentType }>(
  posts: T[],
  current: { id: string; type: ContentType },
  limit: number,
): T[] {
  const others = posts.filter((post) => post.id !== current.id);
  const sameType = others.filter((post) => post.type === current.type);
  const rest = others.filter((post) => post.type !== current.type);
  return [...sameType, ...rest].slice(0, limit);
}
