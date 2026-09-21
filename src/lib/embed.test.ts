import { describe, expect, it } from 'vitest';
import { parseEmbedUrl } from './embed';

describe('parseEmbedUrl', () => {
  it('has nothing to render without a URL', () => {
    expect(parseEmbedUrl(undefined)).toBeUndefined();
    expect(parseEmbedUrl('')).toBeUndefined();
    expect(parseEmbedUrl('not a url')).toBeUndefined();
  });

  // Editors paste whichever YouTube URL the share sheet handed them.
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
  ])('turns %s into a cookieless YouTube embed', (url) => {
    expect(parseEmbedUrl(url)).toEqual({
      kind: 'iframe',
      provider: 'youtube',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      shape: 'video',
    });
  });

  it('keeps extra YouTube params out of the embed src', () => {
    expect(
      parseEmbedUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PL1',
      ),
    ).toMatchObject({
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
  });

  it('falls back to a link when a YouTube URL has no video id', () => {
    expect(parseEmbedUrl('https://www.youtube.com/@datumcloud')).toEqual({
      kind: 'external',
      href: 'https://www.youtube.com/@datumcloud',
      hostLabel: 'youtube.com',
    });
  });

  it('builds a Vimeo player URL', () => {
    expect(parseEmbedUrl('https://vimeo.com/76979871')).toEqual({
      kind: 'iframe',
      provider: 'vimeo',
      src: 'https://player.vimeo.com/video/76979871',
      shape: 'video',
    });
  });

  it('builds a compact Spotify player', () => {
    expect(
      parseEmbedUrl('https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk'),
    ).toEqual({
      kind: 'iframe',
      provider: 'spotify',
      src: 'https://open.spotify.com/embed/episode/4rOoJ6Egrf8K2IrywzwOMk',
      shape: 'compact',
    });
  });

  it('handles locale-prefixed and already-embedded Spotify URLs', () => {
    expect(
      parseEmbedUrl(
        'https://open.spotify.com/intl-de/show/4rOoJ6Egrf8K2IrywzwOMk',
      ),
    ).toMatchObject({
      src: 'https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk',
    });
    expect(
      parseEmbedUrl(
        'https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk',
      ),
    ).toMatchObject({
      src: 'https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk',
    });
  });

  it('swaps the Apple Podcasts host for its embed host and keeps the episode id', () => {
    expect(
      parseEmbedUrl(
        'https://podcasts.apple.com/us/podcast/the-show/id1234567890?i=1000123456789',
      ),
    ).toEqual({
      kind: 'iframe',
      provider: 'apple-podcasts',
      src: 'https://embed.podcasts.apple.com/us/podcast/the-show/id1234567890?i=1000123456789',
      shape: 'compact',
    });
  });

  it.each(['.mp3', '.m4a', '.ogg', '.wav'])(
    'plays a %s file natively',
    (extension) => {
      const url = `https://cdn.example.com/episodes/ep-1${extension}`;
      expect(parseEmbedUrl(url)).toEqual({ kind: 'audio', src: url });
    },
  );

  it('links out instead of iframing an unknown host', () => {
    expect(parseEmbedUrl('https://www.twitch.tv/videos/12345')).toEqual({
      kind: 'external',
      href: 'https://www.twitch.tv/videos/12345',
      hostLabel: 'twitch.tv',
    });
  });

  it('refuses non-http protocols', () => {
    expect(parseEmbedUrl('javascript:alert(1)')).toBeUndefined();
  });
});
