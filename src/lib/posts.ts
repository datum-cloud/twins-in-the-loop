import type { AuthorFilter, AuthorId, TopicId } from './types';
import { isAuthorFilter, isTopicId } from './types';

export interface FilterablePost {
  id: string;
  author: AuthorId;
  topics: TopicId[];
  featured: boolean;
  published: Date;
}

export interface PostFilters {
  topic?: TopicId;
  author: AuthorFilter;
}

export function parseFilters(search: string | URLSearchParams): PostFilters {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const topicRaw = params.get('topic') ?? '';
  const authorRaw = params.get('author') ?? 'all';

  return {
    topic: isTopicId(topicRaw) ? topicRaw : undefined,
    author: isAuthorFilter(authorRaw) ? authorRaw : 'all',
  };
}

export function matchesFilters(post: FilterablePost, filters: PostFilters): boolean {
  if (filters.author !== 'all' && post.author !== filters.author) {
    return false;
  }

  if (filters.topic && !post.topics.includes(filters.topic)) {
    return false;
  }

  return true;
}

export function filterPosts<T extends FilterablePost>(posts: T[], filters: PostFilters): T[] {
  return posts.filter((post) => matchesFilters(post, filters));
}

export function sortByPublishedDesc<T extends { published: Date }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.published.getTime() - a.published.getTime());
}

export function splitFeatured<T extends FilterablePost>(posts: T[]): {
  featured: T[];
  rest: T[];
} {
  return {
    featured: posts.filter((post) => post.featured),
    rest: posts.filter((post) => !post.featured),
  };
}

export function partitionByAuthor<T extends FilterablePost>(posts: T[]): {
  zac: T[];
  jacob: T[];
} {
  return {
    zac: posts.filter((post) => post.author === 'zac'),
    jacob: posts.filter((post) => post.author === 'jacob'),
  };
}
