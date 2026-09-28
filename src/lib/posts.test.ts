import { describe, expect, it } from 'vitest';
import {
  filterPosts,
  parseFilters,
  relatedPosts,
  sortByPublishedDesc,
} from './posts';
import type { FilterablePost } from './posts';

const posts: FilterablePost[] = [
  {
    id: 'a',
    author: 'zac',
    topics: ['ai'],
    published: new Date('2026-08-28T00:00:00.000Z'),
  },
  {
    id: 'b',
    author: 'jacob',
    topics: ['hardware'],
    published: new Date('2026-08-10T00:00:00.000Z'),
  },
  {
    id: 'c',
    author: 'zac',
    topics: ['hardware', 'ai'],
    published: new Date('2026-07-08T00:00:00.000Z'),
  },
];

describe('parseFilters', () => {
  it('defaults to all authors and no topic', () => {
    expect(parseFilters('')).toEqual({ topic: undefined, author: 'all' });
  });

  it('reads valid topic and author query params', () => {
    expect(parseFilters('topic=ai&author=zac')).toEqual({
      topic: 'ai',
      author: 'zac',
    });
  });

  it('falls back to "all" for an unknown author', () => {
    expect(parseFilters('author=both')).toEqual({
      topic: undefined,
      author: 'all',
    });
  });

  // Topics are defined in Strapi, so any slug is passed through; one that
  // matches no post simply filters everything out.
  it('passes an arbitrary topic slug through', () => {
    expect(parseFilters('topic=quantum-brunch')).toEqual({
      topic: 'quantum-brunch',
      author: 'all',
    });
  });

  it('treats an empty topic as no filter', () => {
    expect(parseFilters('topic=&author=zac')).toEqual({
      topic: undefined,
      author: 'zac',
    });
  });
});

describe('filterPosts', () => {
  it('filters by author', () => {
    expect(
      filterPosts(posts, { author: 'jacob' }).map((post) => post.id),
    ).toEqual(['b']);
  });

  it('filters by topic', () => {
    expect(
      filterPosts(posts, { author: 'all', topic: 'ai' }).map((post) => post.id),
    ).toEqual(['a', 'c']);
  });
});

describe('sortByPublishedDesc', () => {
  it('orders newest first', () => {
    expect(sortByPublishedDesc(posts).map((post) => post.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('relatedPosts', () => {
  const typed = [
    { id: 'a', type: 'podcast' as const },
    { id: 'b', type: 'post' as const },
    { id: 'c', type: 'podcast' as const },
    { id: 'd', type: 'video' as const },
  ];

  it('leads with the same content type, then fills from the rest', () => {
    expect(
      relatedPosts(typed, { id: 'a', type: 'podcast' }, 3).map(
        (post) => post.id,
      ),
    ).toEqual(['c', 'b', 'd']);
  });

  it('drops the current post and respects the limit', () => {
    expect(
      relatedPosts(typed, { id: 'b', type: 'post' }, 2).map((post) => post.id),
    ).toEqual(['a', 'c']);
  });
});
