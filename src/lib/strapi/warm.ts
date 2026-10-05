import type { WebhookEvent } from '@datum-cloud/strapi-revalidate';

/** Events meaning "this entry no longer exists" — drop its fallback copy too. */
const GONE_EVENTS = new Set(['entry.delete', 'entry.unpublish']);

export interface DropCachedContentIo {
  deleteKey: (key: string) => Promise<void>;
  deleteFallback: (key: string) => Promise<void>;
  listKeys: readonly string[];
  postKey: (slug: string) => string;
}

/**
 * Drop cached Strapi entries after tag invalidation. Do not write them back
 * in this request: Vercel `expireTag` is eventually consistent and can expire
 * or hide a `set` from the same webhook invocation, so the next read keeps
 * the previous body until the 24h TTL. The following page request misses and
 * fills the cache from Strapi.
 */
export async function dropCachedContent(
  event: WebhookEvent,
  io: DropCachedContentIo,
): Promise<void> {
  const slugKey = event.slug ? io.postKey(event.slug) : undefined;
  const keys = slugKey ? [...io.listKeys, slugKey] : [...io.listKeys];
  await Promise.all(keys.map((key) => io.deleteKey(key)));

  if (!slugKey || !GONE_EVENTS.has(event.event)) return;
  await io.deleteFallback(slugKey);
}
