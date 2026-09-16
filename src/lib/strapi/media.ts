import { readStrapiEnv } from './env';
import { strapiUrl } from './revalidate';

/** Strapi Cloud serves uploads from a CDN host; local dev serves them relative to the API. */
const mediaBase = (readStrapiEnv('STRAPI_ASSETS_URL') ?? strapiUrl).replace(
  /\/$/,
  '',
);

export function strapiMediaUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${mediaBase}${url}`;
}

/**
 * Rewrite relative `/uploads/...` links and images in a markdown body to
 * absolute URLs. Bodies migrated from MDX can still carry them.
 */
export function resolveMarkdownMediaUrls(markdown: string): string {
  if (!markdown) return markdown;
  return markdown.replace(/\]\(\/uploads\//g, `](${mediaBase}/uploads/`);
}
