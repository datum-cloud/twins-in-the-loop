import type { APIRoute } from 'astro';
import { composeOgImage } from '../../lib/ogImage';
import { fetchPostBySlug } from '../../lib/strapi/posts';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const post = await fetchPostBySlug(slug);
  if (!post?.data.cover) {
    return new Response('Not found', { status: 404 });
  }

  const response = await fetch(post.data.cover.src);
  if (!response.ok) {
    return new Response('Cover unavailable', { status: 502 });
  }

  const cover = Buffer.from(await response.arrayBuffer());
  const body = await composeOgImage({ cover });

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
