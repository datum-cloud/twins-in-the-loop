import type { WebhookEvent } from '@datum-cloud/strapi-revalidate';

/** Events meaning "this entry no longer exists" — don't re-warm the slug. */
const DELETE_EVENTS = new Set(['entry.delete', 'entry.unpublish']);

export interface WarmAfterRevalidateIo {
  /** Return `null` only when Strapi was unreachable. An empty list is success. */
  loadPostList: () => Promise<unknown[] | null>;
  loadPostBySlug: (slug: string) => Promise<unknown | null>;
  deleteFallback: (key: string) => Promise<void>;
  postKey: (slug: string) => string;
}

/**
 * Re-fetch after tag invalidation. Trust the fetcher return value — do not
 * `cache.get` again. Vercel `expireTag` can still hide a successful `set`
 * from a follow-up get in the same request.
 */
export async function warmAfterRevalidate(
  event: WebhookEvent,
  io: WarmAfterRevalidateIo,
): Promise<void> {
  const list = await io.loadPostList();
  if (list === null) {
    throw new Error(
      'Cache warm failed: could not fetch twins-posts from Strapi',
    );
  }

  if (!event.slug) return;

  if (DELETE_EVENTS.has(event.event)) {
    await io.deleteFallback(io.postKey(event.slug));
    return;
  }

  const post = await io.loadPostBySlug(event.slug);
  if (!post) {
    throw new Error(`Cache warm failed: could not load post "${event.slug}"`);
  }
}
