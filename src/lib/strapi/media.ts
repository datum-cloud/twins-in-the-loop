import { strapiUrl } from './revalidate';

const readEnv = (name: string): string | undefined => {
  const value = import.meta.env[name] ?? process.env[name];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
};

/** Strapi Cloud serves uploads from a CDN host; local dev serves them relative to the API. */
const mediaBase = (readEnv('STRAPI_ASSETS_URL') ?? strapiUrl).replace(
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
