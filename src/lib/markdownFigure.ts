type FigureAlign = 'left' | 'center' | 'right';

const figurePattern = /!\[([^\]|]*?)(?:\|(\w+))?\]\(([^)]+)\)/g;

/**
 * Same image syntax as the datum.net blog: `![caption](url)` and
 * `![caption|left](url)` / `|center` / `|right`. The caption is the alt text
 * shown under the image.
 */
export function transformMarkdownFigures(markdown: string): string {
  if (!markdown) return markdown;

  return markdown
    .split(/(```[\s\S]*?```)/g)
    .map((part) => (part.startsWith('```') ? part : replaceFigures(part)))
    .join('');
}

function replaceFigures(markdown: string): string {
  return markdown.replace(figurePattern, (_match, caption, align, url) => {
    const alignment = normalizeAlign(align);
    const trimmedCaption = String(caption ?? '').trim();
    const img = `<img src="${escapeHtml(String(url).trim())}" alt="${escapeHtml(trimmedCaption)}" />`;
    const figcaption = trimmedCaption
      ? `<figcaption>${escapeHtml(trimmedCaption)}</figcaption>`
      : '';

    return `<figure data-align="${alignment}">${img}${figcaption}</figure>`;
  });
}

function normalizeAlign(align: string | undefined): FigureAlign {
  if (align === 'left' || align === 'center' || align === 'right') return align;
  return 'center';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
