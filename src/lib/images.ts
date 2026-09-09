export const OPTIMIZED_IMAGE_FORMAT = 'webp' as const;
export const OPTIMIZED_IMAGE_QUALITY = 80;

export const CARD_THUMBNAIL_WIDTHS = [400, 640, 800, 1200] as const;
export const CARD_THUMBNAIL_SIZES =
  '(min-width: 1680px) 800px, (min-width: 768px) 45vw, 100vw';

export const ARTICLE_COVER_WIDTHS = [640, 960, 1280, 1600] as const;
export const ARTICLE_COVER_SIZES =
  '(min-width: 1680px) 960px, (min-width: 1024px) 66vw, 100vw';

export const LOGO_IMAGE_FORMAT = 'png' as const;
export const LOGO_WIDE_WIDTHS = [400, 640, 868, 1200, 1736] as const;
export const LOGO_WIDE_SIZES = '(min-width: 868px) 868px, 92vw';
export const LOGO_STACKED_WIDTHS = [140, 270] as const;
export const LOGO_STACKED_SIZES = '140px';

export function responsiveImageWidths(
  sourceWidth: number,
  candidates: readonly number[],
): number[] {
  const maxWidth = Math.max(...candidates);
  const widths: number[] = candidates.filter((width) => width < sourceWidth);
  widths.push(Math.min(sourceWidth, maxWidth));
  return [...new Set(widths)];
}

export function thumbnailWidths(sourceWidth: number): number[] {
  return responsiveImageWidths(sourceWidth, CARD_THUMBNAIL_WIDTHS);
}

export function articleCoverWidths(sourceWidth: number): number[] {
  return responsiveImageWidths(sourceWidth, ARTICLE_COVER_WIDTHS);
}

export function logoWideWidths(sourceWidth: number): number[] {
  return responsiveImageWidths(sourceWidth, LOGO_WIDE_WIDTHS);
}

export function logoStackedWidths(sourceWidth: number): number[] {
  return responsiveImageWidths(sourceWidth, LOGO_STACKED_WIDTHS);
}
