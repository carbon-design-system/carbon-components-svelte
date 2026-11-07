export type SanitizeHtmlAllow = {
  /** Tags to keep. Replaces the default list of text, list, heading and link tags. */
  tags?: ReadonlyArray<string>;
  /** Attributes to keep, per tag. `*` names attributes kept on every tag. */
  attributes?: Readonly<Record<string, ReadonlyArray<string>>>;
  /** Schemes a URL attribute may hold. Default `http`, `https`, `mailto`. */
  protocols?: ReadonlyArray<string>;
  /** Let a URL attribute hold a relative URL. Default `true`. */
  allowRelative?: boolean;
  /** Input past this length is dropped. Default `1000000`. */
  maxLength?: number;
};

/** The deepest nesting kept; tags past it are unwrapped. */
export const MAX_DEPTH: number;
/** The most input read; the rest is dropped. */
export const MAX_HTML_LENGTH: number;

/**
 * Return `html` reduced to the tags and attributes in `allow`.
 *
 * It reads the string with its own tokenizer, not a DOM, and writes new
 * markup from the allowlist, so it gives the same result on the server and
 * in the browser. Comments, doctypes, `script`, `style`, `iframe`, `svg`,
 * `math`, `template`, `object` and `embed` (with their content), `on*`,
 * `style` and `srcdoc` attributes, and unknown tags are removed, and
 * `allow` cannot bring them back. A link whose `href` fails `safeUrl` loses
 * its tag and keeps its text; every kept link gets
 * `rel="noopener noreferrer nofollow"`.
 */
export function sanitizeHtml(
  html: unknown,
  options?: { allow?: SanitizeHtmlAllow },
): string;

/**
 * The text of `html`: markup removed, entities decoded, `script` and
 * `style` content dropped, and a line break at each block element. Safe to
 * render as text.
 */
export function htmlToText(
  html: unknown,
  options?: { maxLength?: number },
): string;
