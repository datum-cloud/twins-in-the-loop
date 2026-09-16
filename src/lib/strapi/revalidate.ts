import {
  CacheManager,
  MemoryCacheDriver,
  revalidateConfigSchema,
} from '@datum-cloud/strapi-revalidate';

import { VercelRuntimeCacheDriver } from './cacheDriver';
import { readStrapiEnv, strapiOrigin } from './env';
import { purgeStrapiCaches } from './purge';

export const POSTS_TAG = 'twins-posts';
export const POSTS_LIST_KEY = 'twins-posts-list';
export const TOPICS_LIST_KEY = 'twins-topics-list';
export const POST_KEY_PREFIX = 'twins-post-';

export const postKey = (slug: string) => `${POST_KEY_PREFIX}${slug}`;
export const postTag = (slug: string) => `twins-post:${slug}`;

/**
 * The library derives a *singular* tag from the uid
 * (`api::twins-post.twins-post` -> `twins-post`), but every cache entry here is
 * tagged with the plural `twins-posts`. Without this override the webhook
 * returns 200 while invalidating nothing.
 *
 * Topics are mapped onto the same tag because renaming a topic changes the
 * chips rendered on every post that references it.
 */
const TAG_MAP: Record<string, string[]> = {
  'api::twins-post.twins-post': [POSTS_TAG],
  'api::topic.topic': [POSTS_TAG],
};

export const strapiUrl = strapiOrigin();
export const strapiToken = readStrapiEnv('STRAPI_TOKEN');
export const webhookSecret = readStrapiEnv('STRAPI_WEBHOOK_SECRET');

export const config = revalidateConfigSchema.parse({
  url: strapiUrl,
  token: strapiToken,
  webhook: { secret: webhookSecret, tagMap: TAG_MAP },
});

const fallbackDriver = new MemoryCacheDriver();

export const cache = new CacheManager({
  primary: new VercelRuntimeCacheDriver('twins-strapi'),
  fallback: fallbackDriver,
  // Safe to keep long because the webhook invalidates on publish; this only
  // matters if a webhook delivery is ever missed.
  defaultTtl: 60 * 60 * 24,
});

/**
 * Fallback entries deliberately outlive their TTL so a Strapi outage can't take
 * the site down. An `entry.delete`/`entry.unpublish` webhook is the one
 * authoritative signal that content is really gone rather than unreachable, so
 * it's the only thing allowed to drop a fallback entry.
 */
export async function deleteFallback(key: string): Promise<void> {
  await fallbackDriver.delete(key);
}

/** Expire the Strapi collection tag and drop every fallback entry. */
export async function purgeStrapiCache(): Promise<void> {
  await purgeStrapiCaches(
    {
      invalidate: (tag) => cache.invalidate(tag),
      clearFallback: () => fallbackDriver.clear(),
    },
    POSTS_TAG,
  );
}
