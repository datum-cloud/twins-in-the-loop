import { describe, expect, it } from 'vitest';
import {
  articleCoverWidths,
  responsiveImageWidths,
  thumbnailWidths,
} from './images';

describe('responsiveImageWidths', () => {
  it('keeps candidates below the source and caps at the largest candidate', () => {
    expect(responsiveImageWidths(1920, [400, 640, 800, 1200])).toEqual([
      400, 640, 800, 1200,
    ]);
  });

  it('includes the source width when it is smaller than the largest candidate', () => {
    expect(responsiveImageWidths(713, [400, 640, 800, 1200])).toEqual([
      400, 640, 713,
    ]);
  });

  it('does not upscale sources smaller than every candidate', () => {
    expect(responsiveImageWidths(320, [400, 640, 800, 1200])).toEqual([320]);
  });
});

describe('thumbnailWidths', () => {
  it('uses the card thumbnail candidate list', () => {
    expect(thumbnailWidths(1600)).toEqual([400, 640, 800, 1200]);
  });
});

describe('articleCoverWidths', () => {
  it('uses the article cover candidate list', () => {
    expect(articleCoverWidths(1920)).toEqual([640, 960, 1280, 1600]);
  });
});
