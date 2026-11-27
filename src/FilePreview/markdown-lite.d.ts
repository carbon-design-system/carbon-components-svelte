export interface MarkdownRun {
  text: string;
  strong?: true;
  em?: true;
  code?: true;
  /** A link target that passed the scheme check. */
  href?: string;
}

export interface MarkdownItem {
  runs: MarkdownRun[];
  blocks: MarkdownBlock[];
}

export type MarkdownBlock =
  | { type: "paragraph"; runs: MarkdownRun[] }
  | { type: "heading"; level: number; runs: MarkdownRun[] }
  | { type: "code"; lang: string; text: string }
  | { type: "quote"; blocks: MarkdownBlock[] }
  | { type: "list"; ordered: boolean; start: number; items: MarkdownItem[] }
  | { type: "rule" };

/**
 * Parse inline Markdown to runs. Raw HTML is text, an image is its alt text,
 * and only `http`, `https` and `mailto` links link.
 */
export function parseInline(text: string): MarkdownRun[];

/**
 * Parse Markdown to blocks of data, never HTML. Runs in linear time.
 */
export function parseMarkdown(source: string, depth?: number): MarkdownBlock[];
