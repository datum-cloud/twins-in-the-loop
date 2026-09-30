import { isSiteIndexable, withBase } from './siteEnv';

/** Homepage, About, and site-wide share-card fallback. */
export const DEFAULT_OG_IMAGE = '/images/og-default.jpg';

/** Article pages when `og.image` and `cover` are omitted. */
export const ARTICLE_OG_IMAGE = '/images/og-news.jpg';

/**
 * LinkedIn link-preview size.
 * https://www.linkedin.com/help/linkedin/answer/a521928
 * Minimum 1200×627, recommended ratio 1.91:1, max 5 MB.
 */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 627;

export type OgType = 'website' | 'article';

export interface OgInput {
  title?: string;
  description?: string;
  image?: string;
  type?: OgType;
}

export interface ArticleMeta {
  publishedTime: Date;
  modifiedTime?: Date;
  author: string;
  topics?: string[];
}

export interface SeoInput {
  title: string;
  description: string;
  canonical?: string;
  og?: OgInput;
  noindex?: boolean;
  keywords?: string[];
  article?: ArticleMeta;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageType?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType: OgType;
  robots: string;
  keywords?: string[];
  article?: ArticleMeta;
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

export function framedOgImagePath(slug: string): string {
  return `/og/${slug}.jpg`;
}

function imagePathname(imageUrl: string): string {
  if (/^https?:\/\//.test(imageUrl)) {
    return new URL(imageUrl).pathname;
  }

  const queryIndex = imageUrl.indexOf('?');
  return queryIndex === -1 ? imageUrl : imageUrl.slice(0, queryIndex);
}

/** MIME type LinkedIn accepts. WebP is omitted; their crawler drops it. */
export function ogImageType(imageUrl: string): string | undefined {
  const pathname = imagePathname(imageUrl).toLowerCase();
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (pathname.endsWith('.png')) {
    return 'image/png';
  }
  if (pathname.endsWith('.gif')) {
    return 'image/gif';
  }

  return undefined;
}

/** Width and height for cards we generate at the LinkedIn size. */
export function standardOgDimensions(
  imageUrl: string,
): { width: number; height: number } | undefined {
  const pathname = imagePathname(imageUrl);
  const standard =
    pathname.endsWith(DEFAULT_OG_IMAGE) ||
    pathname.endsWith(ARTICLE_OG_IMAGE) ||
    /\/og\/[^/]+\.jpe?g$/.test(pathname);

  if (!standard) {
    return undefined;
  }

  return { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
}

export function articleOgImage(
  image: string | { src: string } | undefined,
  cover?: string | { src: string } | undefined,
  slug?: string,
): string {
  const explicit = ogImageSrc(image);
  if (explicit) {
    return explicit;
  }

  if (cover && slug) {
    return framedOgImagePath(slug);
  }

  return ogImageSrc(cover) ?? ARTICLE_OG_IMAGE;
}

/** Absolute URLs pass through; site paths get the base and origin. */
export function absoluteUrl(pathOrUrl: string, siteUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl)
    ? pathOrUrl
    : new URL(withBase(pathOrUrl), siteUrl).toString();
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
  const ogImage = absoluteUrl(ogSource, site.siteUrl);
  const indexable = options.indexable ?? isSiteIndexable();
  const dimensions = standardOgDimensions(ogImage);

  return {
    title: input.title,
    description: input.description,
    canonical,
    ogTitle: input.og?.title ?? withSiteTitle(input.title, site.title),
    ogDescription: input.og?.description ?? input.description,
    ogImage,
    ogImageType: ogImageType(ogImage),
    ogImageWidth: dimensions?.width,
    ogImageHeight: dimensions?.height,
    ogType: input.og?.type ?? 'website',
    robots: !indexable || input.noindex ? 'noindex, nofollow' : 'index, follow',
    keywords: input.keywords,
    article: input.article,
  };
}

export function withSiteTitle(pageTitle: string, siteTitle: string): string {
  if (pageTitle === siteTitle) {
    return pageTitle;
  }

  return `${pageTitle} · ${siteTitle}`;
}
