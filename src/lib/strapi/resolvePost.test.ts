import { describe, expect, it, vi } from 'vitest';

import { resolvePublishedPost } from './resolvePost';

function io(
  overrides: Partial<
    Parameters<typeof resolvePublishedPost<{ id: string }>>[1]
  > = {},
) {
  return {
    loadCachedPosts: vi.fn(async () => [{ id: 'old-slug' }]),
    loadPostBySlug: vi.fn(async () => null),
    refreshPosts: vi.fn(async () => [{ id: 'birthday-blog' }]),
    ...overrides,
  };
}

describe('resolvePublishedPost', () => {
  it('returns the cached list hit without calling origin', async () => {
    const deps = io();
    const result = await resolvePublishedPost('old-slug', deps);

    expect(result.post?.id).toBe('old-slug');
    expect(deps.loadPostBySlug).not.toHaveBeenCalled();
    expect(deps.refreshPosts).not.toHaveBeenCalled();
  });

  it('loads a renamed slug from origin and replaces the stale list', async () => {
    const deps = io({
      loadPostBySlug: vi.fn(async () => ({ id: 'birthday-blog' })),
    });

    const result = await resolvePublishedPost('birthday-blog', deps);

    expect(result.post?.id).toBe('birthday-blog');
    expect(result.posts.map((entry) => entry.id)).toEqual(['birthday-blog']);
    expect(deps.refreshPosts).toHaveBeenCalledOnce();
  });

  it('keeps the cached list when origin has no such slug', async () => {
    const deps = io();
    const result = await resolvePublishedPost('missing', deps);

    expect(result.post).toBeNull();
    expect(result.posts.map((entry) => entry.id)).toEqual(['old-slug']);
    expect(deps.refreshPosts).not.toHaveBeenCalled();
  });

  it('still returns the origin post when the list refresh fails', async () => {
    const deps = io({
      loadPostBySlug: vi.fn(async () => ({ id: 'birthday-blog' })),
      refreshPosts: vi.fn(async () => null),
    });

    const result = await resolvePublishedPost('birthday-blog', deps);

    expect(result.post?.id).toBe('birthday-blog');
    expect(result.posts.map((entry) => entry.id)).toEqual([
      'birthday-blog',
      'old-slug',
    ]);
  });
});
