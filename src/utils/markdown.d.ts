/** A run of text with the same formatting. */
export interface MarkdownRun {
  text: string;
  strong?: true;
  em?: true;
  del?: true;
  code?: true;
  /** A line break; `text` is a newline. */
  br?: true;
  /** A link target that passed the scheme check. */
  href?: string;
}

export interface MarkdownListItem {
  /** The item's first paragraph. */
  runs: MarkdownRun[];
  /** Anything after it, such as a nested list. */
  children: MarkdownBlock[];
  /** A task item (`[ ]` or `[x]`): whether it is checked. Absent for any other item. */
  checked?: boolean;
}

export type MarkdownAlign = "left" | "center" | "right" | null;

export type MarkdownBlock =
  | { id: number; type: "paragraph"; runs: MarkdownRun[] }
  | { id: number; type: "heading"; level: number; runs: MarkdownRun[] }
  | {
      id: number;
      type: "code";
      lang: string;
      text: string;
      /** `false` while the closing fence hasn't arrived. */
      closed: boolean;
    }
  | { id: number; type: "quote"; blocks: MarkdownBlock[] }
  | {
      id: number;
      type: "list";
      ordered: boolean;
      start: number;
      items: MarkdownListItem[];
    }
  | {
      id: number;
      type: "table";
      align: MarkdownAlign[];
      head: MarkdownRun[][];
      rows: MarkdownRun[][][];
    }
  | { id: number; type: "rule" };

export interface MarkdownOptions {
  /** Link schemes, with the colon. Default `http:`, `https:`, `mailto:`. */
  schemes?: ReadonlyArray<string>;
  /**
   * Close an unfinished `**`, `*`, `~~` or backtick at the end of the text,
   * so formatting doesn't flicker as it arrives.
   */
  streaming?: boolean;
}

/** How `Markdown` draws its blocks. */
export interface DrawOptions {
  highlight:
    | ((
        code: string,
        lang: string,
      ) => ReadonlyArray<{ type: string | null; text: string }> | undefined)
    | undefined;
  copyable: boolean;
  copyLabel: string;
  codeLabel: (lang: string) => string;
  tableLabel: string;
  target: string;
  headingLevel: number;
}

/**
 * Parse Markdown to blocks of flat runs. It returns data, never HTML, so
 * nothing in the input reaches the page as markup. Raw HTML is text, images
 * become links, and only the allowed schemes link. A top-level block's `id`
 * is the offset where it starts.
 */
export function parseMarkdown(
  source: string,
  options?: MarkdownOptions,
): MarkdownBlock[];

/** Parse one block's inline Markdown into runs. */
export function parseInline(
  text: string,
  options?: MarkdownOptions,
): MarkdownRun[];

/**
 * Resolve a link destination to a URL that is safe for `href`, or
 * `undefined`. `safeUrl` reads it as a browser does, so `java\tscript:` is
 * caught. Relative destinations are dropped.
 */
export function safeHref(
  raw: string,
  schemes?: ReadonlyArray<string>,
): string | undefined;

/**
 * A parser for text that grows. Call `parse` with the whole text each time;
 * only the last block is parsed again, and the blocks before it are the
 * same objects the last call returned. Text that doesn't extend the last
 * call's text starts over. `frozen` is how many leading blocks are final.
 */
export function createMarkdownParser(defaults?: MarkdownOptions): {
  parse: (
    source: string,
    streaming?: boolean,
  ) => { blocks: MarkdownBlock[]; frozen: number };
  reset: () => void;
};

export const DEFAULT_SCHEMES: ReadonlyArray<string>;
