import { timingSafeEqual } from 'node:crypto';

import type { APIRoute } from 'astro';

import { config, purgeStrapiCache } from '../../lib/strapi/revalidate';

function providedSecret(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (match?.[1]) return match[1].trim();
  }
  const legacy = request.headers.get('x-webhook-secret');
  return legacy?.trim() || null;
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorized(request: Request): boolean {
  if (import.meta.env.DEV) return true;

  const secret = config.webhook?.secret;
  if (!secret) return false;

  const provided = providedSecret(request);
  return provided !== null && secretsMatch(provided, secret);
}

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV && !config.webhook?.secret) {
    console.error(
      '[strapi-cache] STRAPI_WEBHOOK_SECRET is not set — rejecting',
    );
    return new Response(
      JSON.stringify({ ok: false, error: 'Webhook secret not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await purgeStrapiCache();
  } catch (error) {
    console.error('[strapi-cache] purge failed:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ ok: true, purged: ['twins-posts'] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
