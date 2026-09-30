import { describe, expect, it } from 'vitest';
import { llmsTxt } from './llmsTxt';

describe('llmsTxt', () => {
  const output = llmsTxt({
    title: 'Twins in the Loop',
    description: 'A blog\nby twins',
    siteUrl: 'https://twinsintheloop.com/',
    posts: [
      {
        title: 'A post',
        description: 'About a post',
        url: 'https://twinsintheloop.com/a-post',
      },
    ],
  });

  it('starts with an H1 and a single-line summary', () => {
    expect(
      output.startsWith('# Twins in the Loop\n\n> A blog by twins\n'),
    ).toBe(true);
  });

  it('lists pages and articles as markdown links', () => {
    expect(output).toContain('[About](https://twinsintheloop.com/about)');
    expect(output).toContain('[RSS feed](https://twinsintheloop.com/rss.xml)');
    expect(output).toContain(
      '- [A post](https://twinsintheloop.com/a-post): About a post',
    );
  });
});
