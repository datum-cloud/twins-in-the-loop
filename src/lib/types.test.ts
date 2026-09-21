import { describe, expect, test } from 'vitest';
import {
  CONTENT_TYPES,
  SOCIAL_NETWORK_IDS,
  relatedHeading,
  socialLinkLabel,
} from './types';

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

describe('relatedHeading', () => {
  test('names the follow-on list for every content type', () => {
    expect(CONTENT_TYPES.map(relatedHeading)).toEqual([
      'More articles:',
      'More musings:',
      'More videos:',
      'More episodes:',
    ]);
  });
});
