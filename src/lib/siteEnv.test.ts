import { describe, expect, it } from 'vitest';
import { isSiteIndexable, robotsTxt, withBase } from './siteEnv';

describe('isSiteIndexable', () => {
  it('is true only for production', () => {
    expect(isSiteIndexable('production')).toBe(true);
    expect(isSiteIndexable('staging')).toBe(false);
    expect(isSiteIndexable(undefined)).toBe(false);
  });
});

describe('withBase', () => {
  it('keeps site-root paths on production base', () => {
    expect(withBase('/about', '/')).toBe('/about');
    expect(withBase('/', '/')).toBe('/');
    expect(withBase('/?topic=ai', '/')).toBe('/?topic=ai');
  });

  it('prefixes project Pages base', () => {
    expect(withBase('/about', '/twins-in-the-loop/')).toBe(
      '/twins-in-the-loop/about',
    );
    expect(withBase('/', '/twins-in-the-loop/')).toBe('/twins-in-the-loop/');
    expect(withBase('/?topic=ai', '/twins-in-the-loop/')).toBe(
      '/twins-in-the-loop/?topic=ai',
    );
    expect(withBase('/post-slug', '/twins-in-the-loop')).toBe(
      '/twins-in-the-loop/post-slug',
    );
  });
});

describe('robotsTxt', () => {
  it('disallows all crawlers when the site is not indexable', () => {
    expect(robotsTxt({ indexable: false })).toBe(
      'User-agent: *\nDisallow: /\n',
    );
  });

  it('allows crawlers and advertises the sitemap when indexable', () => {
    expect(
      robotsTxt({ indexable: true, site: 'https://twinsintheloop.com' }),
    ).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://twinsintheloop.com/sitemap-index.xml\n',
    );
  });
});
