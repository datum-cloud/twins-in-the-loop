import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/** Matches `public/images/og-news.jpg` (16:9). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 675;
export const OG_IMAGE_QUALITY = 90;

export const OG_FRAME_PATH = fileURLToPath(
  new URL('../assets/covers/frame.png', import.meta.url),
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
