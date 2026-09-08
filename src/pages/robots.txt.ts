import type { APIRoute } from 'astro';
import { isSiteIndexable, robotsTxt } from '../lib/siteEnv';

export const GET: APIRoute = ({ site }) => {
  return new Response(robotsTxt({ indexable: isSiteIndexable(), site }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
