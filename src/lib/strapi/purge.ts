/** Primary + fallback drivers used by the Strapi cache. */
export interface StrapiCacheHandles {
  invalidate(tag: string): Promise<void>;
  clearFallback(): Promise<void>;
}

/**
 * Drop every Strapi cache entry this site owns. Primary is expired by tag;
 * fallback is wiped so a later fetch cannot resurrect stale last-known-good
 * copies.
 */
export async function purgeStrapiCaches(
  handles: StrapiCacheHandles,
  tag: string,
): Promise<void> {
  const results = await Promise.allSettled([
    handles.invalidate(tag),
    handles.clearFallback(),
  ]);
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      'Failed to purge Strapi cache',
    );
  }
}
