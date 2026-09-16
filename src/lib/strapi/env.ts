/**
 * Env helpers for Strapi. `vercel pull` writes `[SENSITIVE]` for secrets it
 * cannot download; treat that as unset so prerender/build cannot crash or
 * bake the placeholder into the server bundle.
 *
 * Prefer `process.env` so Vercel Function runtime values win over any Vite
 * inlined `import.meta.env` from the GitHub Actions prebuild.
 */
const PULLED_PLACEHOLDER = '[SENSITIVE]';
const DEFAULT_STRAPI_URL = 'http://localhost:1337';

function usable(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === PULLED_PLACEHOLDER) {
    return undefined;
  }
  return trimmed;
}

export function readStrapiEnv(name: string): string | undefined {
  return usable(process.env[name]) ?? usable(import.meta.env[name]);
}

export function strapiOrigin(
  raw: string | undefined = readStrapiEnv('STRAPI_URL'),
): string {
  const candidate = raw ?? DEFAULT_STRAPI_URL;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return DEFAULT_STRAPI_URL;
    }
    return candidate.replace(/\/$/, '');
  } catch {
    return DEFAULT_STRAPI_URL;
  }
}
