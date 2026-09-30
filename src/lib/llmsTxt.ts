export interface LlmsTxtPost {
  title: string;
  description: string;
  url: string;
}

export interface LlmsTxtInput {
  title: string;
  description: string;
  siteUrl: string;
  posts: LlmsTxtPost[];
}

/** Single-line link text; newlines would break the markdown list. */
function inline(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** https://llmstxt.org — H1, blockquote summary, then H2 link lists. */
export function llmsTxt(input: LlmsTxtInput): string {
  const about = new URL('about', input.siteUrl).toString();
  const feed = new URL('rss.xml', input.siteUrl).toString();
  const posts = input.posts.map(
    (post) =>
      `- [${inline(post.title)}](${post.url}): ${inline(post.description)}`,
  );

  return [
    `# ${inline(input.title)}`,
    `> ${inline(input.description)}`,
    '## Pages',
    `- [Home](${input.siteUrl}): Every article, newest first\n- [About](${about}): Why the blog exists and who writes it\n- [RSS feed](${feed}): Machine-readable list of articles`,
    '## Articles',
    posts.join('\n'),
    '',
  ].join('\n\n');
}
