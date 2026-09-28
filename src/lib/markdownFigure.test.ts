import { describe, expect, it } from 'vitest';
import { transformMarkdownFigures } from './markdownFigure';

describe('transformMarkdownFigures', () => {
  it('turns a captioned image into a centered figure', () => {
    expect(
      transformMarkdownFigures('![Baby twins](https://cdn.example/a.jpg)'),
    ).toBe(
      '<figure data-align="center"><img src="https://cdn.example/a.jpg" alt="Baby twins" /><figcaption>Baby twins</figcaption></figure>',
    );
  });

  it('floats left and right when the caption sets an alignment', () => {
    expect(
      transformMarkdownFigures('![Books|right](https://cdn.example/b.png)'),
    ).toContain('data-align="right"');
    expect(
      transformMarkdownFigures('![|left](https://cdn.example/c.png)'),
    ).toBe(
      '<figure data-align="left"><img src="https://cdn.example/c.png" alt="" /></figure>',
    );
  });

  it('falls back to center for an unknown alignment', () => {
    expect(
      transformMarkdownFigures('![Shot|wide](https://cdn.example/d.jpg)'),
    ).toContain('data-align="center"');
  });

  it('escapes caption and url text', () => {
    expect(
      transformMarkdownFigures(
        '![A & B "quote"](https://cdn.example/a.jpg?q="1")',
      ),
    ).toContain('alt="A &amp; B &quot;quote&quot;"');
  });

  it('leaves image syntax inside fenced code alone', () => {
    const source = '```md\n![not a figure](https://cdn.example/a.jpg)\n```';
    expect(transformMarkdownFigures(source)).toBe(source);
  });
});
