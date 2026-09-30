import { describe, expect, it } from 'vitest';
import {
  ARTICLE_OG_IMAGE,
  DEFAULT_OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  articleOgImage,
  resolveSeo,
  withSiteTitle,
} from './seo';

const site = {
  title: 'Twins in the Loop',
  description: 'Editorial site',
  siteUrl: 'https://twinsintheloop.com',
  defaultOgImage: DEFAULT_OG_IMAGE,
};

describe('resolveSeo', () => {
  it('builds canonical and og urls from the site origin', () => {
    const seo = resolveSeo(
      { title: 'About', description: 'Meet the twins' },
      site,
      '/about',
      { indexable: true },
    );

    expect(seo.canonical).toBe('https://twinsintheloop.com/about');
    expect(seo.ogImage).toBe(`https://twinsintheloop.com${DEFAULT_OG_IMAGE}`);
    expect(seo.ogImageType).toBe('image/jpeg');
    expect(seo.ogImageWidth).toBe(OG_IMAGE_WIDTH);
    expect(seo.ogImageHeight).toBe(OG_IMAGE_HEIGHT);
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
          description:
            'We are infrastructure, open source software, and design nerds who love building for the future.',
          image: '/share/about.png',
        },
      },
      site,
      '/about',
    );

    expect(seo.title).toBe('About this blog');
    expect(seo.description).toBe('Why we write');
    expect(seo.ogTitle).toBe(
      'We’re on a mission to help the next 1k clouds thrive',
    );
    expect(seo.ogDescription).toBe(
      'We are infrastructure, open source software, and design nerds who love building for the future.',
    );
    expect(seo.ogImage).toBe('https://twinsintheloop.com/share/about.png');
    expect(seo.ogImageType).toBe('image/png');
    expect(seo.ogImageWidth).toBeUndefined();
    expect(seo.ogImageHeight).toBeUndefined();
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
      { indexable: true },
    );
    expect(seo.robots).toBe('noindex, nofollow');
  });

  it('forces noindex when the site is not indexable', () => {
    const seo = resolveSeo(
      { title: 'About', description: 'Meet the twins', noindex: false },
      site,
      '/about',
      { indexable: false },
    );
    expect(seo.robots).toBe('noindex, nofollow');
  });
});

describe('articleOgImage', () => {
  it('uses og.image first', () => {
    expect(
      articleOgImage('/share/custom.png', { src: '/covers/post.png' }, 'post'),
    ).toBe('/share/custom.png');
  });

  it('uses a framed share card when a cover and slug are present', () => {
    const image = articleOgImage(
      undefined,
      { src: '/covers/post.png' },
      'post',
    );
    expect(image).toBe('/og/post.jpg');

    const seo = resolveSeo(
      { title: 'Post', description: 'Body', og: { image } },
      site,
      '/post',
    );
    expect(seo.ogImageWidth).toBe(OG_IMAGE_WIDTH);
    expect(seo.ogImageHeight).toBe(OG_IMAGE_HEIGHT);
    expect(seo.ogImageType).toBe('image/jpeg');
  });

  it('falls back to cover when og.image and slug are omitted', () => {
    expect(articleOgImage(undefined, { src: '/covers/post.png' })).toBe(
      '/covers/post.png',
    );
  });

  it('falls back to the article default when og.image and cover are omitted', () => {
    expect(articleOgImage(undefined)).toBe(ARTICLE_OG_IMAGE);
  });
});

describe('withSiteTitle', () => {
  it('avoids duplicating the site title on the homepage', () => {
    expect(withSiteTitle('Twins in the Loop', 'Twins in the Loop')).toBe(
      'Twins in the Loop',
    );
  });

  it('appends the site title on inner pages', () => {
    expect(withSiteTitle('About', 'Twins in the Loop')).toBe(
      'About · Twins in the Loop',
    );
  });
});
