import {
  type WebhookEvent,
  createWebhookHandler,
} from '@datum-cloud/strapi-revalidate';
import type { APIRoute } from 'astro';

import { cache, config, deleteFallback, postKey } from '../../lib/strapi/revalidate';
import {
  fetchPostBySlug,
  loadPublishedPostRecords,
} from '../../lib/strapi/posts';
import { warmAfterRevalidate } from '../../lib/strapi/warm';

async function onRevalidate(event: WebhookEvent): Promise<void> {
  await warmAfterRevalidate(event, {
    loadPostList: () => loadPublishedPostRecords('origin'),
    loadPostBySlug: (slug) => fetchPostBySlug(slug, 'origin'),
    deleteFallback,
    postKey,
  });
}

const handle = createWebhookHandler({
  config: {
    ...config,
    webhook: {
      ...config.webhook,
      failOnWarmError: true,
      onRevalidate,
    },
  },
  cache,
});

/** Strapi (and browsers) probe the URL with GET/HEAD; only POST revalidates. */
export const HEAD: APIRoute = () => new Response(null, { status: 204 });

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: true, methods: ['POST'] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  // Fail closed. The package skips verification entirely when no secret is
  // configured, which would leave this cache-purge endpoint open to anyone.
  if (!config.webhook?.secret) {
    console.error('[webhook] STRAPI_WEBHOOK_SECRET is not set — rejecting');
    return new Response(
      JSON.stringify({ ok: false, error: 'Webhook secret not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Read once: the request stream is single-use.
  const rawBody = await request.text();

  let status = 200;
  let body: unknown = {};

  // Fetch `Headers` has no string index signature, so it doesn't satisfy the
  // package's `WebhookRequest` type even though `.get()` works at runtime.
  const webhookRequest = {
    method: request.method,
    headers: {
      get: (name: string): string | null => {
        if (name.toLowerCase() === 'authorization') {
          const auth = request.headers.get('authorization');
          if (auth) return auth;
          const legacy = request.headers.get('x-webhook-secret');
          return legacy ? `Bearer ${legacy}` : null;
        }
        return request.headers.get(name);
      },
    },
    text: () => Promise.resolve(rawBody),
    json: () =>
      Promise.resolve(JSON.parse(rawBody.length > 0 ? rawBody : '{}')),
  };

  try {
    await handle(webhookRequest, {
      status: (code) => {
        status = code;
      },
      json: (value) => {
        body = value;
      },
    });
  } catch (error) {
    console.error('[webhook] unexpected handler error:', error);
    status = 500;
    body = { ok: false, error: 'Internal server error' };
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};
