import path from 'node:path';
import sharp from 'sharp';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from './seo';

export { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH };

/** JPEG quality for the composed LinkedIn card. */
export const OG_IMAGE_QUALITY = 90;

/** Resolve from the repo root. `import.meta.url` breaks after Astro prerender relocates this module. */
export const OG_FRAME_PATH = path.join(
  process.cwd(),
  'src/assets/covers/frame.png',
);

export interface ComposeOgImageInput {
  cover: string | Buffer;
  frame?: string | Buffer;
}

async function linkedInFrame(frame: string | Buffer): Promise<Buffer> {
  const metadata = await sharp(frame).metadata();
  const sourceWidth = metadata.width ?? OG_IMAGE_WIDTH;
  const sourceHeight = metadata.height ?? OG_IMAGE_HEIGHT;
  const scaledHeight = Math.round(
    (OG_IMAGE_WIDTH * sourceHeight) / sourceWidth,
  );
  const resized = sharp(frame).resize(OG_IMAGE_WIDTH, scaledHeight, {
    fit: 'fill',
  });
  // The brand bar sits on the bottom of the 16:9 frame. Keep that edge and
  // trim the transparent top so the bar is not squashed on the shorter card.
  const overlay =
    scaledHeight > OG_IMAGE_HEIGHT
      ? resized.extract({
          left: 0,
          top: scaledHeight - OG_IMAGE_HEIGHT,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
        })
      : resized;

  return overlay.png().toBuffer();
}

export async function composeOgImage({
  cover,
  frame = OG_FRAME_PATH,
}: ComposeOgImageInput): Promise<Buffer> {
  const overlay = await linkedInFrame(frame);

  return sharp(cover)
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .composite([{ input: overlay, gravity: 'south', blend: 'over' }])
    .jpeg({ quality: OG_IMAGE_QUALITY, mozjpeg: true })
    .toBuffer();
}

export function localImageFsPath(image: { src: string }): string {
  const fsPath = (image as { fsPath?: string }).fsPath;
  if (!fsPath) {
    throw new Error(`Missing filesystem path for image ${image.src}`);
  }

  return fsPath;
}
