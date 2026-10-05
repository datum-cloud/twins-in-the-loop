/**
 * Strapi-backed SSR responses. The runtime cache holds for 24h and is purged by
 * webhook, so these directives only govern how fast an edge-cached HTML
 * response picks up that purge: fresh for 60s, then stale for 3 minutes.
 */
export const STRAPI_SSR_CACHE_CONTROL =
  'public, max-age=0, s-maxage=60, stale-while-revalidate=180';

export function setCdnCacheHeaders(headers: Headers): void {
  headers.set('Cache-Control', STRAPI_SSR_CACHE_CONTROL);
}
