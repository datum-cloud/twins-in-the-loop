import { describe, expect, it } from 'vitest';
import {
  filterPosts,
  parseFilters,
  partitionByAuthor,
  sortByPublishedDesc,
  splitFeatured,
} from './posts';
import type { FilterablePost } from './posts';

const posts: FilterablePost[] = [
  {
    id: 'a',
    author: 'zac',
    topics: ['ai'],
    featured: true,
    published: new Date('2026-08-28T00:00:00.000Z'),
  },
  {
    id: 'b',
    author: 'jacob',
    topics: ['hardware'],
    featured: false,
    published: new Date('2026-08-10T00:00:00.000Z'),
  },
  {
    id: 'c',
    author: 'zac',
    topics: ['hardware', 'ai'],
    featured: false,
    published: new Date('2026-07-08T00:00:00.000Z'),
  },
];

describe('parseFilters', () => {
  it('defaults to all authors and no topic', () => {
    expect(parseFilters('')).toEqual({ topic: undefined, author: 'all' });
  });

  it('reads valid topic and author query params', () => {
    expect(parseFilters('topic=ai&author=zac')).toEqual({ topic: 'ai', author: 'zac' });
  });

  it('ignores unknown values', () => {
    expect(parseFilters('topic=space&author=both')).toEqual({ topic: undefined, author: 'all' });
  });
});

describe('filterPosts', () => {
  it('filters by author', () => {
    expect(filterPosts(posts, { author: 'jacob' }).map((post) => post.id)).toEqual(['b']);
  });

  it('filters by topic', () => {
    expect(filterPosts(posts, { author: 'all', topic: 'ai' }).map((post) => post.id)).toEqual([
      'a',
      'c',
    ]);
  });
});

describe('sortByPublishedDesc', () => {
  it('orders newest first', () => {
    expect(sortByPublishedDesc(posts).map((post) => post.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('splitFeatured and partitionByAuthor', () => {
  it('splits featured cards from list rows', () => {
    const { featured, rest } = splitFeatured(posts);
    expect(featured.map((post) => post.id)).toEqual(['a']);
    expect(rest.map((post) => post.id)).toEqual(['b', 'c']);
  });

  it('partitions authors', () => {
    const { zac, jacob } = partitionByAuthor(posts);
    expect(zac.map((post) => post.id)).toEqual(['a', 'c']);
    expect(jacob.map((post) => post.id)).toEqual(['b']);
  });
});
