import { lookup } from 'node:dns/promises';

import type { APIRoute } from 'astro';

export const prerender = false;

type Probe = {
  target: string;
  ok: boolean;
  status?: number;
  ms: number;
  error?: string;
};

async function probe(target: string): Promise<Probe> {
  const start = Date.now();
  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(8000),
      redirect: 'manual',
    });
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
    const addrs = await lookup(host, { all: true });
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
