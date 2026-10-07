import type { Plugin } from 'unified';

const SAME_TAB_HOSTS = ['datum.net', 'twins-in-the-loop.com'] as const;

interface HastProperties {
  href?: unknown;
  target?: unknown;
  rel?: unknown;
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: HastProperties;
  children?: HastNode[];
}

/**
 * Absolute http(s) links leave the tab unless they stay on Datum or this site.
 * Relative, hash, and non-http links (mailto, tel) stay in the current tab.
 */
export function opensInNewTab(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  return !SAME_TAB_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

function relTokens(rel: unknown): Set<string> {
  if (Array.isArray(rel)) {
    return new Set(rel.filter((token) => typeof token === 'string'));
  }
  if (typeof rel === 'string') {
    return new Set(rel.split(/\s+/).filter(Boolean));
  }
  return new Set();
}

function markAnchor(node: HastNode): void {
  const href = node.properties?.href;
  if (typeof href !== 'string' || !opensInNewTab(href)) return;

  const properties = node.properties ?? {};
  node.properties = properties;
  if (properties.target == null || properties.target === '') {
    properties.target = '_blank';
  }

  const rel = relTokens(properties.rel);
  rel.add('noopener');
  rel.add('noreferrer');
  properties.rel = [...rel].join(' ');
}

function walk(node: HastNode, insidePre: boolean): void {
  for (const child of node.children ?? []) {
    const childIsPre = child.type === 'element' && child.tagName === 'pre';
    if (!insidePre && child.type === 'element' && child.tagName === 'a') {
      markAnchor(child);
    }
    walk(child, insidePre || childIsPre);
  }
}

/** Opens off-site anchors in a new tab. Skips links inside code blocks. */
export const markExternalLinks: Plugin = () => {
  return (tree) => {
    walk(tree as HastNode, false);
  };
};
