import type { OgType } from '../seo';
import {
  type AuthorId,
  type ContentType,
  type TopicId,
  isAuthorId,
  isContentType,
} from '../types';
import { type CollectionRead, type FetchOptions, fetchCollection } from './client';
import { strapiMediaUrl } from './media';
import { POSTS_LIST_KEY, POSTS_TAG, postKey, postTag } from './revalidate';

interface StrapiMedia {
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
}

interface StrapiPostRecord {
  documentId: string;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  tldr?: string | null;
  author: string;
  type: string;
  published: string;
  updatedAt?: string | null;
  featured?: boolean | null;
  embedUrl?: string | null;
  canonical?: string | null;
  noindex?: boolean | null;
  cover?: StrapiMedia | null;
  topics?: { slug: string }[] | null;
  seo?: {
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogType?: string | null;
    keywords?: unknown;
    ogImage?: StrapiMedia | null;
  } | null;
  blocks?: { __component?: string; body?: string | null }[] | null;
}

export interface PostCover {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface PostData {
  title: string;
  description: string;
  excerpt: string;
  tldr?: string;
  published: Date;
  updated?: Date;
  author: AuthorId;
  type: ContentType;
  topics: TopicId[];
  cover?: PostCover;
  featured: boolean;
  embedUrl?: string;
  canonical?: string;
  noindex: boolean;
  keywords?: string[];
  og?: { title?: string; description?: string; image?: string; type: OgType };
}

export interface Post {
  /** The URL segment. Named `id` to match what the MDX collection exposed. */
  id: string;
  body: string;
  data: PostData;
}

const POPULATE = {
  cover: { fields: ['url', 'alternativeText', 'width', 'height'] },
  topics: { fields: ['slug'] },
  seo: { populate: { ogImage: { fields: ['url'] } } },
  blocks: { on: { 'shared.rich-text': { fields: ['body'] } } },
};

function toCover(media: StrapiMedia | null | undefined): PostCover | undefined {
  const src = strapiMediaUrl(media?.url);
  // Astro's <Image> needs intrinsic dimensions for a remote source.
  if (!src || !media?.width || !media?.height) return undefined;

  return {
    src,
    width: media.width,
    height: media.height,
    alt: media.alternativeText ?? '',
  };
}

function toKeywords(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const keywords = value.filter(
    (item): item is string => typeof item === 'string',
  );
  return keywords.length > 0 ? keywords : undefined;
}

export function normalizePost(record: StrapiPostRecord): Post | null {
  // `author` drives `shadow-*` classes and `type` drives icon names, so an
  // unrecognised value has no rendering. Topics are free-form by design.
  if (!isAuthorId(record.author) || !isContentType(record.type)) {
    console.warn(
      `[strapi] skipping post "${record.slug}": unknown author "${record.author}" or type "${record.type}"`,
    );
    return null;
  }

  const body = (record.blocks ?? [])
    .filter((block) => block.__component === 'shared.rich-text')
    .map((block) => block.body ?? '')
    .filter(Boolean)
    .join('\n\n');

  const ogImage = strapiMediaUrl(record.seo?.ogImage?.url);
  const ogType: OgType =
    record.seo?.ogType === 'website' ? 'website' : 'article';

  return {
    id: record.slug,
    body,
    data: {
      title: record.title,
      description: record.description,
      excerpt: record.excerpt,
      tldr: record.tldr ?? undefined,
      published: new Date(record.published),
      updated: record.updatedAt ? new Date(record.updatedAt) : undefined,
      author: record.author,
      type: record.type,
      topics: (record.topics ?? []).map((t) => t.slug).filter(Boolean),
      cover: toCover(record.cover),
      featured: record.featured ?? false,
      embedUrl: record.embedUrl ?? undefined,
      canonical: record.canonical ?? undefined,
      noindex: record.noindex ?? false,
      keywords: toKeywords(record.seo?.keywords),
      og: {
        title: record.seo?.ogTitle ?? undefined,
        description: record.seo?.ogDescription ?? undefined,
        image: ogImage,
        type: ogType,
      },
    },
  };
}

function normalizeAll(records: StrapiPostRecord[]): Post[] {
  return records
    .map(normalizePost)
    .filter((post): post is Post => post !== null)
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

const listOptions: FetchOptions = {
  sort: ['published:desc'],
  populate: POPULATE,
};

export async function getPublishedPosts(): Promise<Post[]> {
  return fetchPosts();
}

export async function loadPublishedPostRecords(
  read: CollectionRead = 'cache',
): Promise<StrapiPostRecord[] | null> {
  return fetchCollection<StrapiPostRecord>('twins-posts', listOptions, {
    key: POSTS_LIST_KEY,
    tags: [POSTS_TAG],
  }, read);
}

export async function fetchPosts(): Promise<Post[]> {
  return normalizeAll((await loadPublishedPostRecords()) ?? []);
}

export async function fetchPostBySlug(
  slug: string,
  read: CollectionRead = 'cache',
): Promise<Post | null> {
  const records = await fetchCollection<StrapiPostRecord>(
    'twins-posts',
    { filters: { slug: { $eq: slug } }, populate: POPULATE },
    { key: postKey(slug), tags: [POSTS_TAG, postTag(slug)] },
    read,
  );

  const record = records?.[0];
  return record ? normalizePost(record) : null;
}
