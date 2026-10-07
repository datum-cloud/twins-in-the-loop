import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';

import { markExternalLinks, opensInNewTab } from './externalLinks';

describe('opensInNewTab', () => {
  it('keeps Datum and this site in the current tab', () => {
    expect(opensInNewTab('https://www.datum.net/blog')).toBe(false);
    expect(opensInNewTab('https://cms.datum.net/uploads/a.jpg')).toBe(false);
    expect(opensInNewTab('https://datum.net')).toBe(false);
    expect(opensInNewTab('https://www.twins-in-the-loop.com/about')).toBe(
      false,
    );
    expect(opensInNewTab('https://twins-in-the-loop.com/post')).toBe(false);
  });

  it('opens other http(s) hosts in a new tab', () => {
    expect(opensInNewTab('https://example.com/story')).toBe(true);
    expect(opensInNewTab('http://notdatum.net/page')).toBe(true);
    expect(opensInNewTab('https://datum.net.evil.com')).toBe(true);
  });

  it('leaves relative and non-http links alone', () => {
    expect(opensInNewTab('/about')).toBe(false);
    expect(opensInNewTab('#stay-in-the-loop')).toBe(false);
    expect(opensInNewTab('mailto:zac@datum.net')).toBe(false);
  });
});

async function render(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(markExternalLinks)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}

describe('markExternalLinks', () => {
  it('adds a new-tab target on off-site markdown and html links', async () => {
    const html = await render(
      '[Example](https://example.com) and <a href="https://nytimes.com">News</a>',
    );

    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Example</a>',
    );
    expect(html).toContain(
      '<a href="https://nytimes.com" target="_blank" rel="noopener noreferrer">News</a>',
    );
  });

  it('leaves Datum, this site, and relative links in the current tab', async () => {
    const html = await render(
      '[Datum](https://www.datum.net) [Home](https://www.twins-in-the-loop.com/about) [Here](/about)',
    );

    expect(html).toContain('<a href="https://www.datum.net">Datum</a>');
    expect(html).toContain(
      '<a href="https://www.twins-in-the-loop.com/about">Home</a>',
    );
    expect(html).toContain('<a href="/about">Here</a>');
    expect(html).not.toContain('target=');
  });

  it('does not rewrite links inside fenced code', async () => {
    const html = await render(
      '```html\n<a href="https://example.com">x</a>\n```',
    );
    expect(html).not.toContain('target="_blank"');
  });
});
