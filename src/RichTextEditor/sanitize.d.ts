export interface SanitizeOptions {
  /** Keep a space at the start and end of each block, so a fragment pasted into a line keeps the space that separates it from its neighbors. Default `false`. */
  edges?: boolean;
  /** URL schemes a link may use. Default `["http", "https", "mailto", "tel"]`. Links with no scheme are always kept. */
  protocols?: readonly string[];
}

/**
 * Rebuild `html` in the RichTextEditor schema: `p`, `h2`, `h3`, `blockquote`,
 * `ul`, `ol`, `li`, `br`, `strong`, `em`, `u`, `s`, `code` and `a[href]`, with
 * every piece of text escaped. A document with no text is `""`. Works on the
 * server, with no DOM.
 */
export function sanitizeHtml(
  html: string | null | undefined,
  options?: SanitizeOptions,
): string;

/** Whether `html` has no text, only empty paragraphs. */
export function isEmptyHtml(html: string | null | undefined): boolean;

/** The text of `html`, a line per block. */
export function htmlToText(html: string | null | undefined): string;

/** Turn plain text into the editor's HTML: blank lines separate paragraphs. */
export function textToHtml(text: string | null | undefined): string;

/** Return `href` when it is safe to link to, otherwise `undefined`. */
export function safeHref(
  href: string | undefined,
  protocols?: readonly string[],
): string | undefined;

/** Turn what someone typed into the link dialog into an `href`. */
export function normalizeHref(input: string): string | undefined;
