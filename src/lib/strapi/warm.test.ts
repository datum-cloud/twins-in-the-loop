import type { WebhookEvent } from '@datum-cloud/strapi-revalidate';
import { describe, expect, it, vi } from 'vitest';

import { warmAfterRevalidate } from './warm';

const publish: WebhookEvent = {
  event: 'entry.publish',
  model: 'twins-post',
  uid: 'api::twins-post.twins-post',
  entryId: '1',
  slug: 'on-device-ai',
  tags: ['twins-posts'],
};

function io(
  overrides: Partial<Parameters<typeof warmAfterRevalidate>[1]> = {},
) {
  return {
    loadPostList: vi.fn(async () => [{ slug: 'on-device-ai' }]),
    loadPostBySlug: vi.fn(async () => ({ id: 'on-device-ai' })),
    deleteFallback: vi.fn(async () => undefined),
    postKey: (slug: string) => `twins-post-${slug}`,
    ...overrides,
  };
}

describe('warmAfterRevalidate', () => {
  it('succeeds from the fetch result without requiring a later cache hit', async () => {
    const deps = io();
    await expect(warmAfterRevalidate(publish, deps)).resolves.toBeUndefined();
    expect(deps.loadPostList).toHaveBeenCalledOnce();
    expect(deps.loadPostBySlug).toHaveBeenCalledWith('on-device-ai');
    expect(deps.deleteFallback).not.toHaveBeenCalled();
  });

  it('throws when the post list fetch failed (null), not on an empty list', async () => {
    await expect(
      warmAfterRevalidate(publish, io({ loadPostList: async () => null })),
    ).rejects.toThrow(/could not fetch twins-posts/);

    await expect(
      warmAfterRevalidate(publish, io({ loadPostList: async () => [] })),
    ).resolves.toBeUndefined();
  });

  it('drops fallback on unpublish and skips slug re-warm', async () => {
    const deps = io();
    await warmAfterRevalidate({ ...publish, event: 'entry.unpublish' }, deps);
    expect(deps.deleteFallback).toHaveBeenCalledWith('twins-post-on-device-ai');
    expect(deps.loadPostBySlug).not.toHaveBeenCalled();
  });

  it('skips slug load when the event has no slug', async () => {
    const deps = io();
    await warmAfterRevalidate({ ...publish, slug: undefined }, deps);
    expect(deps.loadPostBySlug).not.toHaveBeenCalled();
    expect(deps.deleteFallback).not.toHaveBeenCalled();
  });
});
