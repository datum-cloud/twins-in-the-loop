import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { AUTHOR_IDS, CONTENT_TYPES, TOPIC_IDS } from './lib/types';

const ogType = z.enum(['website', 'article']);

const ogFields = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  type: ogType.default('website'),
});

const seoFields = {
  title: z.string(),
  description: z.string(),
  canonical: z.url().optional(),
  og: ogFields.optional(),
  noindex: z.boolean().default(false),
  keywords: z.array(z.string()).optional(),
};

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      og: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          image: z.union([z.string().startsWith('/'), z.url(), image()]).optional(),
          type: ogType.default('article'),
        })
        .optional(),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      author: z.enum(AUTHOR_IDS),
      type: z.enum(CONTENT_TYPES),
      topics: z.array(z.enum(TOPIC_IDS)).min(1),
      excerpt: z.string(),
      cover: image().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      tldr: z.string().optional(),
      embedUrl: z.url().optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      og: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          image: z.union([z.string().startsWith('/'), z.url(), image()]).optional(),
          type: ogType.default('website'),
        })
        .optional(),
      heading: z.string(),
    }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      og: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          image: z.union([z.string().startsWith('/'), z.url(), image()]).optional(),
          type: ogType.default('website'),
        })
        .optional(),
      name: z.string(),
      role: z.string(),
      photo: image(),
      linkedin: z.url(),
      email: z.email(),
    }),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/site' }),
  schema: z.object({
    ...seoFields,
    tagline: z.string(),
    footerBlurb: z.string(),
    subscribeUrl: z.url(),
    datumUrl: z.url(),
    copyright: z.string(),
    defaultOgImage: z.string(),
    socials: z.array(
      z.object({
        name: z.enum(['github', 'discord', 'youtube', 'linkedin', 'x']),
        href: z.url(),
      }),
    ),
  }),
});

export const collections = { posts, pages, authors, site };
