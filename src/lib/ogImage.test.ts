import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  OG_FRAME_PATH,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  composeOgImage,
  localImageFsPath,
} from './ogImage';

function rgb(buffer: Buffer, x: number, y: number): [number, number, number] {
  const index = (y * OG_IMAGE_WIDTH + x) * 3;
  return [buffer[index], buffer[index + 1], buffer[index + 2]];
}

function isClose(
  actual: [number, number, number],
  expected: [number, number, number],
  tolerance = 24,
): boolean {
  return actual.every(
    (channel, index) => Math.abs(channel - expected[index]) <= tolerance,
  );
}

describe('composeOgImage', () => {
  it('covers the canvas with the photo and overlays the brand frame', async () => {
    const cover = await sharp({
      create: {
        width: 400,
        height: 200,
        channels: 3,
        background: { r: 220, g: 40, b: 40 },
      },
    })
      .png()
      .toBuffer();

    const jpeg = await composeOgImage({ cover });
    const image = sharp(jpeg);
    const metadata = await image.metadata();

    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(OG_IMAGE_WIDTH);
    expect(metadata.height).toBe(OG_IMAGE_HEIGHT);

    const raw = await image.removeAlpha().raw().toBuffer();
    expect(isClose(rgb(raw, 600, 40), [220, 40, 40])).toBe(true);
    expect(isClose(rgb(raw, 600, 650), [12, 29, 49])).toBe(true);
  });

  it('reads the default frame from the covers asset', () => {
    expect(OG_FRAME_PATH).toBe(
      path.join(process.cwd(), 'src/assets/covers/frame.png'),
    );
  });
});

describe('localImageFsPath', () => {
  it('reads the hidden fsPath from an Astro image', () => {
    const image = { src: '/covers/post.png' };
    Object.defineProperty(image, 'fsPath', {
      enumerable: false,
      value: '/tmp/post.png',
    });

    expect(localImageFsPath(image)).toBe('/tmp/post.png');
  });

  it('throws when the filesystem path is missing', () => {
    expect(() => localImageFsPath({ src: '/covers/post.png' })).toThrow(
      'Missing filesystem path for image /covers/post.png',
    );
  });
});
