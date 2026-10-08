import { lookup } from 'node:dns/promises';

import type { APIRoute } from 'astro';

export const prerender = false;

const TIMEOUT_MS = 5000;

type Probe = {
  target: string;
  ok: boolean;
  status?: number;
  ms: number;
  error?: string;
};

// dns.lookup has no timeout of its own, and a hung resolver would otherwise
// hold the whole response past the edge proxy's deadline.
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)),
        TIMEOUT_MS,
      ),
    ),
  ]);
}

async function probe(target: string): Promise<Probe> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      fetch(target, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'manual',
      }),
      'fetch',
    );
    return { target, ok: true, status: res.status, ms: Date.now() - start };
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string } };
    const cause = e.cause?.code ?? e.cause?.message ?? '';
    return {
      target,
      ok: false,
      ms: Date.now() - start,
      error: `${e.name}: ${e.message}${cause ? ` (${cause})` : ''}`,
    };
  }
}

async function resolve(host: string) {
  const start = Date.now();
  try {
    const addrs = await withTimeout(lookup(host, { all: true }), 'lookup');
    return {
      host,
      ms: Date.now() - start,
      addrs: addrs.map((a) => `v${a.family} ${a.address}`),
    };
  } catch (err) {
    const e = err as Error & { code?: string };
    return { host, ms: Date.now() - start, error: e.code ?? e.message };
  }
}

export const GET: APIRoute = async () => {
  const strapi = (process.env.STRAPI_URL ?? '').replace(/\/+$/, '');
  const hosts = [
    strapi ? new URL(strapi).hostname : '',
    'grateful-excitement-dfe9d47bad.media.strapiapp.com',
    'example.com',
  ].filter(Boolean);

  const targets = [
    strapi && `${strapi}/_health`,
    'https://grateful-excitement-dfe9d47bad.media.strapiapp.com/',
    'https://example.com/',
    'https://1.1.1.1/',
    'https://[2606:4700:4700::1111]/',
  ].filter(Boolean) as string[];

  const [dns, http] = await Promise.all([
    Promise.all(hosts.map(resolve)),
    Promise.all(targets.map(probe)),
  ]);

  return new Response(
    JSON.stringify(
      { node: process.version, strapiConfigured: Boolean(strapi), dns, http },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    },
  );
};
