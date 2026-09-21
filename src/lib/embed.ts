/**
 * `embedUrl` comes from the CMS, so it can be any URL an editor pastes. Only
 * hosts on this allowlist are turned into an iframe; everything else degrades
 * to an outbound link.
 */
export type EmbedProvider = 'youtube' | 'vimeo' | 'spotify' | 'apple-podcasts';

export type Embed =
  | {
      kind: 'iframe';
      provider: EmbedProvider;
      src: string;
      /** `video` is 16:9, `compact` is a short player strip. */
      shape: 'video' | 'compact';
    }
  | { kind: 'audio'; src: string }
  | { kind: 'external'; href: string; hostLabel: string };

const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.ogg', '.wav'] as const;

const YOUTUBE_ID = /^[\w-]{6,20}$/;

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function hostLabel(host: string): string {
  return host.replace(/^www\./, '');
}

function youtubeId(url: URL): string | undefined {
  if (hostMatches(url.hostname, 'youtu.be')) {
    return url.pathname.slice(1).split('/')[0];
  }

  const [segment, value] = url.pathname.replace(/^\//, '').split('/');
  if (segment === 'watch') {
    return url.searchParams.get('v') ?? undefined;
  }
  if (
    (segment === 'shorts' || segment === 'embed' || segment === 'live') &&
    value
  ) {
    return value;
  }

  return undefined;
}

function vimeoId(url: URL): string | undefined {
  const id = url.pathname.replace(/^\//, '').split('/')[0];
  return /^\d+$/.test(id) ? id : undefined;
}

const SPOTIFY_KINDS = ['episode', 'show', 'track', 'album', 'playlist'];

function spotifyPath(url: URL): string | undefined {
  // Paths can carry an `embed` or locale prefix: /embed/episode/x, /intl-de/show/x.
  const segments = url.pathname.replace(/^\//, '').split('/');
  const index = segments.findIndex((segment) =>
    SPOTIFY_KINDS.includes(segment),
  );
  if (index === -1) return undefined;

  const id = segments[index + 1];
  return id ? `${segments[index]}/${id}` : undefined;
}

function isAudioFile(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  return AUDIO_EXTENSIONS.some((extension) => path.endsWith(extension));
}

export function parseEmbedUrl(value: string | undefined): Embed | undefined {
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return undefined;
  }

  const host = url.hostname.toLowerCase();

  if (
    hostMatches(host, 'youtube.com') ||
    hostMatches(host, 'youtube-nocookie.com') ||
    hostMatches(host, 'youtu.be')
  ) {
    const id = youtubeId(url);
    if (id && YOUTUBE_ID.test(id)) {
      return {
        kind: 'iframe',
        provider: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${id}`,
        shape: 'video',
      };
    }
  }

  if (hostMatches(host, 'vimeo.com')) {
    const id = vimeoId(url);
    if (id) {
      return {
        kind: 'iframe',
        provider: 'vimeo',
        src: `https://player.vimeo.com/video/${id}`,
        shape: 'video',
      };
    }
  }

  if (hostMatches(host, 'spotify.com')) {
    const path = spotifyPath(url);
    if (path) {
      return {
        kind: 'iframe',
        provider: 'spotify',
        src: `https://open.spotify.com/embed/${path}`,
        shape: 'compact',
      };
    }
  }

  if (hostMatches(host, 'podcasts.apple.com')) {
    const src = new URL(url.toString());
    src.protocol = 'https:';
    src.hostname = 'embed.podcasts.apple.com';
    return {
      kind: 'iframe',
      provider: 'apple-podcasts',
      src: src.toString(),
      shape: 'compact',
    };
  }

  if (isAudioFile(url)) {
    return { kind: 'audio', src: url.toString() };
  }

  return { kind: 'external', href: url.toString(), hostLabel: hostLabel(host) };
}
