/**
 * Strapi Cloud serves media from a separate CDN host, not from `STRAPI_URL`.
 * `astro.config.mjs` needs the bare hostname for `image.domains`, which is
 * evaluated before Astro loads `.env` — so this falls back to a constant
 * rather than depending on env being present at config time.
 */
const DEFAULT_MEDIA_HOST = 'grateful-excitement-dfe9d47bad.media.strapiapp.com';

export function strapiMediaHostname(): string {
  const override =
    process.env.STRAPI_ASSETS_URL || process.env.STRAPI_MEDIA_HOST;
  if (!override) return DEFAULT_MEDIA_HOST;

  try {
    return new URL(override).hostname;
  } catch {
    return override;
  }
}
