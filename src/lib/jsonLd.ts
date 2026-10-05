import type { ContentType } from './types';

export type JsonLd = Record<string, unknown>;

export interface PublisherInput {
  name: string;
  url: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleJsonLdInput {
  type: ContentType;
  title: string;
  description?: string;
  url: string;
  /** Absolute URL of the share image. */
  image: string;
  published: Date;
  updated?: Date;
  authorName: string;
  authorUrl?: string;
  publisher: PublisherInput;
  keywords?: string[];
  embedUrl?: string;
}

function publisherNode(publisher: PublisherInput): JsonLd {
  return { '@type': 'Organization', name: publisher.name, url: publisher.url };
}

export function blogJsonLd(input: {
  name: string;
  description: string;
  url: string;
  publisher: PublisherInput;
}): JsonLd[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: input.name,
      url: input.url,
      description: input.description,
      inLanguage: 'en',
      publisher: publisherNode(input.publisher),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: input.name,
      url: input.url,
      description: input.description,
      inLanguage: 'en',
      publisher: publisherNode(input.publisher),
    },
  ];
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleJsonLd(input: ArticleJsonLdInput): JsonLd {
  const common = {
    '@context': 'https://schema.org',
    name: input.title,
    headline: input.title,
    description: input.description,
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    image: [input.image],
    inLanguage: 'en',
    keywords: input.keywords?.join(', '),
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: input.authorUrl,
    },
    publisher: publisherNode(input.publisher),
  };
  const published = input.published.toISOString();
  const modified = (input.updated ?? input.published).toISOString();

  switch (input.type) {
    case 'post':
    case 'musing':
      return {
        ...common,
        '@type': 'BlogPosting',
        datePublished: published,
        dateModified: modified,
      };
    case 'video':
      return {
        ...common,
        '@type': 'VideoObject',
        uploadDate: published,
        thumbnailUrl: input.image,
        embedUrl: input.embedUrl,
      };
    case 'podcast':
      return {
        ...common,
        '@type': 'PodcastEpisode',
        datePublished: published,
        dateModified: modified,
        associatedMedia: input.embedUrl
          ? { '@type': 'MediaObject', contentUrl: input.embedUrl }
          : undefined,
      };
    default: {
      const _exhaustive: never = input.type;
      throw new Error(`Unhandled content type ${_exhaustive}`);
    }
  }
}
