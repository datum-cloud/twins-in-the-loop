import { describe, expect, it } from 'vitest';
import { resolveSeo, withSiteTitle } from './seo';

const site = {
  title: 'Twins in the Loop',
  description: 'Editorial site',
  siteUrl: 'https://twinsintheloop.com',
  defaultOgImage: '/og.png',
};

describe('resolveSeo', () => {
  it('builds canonical and og urls from the site origin', () => {
    const seo = resolveSeo(
      { title: 'About', description: 'Meet the twins' },
      site,
      '/about',
    );

    expect(seo.canonical).toBe('https://twinsintheloop.com/about');
    expect(seo.ogImage).toBe('https://twinsintheloop.com/og.png');
    expect(seo.ogTitle).toBe('About · Twins in the Loop');
    expect(seo.ogDescription).toBe('Meet the twins');
    expect(seo.robots).toBe('index, follow');
  });

  it('uses nested og title, description, and image when set', () => {
    const seo = resolveSeo(
      {
        title: 'About this blog',
        description: 'Why we write',
        og: {
          title: 'We’re on a mission to help the next 1k clouds thrive',
          description: 'We are infrastructure, open source software, and design nerds who love building for the future.',
          image: '/share/about.png',
        },
      },
      site,
      '/about',
    );

    expect(seo.title).toBe('About this blog');
    expect(seo.description).toBe('Why we write');
    expect(seo.ogTitle).toBe('We’re on a mission to help the next 1k clouds thrive');
    expect(seo.ogDescription).toBe(
      'We are infrastructure, open source software, and design nerds who love building for the future.',
    );
    expect(seo.ogImage).toBe('https://twinsintheloop.com/share/about.png');
    expect(seo.ogType).toBe('website');
  });

  it('uses nested og type when set', () => {
    const seo = resolveSeo(
      {
        title: 'Post',
        description: 'Body',
        og: { type: 'article' },
      },
      site,
      '/post',
    );

    expect(seo.ogType).toBe('article');
  });

  it('honors noindex', () => {
    const seo = resolveSeo(
      { title: 'Draft', description: 'Hidden', noindex: true },
      site,
      '/draft',
    );
    expect(seo.robots).toBe('noindex, nofollow');
  });
});

describe('withSiteTitle', () => {
  it('avoids duplicating the site title on the homepage', () => {
    expect(withSiteTitle('Twins in the Loop', 'Twins in the Loop')).toBe('Twins in the Loop');
  });

  it('appends the site title on inner pages', () => {
    expect(withSiteTitle('About', 'Twins in the Loop')).toBe('About · Twins in the Loop');
  });
});
