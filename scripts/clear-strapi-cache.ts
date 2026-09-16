#!/usr/bin/env bun

/**
 * Purge the Strapi cache owned by a running site process.
 *
 * Local cache is in-memory inside `astro dev`, so this script HTTP-POSTs the
 * process rather than constructing a second CacheManager (which would miss).
 *
 * Usage:
 *   bun run cache:clear
 *   bun run cache:clear -- --url http://localhost:7788
 *   bun run cache:clear -- --url https://twinsintheloop.com --remote
 */

const DEFAULT_ORIGIN = 'http://localhost:7788';

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function isLocalhost(baseUrl: string): boolean {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const baseUrl = (argValue('--url') ?? DEFAULT_ORIGIN).replace(/\/$/, '');
  const remote = process.argv.includes('--remote');
  const endpoint = `${baseUrl}/api/strapi-cache`;
  const secret = process.env.STRAPI_WEBHOOK_SECRET?.trim();

  if (!isLocalhost(baseUrl) && !remote) {
    console.error(
      `Refusing to POST ${endpoint} without --remote (avoids sending STRAPI_WEBHOOK_SECRET to the wrong host).`,
    );
    process.exit(1);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, { method: 'POST', headers });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `Could not reach ${endpoint}. Start the site first (bun run dev), then retry.\n${reason}`,
    );
    process.exit(1);
  }

  const body = await response.text();
  if (!response.ok) {
    console.error(`Purge failed (${response.status}): ${body}`);
    process.exit(1);
  }

  console.log(`Purged Strapi cache at ${endpoint}`);
  console.log(body);
}

await main();

export {};
