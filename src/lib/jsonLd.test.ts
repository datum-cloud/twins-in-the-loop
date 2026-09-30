import { describe, expect, it } from 'vitest';
import { articleJsonLd, blogJsonLd, breadcrumbJsonLd } from './jsonLd';

const publisher = {
  name: 'Datum Technology Inc.',
  url: 'https://www.datum.net',
};

const base = {
  title: 'A post',
  description: 'About a post',
  url: 'https://twinsintheloop.com/a-post',
  image: 'https://twinsintheloop.com/og/a-post.jpg',
  published: new Date('2026-07-15T00:00:00Z'),
  authorName: 'Zac Smith',
  authorUrl: 'https://www.linkedin.com/in/zacsmith',
  publisher,
};

describe('articleJsonLd', () => {
  it('builds a BlogPosting with absolute image, publisher, and modified date', () => {
    const data = articleJsonLd({ ...base, type: 'post', keywords: ['a', 'b'] });

    expect(data['@type']).toBe('BlogPosting');
    expect(data.image).toEqual([base.image]);
    expect(data.dateModified).toBe('2026-07-15T00:00:00.000Z');
    expect(data.keywords).toBe('a, b');
    expect(data.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': base.url,
    });
    expect(data.publisher).toMatchObject({ '@type': 'Organization' });
  });

  it('prefers the updated date for dateModified', () => {
    const data = articleJsonLd({
      ...base,
      type: 'musing',
      updated: new Date('2026-08-01T00:00:00Z'),
    });

    expect(data['@type']).toBe('BlogPosting');
    expect(data.dateModified).toBe('2026-08-01T00:00:00.000Z');
  });

  it('builds a VideoObject with the embed url', () => {
    const data = articleJsonLd({
      ...base,
      type: 'video',
      embedUrl: 'https://youtube.com/embed/x',
    });

    expect(data['@type']).toBe('VideoObject');
    expect(data.uploadDate).toBe('2026-07-15T00:00:00.000Z');
    expect(data.thumbnailUrl).toBe(base.image);
    expect(data.embedUrl).toBe('https://youtube.com/embed/x');
  });

  it('builds a PodcastEpisode with media only when an embed exists', () => {
    expect(articleJsonLd({ ...base, type: 'podcast' }).associatedMedia).toBe(
      undefined,
    );
    expect(
      articleJsonLd({
        ...base,
        type: 'podcast',
        embedUrl: 'https://example.com/ep',
      }).associatedMedia,
    ).toEqual({ '@type': 'MediaObject', contentUrl: 'https://example.com/ep' });
  });
});

describe('blogJsonLd', () => {
  it('emits WebSite and Blog nodes with a publisher', () => {
    const nodes = blogJsonLd({
      name: 'Twins in the Loop',
      description: 'A blog',
      url: 'https://twinsintheloop.com/',
      publisher,
    });

    expect(nodes.map((node) => node['@type'])).toEqual(['WebSite', 'Blog']);
    expect(nodes.every((node) => node.publisher)).toBe(true);
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers items from one', () => {
    const data = breadcrumbJsonLd([
      { name: 'Home', url: 'https://twinsintheloop.com/' },
      { name: 'A post', url: 'https://twinsintheloop.com/a-post' },
    ]);

    expect(data.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://twinsintheloop.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'A post',
        item: 'https://twinsintheloop.com/a-post',
      },
    ]);
  });
});
