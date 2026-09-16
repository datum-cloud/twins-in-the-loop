import type {
  CacheDriver,
  CacheSetOptions,
} from '@datum-cloud/strapi-revalidate';
import { type RuntimeCache, getCache } from '@vercel/functions';

/**
 * Adapts Vercel's Runtime Cache to strapi-revalidate's `CacheDriver`.
 *
 * Runtime Cache is a per-region KV shared across concurrent function instances
 * and persistent across deploys, unlike a `/tmp` file cache which is private to
 * one instance and reset on every cold start.
 *
 * It has no bulk-enumeration or flush primitive, so `keys()`/`clear()` are
 * no-ops — invalidation here is always by tag, via the Strapi webhook.
 */
export class VercelRuntimeCacheDriver implements CacheDriver {
  private readonly cache: RuntimeCache;

  constructor(namespace: string) {
    this.cache = getCache({ namespace });
  }

  async get<T>(key: string): Promise<T | null> {
    return ((await this.cache.get(key)) ?? null) as T | null;
  }

  async set<T>(
    key: string,
    data: T,
    options: CacheSetOptions = {},
  ): Promise<void> {
    await this.cache.set(key, data, { ttl: options.ttl, tags: options.tags });
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  async deleteByTag(tag: string): Promise<void> {
    await this.cache.expireTag(tag);
  }

  async clear(): Promise<void> {}

  async keys(): Promise<string[]> {
    return [];
  }
}
