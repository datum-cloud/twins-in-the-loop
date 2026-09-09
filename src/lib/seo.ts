import { isSiteIndexable, withBase } from './siteEnv';

/** Homepage, About, and site-wide share-card fallback. */
export const DEFAULT_OG_IMAGE = '/images/og-default.jpg';

/** Article pages when `og.image` is omitted. */
export const ARTICLE_OG_IMAGE = '/images/og-news.jpg';

export type OgType = 'website' | 'article';

export interface OgInput {
  title?: string;
  description?: string;
  image?: string;
  type?: OgType;
}

export interface SeoInput {
  title: string;
  description: string;
  canonical?: string;
  og?: OgInput;
  noindex?: boolean;
  keywords?: string[];
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: OgType;
  robots: string;
  keywords?: string[];
}

export interface SiteSeoDefaults {
  title: string;
  description: string;
  siteUrl: string;
  defaultOgImage: string;
}

export interface ResolveSeoOptions {
  indexable?: boolean;
}

export function ogImageSrc(
  image: string | { src: string } | undefined,
): string | undefined {
  if (!image) {
    return undefined;
  }

  if (typeof image === 'string') {
    return image;
  }

  return image.src;
}

export function articleOgImage(
  image: string | { src: string } | undefined,
): string {
  return ogImageSrc(image) ?? ARTICLE_OG_IMAGE;
}

export function resolveSeo(
  input: SeoInput,
  site: SiteSeoDefaults,
  path: string,
  options: ResolveSeoOptions = {},
): ResolvedSeo {
  const canonical =
    input.canonical ?? new URL(withBase(path), site.siteUrl).toString();
  const ogSource = input.og?.image ?? site.defaultOgImage;
  const ogImage = /^https?:\/\//.test(ogSource)
    ? ogSource
    : new URL(withBase(ogSource), site.siteUrl).toString();
  const indexable = options.indexable ?? isSiteIndexable();

  return {
    title: input.title,
    description: input.description,
    canonical,
    ogTitle: input.og?.title ?? withSiteTitle(input.title, site.title),
    ogDescription: input.og?.description ?? input.description,
    ogImage,
    ogType: input.og?.type ?? 'website',
    robots: !indexable || input.noindex ? 'noindex, nofollow' : 'index, follow',
    keywords: input.keywords,
  };
}

export function withSiteTitle(pageTitle: string, siteTitle: string): string {
  if (pageTitle === siteTitle) {
    return pageTitle;
  }

  return `${pageTitle} · ${siteTitle}`;
}
