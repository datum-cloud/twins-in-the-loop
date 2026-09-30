export interface ResolvePostIo<T extends { id: string }> {
  loadCachedPosts: () => Promise<T[]>;
  /** Bypass the list cache. The list can keep a renamed slug for its full TTL. */
  loadPostBySlug: (slug: string) => Promise<T | null>;
  /** Return null only when Strapi was unreachable. */
  refreshPosts: () => Promise<T[] | null>;
}

/**
 * Article routes read one cached list. A slug rename leaves that list fresh
 * until the webhook lands, so a missing slug is checked at the origin and the
 * list is rewritten when the post exists there.
 */
export async function resolvePublishedPost<T extends { id: string }>(
  slug: string,
  io: ResolvePostIo<T>,
): Promise<{ post: T | null; posts: T[] }> {
  const posts = await io.loadCachedPosts();
  const cached = posts.find((entry) => entry.id === slug);
  if (cached) return { post: cached, posts };

  const fresh = await io.loadPostBySlug(slug);
  if (!fresh) return { post: null, posts };

  const refreshed = await io.refreshPosts();
  if (refreshed === null) {
    return { post: fresh, posts: [fresh, ...posts] };
  }

  return {
    post: refreshed.find((entry) => entry.id === slug) ?? fresh,
    posts: refreshed,
  };
}
