import path from 'node:path';
import sharp from 'sharp';

/** Matches `public/images/og-news.jpg` (16:9). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 675;
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

export async function composeOgImage({
  cover,
  frame = OG_FRAME_PATH,
}: ComposeOgImageInput): Promise<Buffer> {
  const overlay = await sharp(frame)
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();

  return sharp(cover)
    .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .composite([{ input: overlay, blend: 'over' }])
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
