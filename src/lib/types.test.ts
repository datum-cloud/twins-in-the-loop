import { describe, expect, test } from 'vitest';
import { SOCIAL_NETWORK_IDS, socialLinkLabel } from './types';

describe('socialLinkLabel', () => {
  test('names every social destination', () => {
    const labels = SOCIAL_NETWORK_IDS.map(socialLinkLabel);

    expect(labels).toEqual([
      'Datum on GitHub',
      'Datum on Discord',
      'Datum on YouTube',
      'Datum on LinkedIn',
      'Datum on X',
    ]);
  });
});
