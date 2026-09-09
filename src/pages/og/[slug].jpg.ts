import type { APIRoute, GetStaticPaths, ImageMetadata } from 'astro';
import { getPublishedPosts } from '../../lib/content';
import { composeOgImage, localImageFsPath } from '../../lib/ogImage';

interface Props {
  cover: ImageMetadata;
}

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();

  return posts.flatMap((post) => {
    if (!post.data.cover) {
      return [];
    }

    return [
      {
        params: { slug: post.id },
        props: { cover: post.data.cover },
      },
    ];
  });
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { cover } = props as Props;
  const body = await composeOgImage({ cover: localImageFsPath(cover) });

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
