/**
 * Strapi-backed SSR responses. The runtime cache holds for 24h and is purged by
 * webhook, so the short `s-maxage` only governs how fast an edge-cached HTML
 * response picks up that purge.
 */
export const STRAPI_SSR_CACHE_CONTROL =
  'public, max-age=0, s-maxage=60, stale-while-revalidate=300';

export function setCdnCacheHeaders(headers: Headers): void {
  headers.set('Cache-Control', STRAPI_SSR_CACHE_CONTROL);
}
