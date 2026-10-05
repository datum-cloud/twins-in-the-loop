import type { WebhookEvent } from '@datum-cloud/strapi-revalidate';
import { describe, expect, it, vi } from 'vitest';

import { dropCachedContent } from './warm';

const publish: WebhookEvent = {
  event: 'entry.publish',
  model: 'twins-post',
  uid: 'api::twins-post.twins-post',
  entryId: '1',
  slug: 'on-device-ai',
  tags: ['twins-posts'],
};

function io(overrides: Partial<Parameters<typeof dropCachedContent>[1]> = {}) {
  return {
    deleteKey: vi.fn(async () => undefined),
    deleteFallback: vi.fn(async () => undefined),
    listKeys: ['twins-posts-list', 'twins-topics-list'],
    postKey: (slug: string) => `twins-post-${slug}`,
    ...overrides,
  };
}

describe('dropCachedContent', () => {
  it('deletes list keys and the slug key without writing them back', async () => {
    const deps = io();
    await dropCachedContent(publish, deps);
    expect(deps.deleteKey).toHaveBeenCalledWith('twins-posts-list');
    expect(deps.deleteKey).toHaveBeenCalledWith('twins-topics-list');
    expect(deps.deleteKey).toHaveBeenCalledWith('twins-post-on-device-ai');
    expect(deps.deleteFallback).not.toHaveBeenCalled();
  });

  it('drops the slug fallback on unpublish so a failed refetch cannot restore it', async () => {
    const deps = io();
    await dropCachedContent({ ...publish, event: 'entry.unpublish' }, deps);
    expect(deps.deleteKey).toHaveBeenCalledWith('twins-post-on-device-ai');
    expect(deps.deleteFallback).toHaveBeenCalledWith('twins-post-on-device-ai');
  });

  it('still deletes list keys when the event has no slug', async () => {
    const deps = io();
    await dropCachedContent({ ...publish, slug: undefined }, deps);
    expect(deps.deleteKey).toHaveBeenCalledWith('twins-posts-list');
    expect(deps.deleteKey).toHaveBeenCalledWith('twins-topics-list');
    expect(deps.deleteFallback).not.toHaveBeenCalled();
  });
});
