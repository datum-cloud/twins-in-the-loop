export const AUTHOR_IDS = ['zac', 'jacob'] as const;
export type AuthorId = (typeof AUTHOR_IDS)[number];

export const CONTENT_TYPES = ['post', 'musing', 'video', 'podcast'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const TOPIC_IDS = [
  'ai',
  'data-centers',
  'infrastructure',
  'hardware',
] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export const AUTHOR_FILTERS = ['all', 'zac', 'jacob'] as const;
export type AuthorFilter = (typeof AUTHOR_FILTERS)[number];

export const ICON_NAMES = [
  'arrow-down',
  'external-link',
  'chevron-down',
  'notepad-text',
  'circle-play',
  'message-square-quote',
  'audio-lines',
  'linkedin',
  'github',
  'x',
  'youtube',
  'discord',
  'mail',
  'share',
  'link',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

export const TOPIC_LABELS: Record<TopicId, string> = {
  ai: 'AI',
  'data-centers': 'Data Centers',
  infrastructure: 'Infrastructure',
  hardware: 'Hardware',
};

export const AUTHOR_LABELS: Record<AuthorId, string> = {
  zac: 'Zac',
  jacob: 'Jacob',
};

export const AUTHOR_FILTER_LABELS: Record<AuthorFilter, string> = {
  all: 'Zac & Jacob',
  zac: 'Zac only',
  jacob: 'Jacob only',
};

export const CONTENT_TYPE_ICONS: Record<ContentType, IconName> = {
  post: 'notepad-text',
  musing: 'message-square-quote',
  video: 'circle-play',
  podcast: 'audio-lines',
};

export const SOCIAL_NETWORK_IDS = [
  'github',
  'discord',
  'youtube',
  'linkedin',
  'x',
] as const;
export type SocialNetworkId = (typeof SOCIAL_NETWORK_IDS)[number];

export function socialLinkLabel(name: SocialNetworkId): string {
  switch (name) {
    case 'github':
      return 'Datum on GitHub';
    case 'discord':
      return 'Datum on Discord';
    case 'youtube':
      return 'Datum on YouTube';
    case 'linkedin':
      return 'Datum on LinkedIn';
    case 'x':
      return 'Datum on X';
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

export function isAuthorId(value: string): value is AuthorId {
  return (AUTHOR_IDS as readonly string[]).includes(value);
}

export function isTopicId(value: string): value is TopicId {
  return (TOPIC_IDS as readonly string[]).includes(value);
}

export function isAuthorFilter(value: string): value is AuthorFilter {
  return (AUTHOR_FILTERS as readonly string[]).includes(value);
}

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}
