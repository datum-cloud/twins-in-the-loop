export function isSiteIndexable(
  env: string | undefined = import.meta.env.PUBLIC_SITE_ENV,
): boolean {
  return env === 'production';
}

export function withBase(
  path: string,
  base = import.meta.env.BASE_URL,
): string {
  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : path.slice(queryIndex);
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const relative = pathname.replace(/^\//, '');

  if (!relative) {
    return `${normalizedBase}${query}`;
  }

  return `${normalizedBase}${relative}${query}`;
}

export function robotsTxt(options: {
  indexable: boolean;
  site?: string | URL;
}): string {
  if (!options.indexable) {
    return 'User-agent: *\nDisallow: /\n';
  }

  const sitemap = new URL(
    'sitemap-index.xml',
    options.site ?? 'https://twinsintheloop.com',
  ).toString();

  return `User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`;
}
