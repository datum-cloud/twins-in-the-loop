import { strapi } from '@strapi/client';

import { cache, strapiToken, strapiUrl } from './revalidate';

function createClient() {
  return strapi({
    baseURL: `${strapiUrl.replace(/\/$/, '')}/api`,
    auth: strapiToken || undefined,
  });
}

export interface FetchOptions {
  filters?: Record<string, unknown>;
  sort?: string | string[];
  fields?: string[];
  populate?: Record<string, unknown>;
  pagination?: { page?: number; pageSize?: number };
}

export interface CacheOptions {
  key: string;
  tags: string[];
}

/**
 * Fetch a published collection through the runtime cache.
 *
 * The fetcher must resolve to `null` rather than throw: `getWithFallback` only
 * reads the last-known-good copy when it sees `null`, so a thrown error would
 * skip the fallback and surface as an empty list.
 */
export async function fetchCollection<T>(
  name: string,
  options: FetchOptions,
  cacheOptions: CacheOptions,
): Promise<T[]> {
  const fetcher = async (): Promise<T[] | null> => {
    try {
      const { data } = await createClient()
        .collection(name)
        // Strapi silently defaults to a 25-item page when pagination is omitted.
        .find({
          pagination: { pageSize: 100 },
          ...options,
          status: 'published',
        });
      return data as T[];
    } catch (error) {
      console.error(`[strapi] fetchCollection(${name}) failed:`, error);
      return null;
    }
  };

  const result = await cache.getWithFallback<T[]>(cacheOptions.key, fetcher, {
    tags: cacheOptions.tags,
  });

  return result ?? [];
}
