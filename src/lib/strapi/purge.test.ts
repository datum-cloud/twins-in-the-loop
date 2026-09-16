import {
  CacheManager,
  MemoryCacheDriver,
} from '@datum-cloud/strapi-revalidate';
import { describe, expect, it } from 'vitest';

import { purgeStrapiCaches } from './purge';

const TAG = 'twins-posts';
const LIST_KEY = 'twins-posts-list';
const POST_KEY = 'twins-post-old';

describe('purgeStrapiCaches', () => {
  it('expires tagged primary keys and wipes the fallback store', async () => {
    const primary = new MemoryCacheDriver();
    const fallback = new MemoryCacheDriver();
    const manager = new CacheManager({ primary, fallback });

    await manager.set(LIST_KEY, [{ slug: 'old' }], { tags: [TAG] });
    await manager.set(POST_KEY, { title: 'Old' }, { tags: [TAG] });

    expect(await manager.get(LIST_KEY)).not.toBeNull();
    expect(await manager.getFallback(LIST_KEY)).not.toBeNull();

    await purgeStrapiCaches(
      {
        invalidate: (tag) => manager.invalidate(tag),
        clearFallback: () => fallback.clear(),
      },
      TAG,
    );

    expect(await manager.get(LIST_KEY)).toBeNull();
    expect(await manager.get(POST_KEY)).toBeNull();
    expect(await manager.getFallback(LIST_KEY)).toBeNull();
    expect(await manager.getFallback(POST_KEY)).toBeNull();
  });
});
