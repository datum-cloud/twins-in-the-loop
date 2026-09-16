import { describe, expect, it, vi } from 'vitest';

vi.mock('./revalidate', () => ({
  strapiUrl: 'https://cms.example.com',
  strapiToken: undefined,
  POSTS_LIST_KEY: 'twins-posts-list',
  POSTS_TAG: 'twins-posts',
  postKey: (slug: string) => `twins-post-${slug}`,
  postTag: (slug: string) => `twins-post:${slug}`,
}));

const { normalizePost } = await import('./posts');

const base = {
  documentId: 'abc',
  title: 'A post',
  slug: 'a-post',
  description: 'desc',
  excerpt: 'excerpt',
  author: 'zac',
  type: 'post',
  published: '2026-08-25',
};

describe('normalizePost', () => {
  it('maps the slug to id and joins rich-text blocks in order', () => {
    const post = normalizePost({
      ...base,
      blocks: [
        { __component: 'shared.rich-text', body: 'first' },
        { __component: 'shared.quote', body: 'ignored' },
        { __component: 'shared.rich-text', body: 'second' },
      ],
    });

    expect(post?.id).toBe('a-post');
    expect(post?.body).toBe('first\n\nsecond');
  });

  // Topics are defined in Strapi and nothing renders per-topic styling, so a
  // new topic must reach the site without a code change.
  it('keeps any topic slug the CMS supplies', () => {
    const post = normalizePost({
      ...base,
      topics: [
        { slug: 'ai' },
        { slug: 'quantum-brunch' },
        { slug: 'hardware' },
      ],
    });

    expect(post?.data.topics).toEqual(['ai', 'quantum-brunch', 'hardware']);
  });

  it('skips a post whose author or type is outside the site enums', () => {
    expect(normalizePost({ ...base, author: 'someone-else' })).toBeNull();
    expect(normalizePost({ ...base, type: 'newsletter' })).toBeNull();
  });

  it('builds a cover only when Strapi supplies intrinsic dimensions', () => {
    expect(
      normalizePost({
        ...base,
        cover: { url: '/uploads/a.png', width: 100, height: 50 },
      })?.data.cover,
    ).toEqual({
      src: 'https://cms.example.com/uploads/a.png',
      width: 100,
      height: 50,
      alt: '',
    });

    // Astro's <Image> cannot size a remote source without them.
    expect(
      normalizePost({ ...base, cover: { url: '/uploads/a.png' } })?.data.cover,
    ).toBeUndefined();
  });

  it('leaves absolute media URLs untouched', () => {
    const post = normalizePost({
      ...base,
      cover: { url: 'https://cdn.example.com/a.png', width: 10, height: 10 },
    });

    expect(post?.data.cover?.src).toBe('https://cdn.example.com/a.png');
  });

  it('maps the seo component onto og fields and defaults ogType to article', () => {
    const post = normalizePost({
      ...base,
      seo: {
        ogTitle: 'og title',
        ogDescription: 'og desc',
        keywords: ['a', 'b'],
        ogImage: { url: '/uploads/og.png' },
      },
    });

    expect(post?.data.og).toEqual({
      title: 'og title',
      description: 'og desc',
      image: 'https://cms.example.com/uploads/og.png',
      type: 'article',
    });
    expect(post?.data.keywords).toEqual(['a', 'b']);
  });

  it('treats absent booleans as false rather than undefined', () => {
    const post = normalizePost(base);

    expect(post?.data.featured).toBe(false);
    expect(post?.data.noindex).toBe(false);
    expect(post?.data.topics).toEqual([]);
  });
});
