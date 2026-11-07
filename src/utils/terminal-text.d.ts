/**
 * A color: `0` to `15` is a position in the 16-color palette, which the
 * stylesheet themes. A `#rrggbb` string is a 256-color or truecolor value.
 * `"text"` and `"background"` are the page's own colors, which reverse video
 * swaps in for a color that was never set.
 */
export type AnsiColor = number | string;

/** The SGR attributes in effect. An absent field is the terminal default. */
export type AnsiStyle = {
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

export type TerminalRun = {
  text: string;
  /** Reverse video is already applied. */
  style: AnsiStyle;
};

/** One row of the scrollback. */
export type TerminalRow = {
  /**
   * A position in the stream. It counts up for the life of the buffer, so it
   * stays the same when older rows are dropped.
   */
  id: number;
  kind: "output" | "command";
  /** The row as plain text. */
  text: string;
  /** The styled runs, or `null` when the whole row is in the default style. */
  runs: TerminalRun[] | null;
  /** Whether the row was cut at `maxLineLength`. */
  truncated?: boolean;
  /** The prompt of a command row. */
  prompt?: string;
  /** The command of a command row. */
  command?: string;
};

export interface TerminalBuffer {
  /** Add text to the stream. Accepts any string and never throws. */
  write(chunk: string): void;
  /**
   * Add a row for a command that was run, starting a new row first if one is
   * open.
   */
  echo(prompt: string, command: string): void;
  /** The rows, with the row still being written last. A new array each call. */
  view(): TerminalRow[];
  /** Drop the oldest rows past `maxLines`. Returns how many were dropped. */
  trim(): number;
  /** The rows from `id` on, with the row still being written last. */
  since(id: number): TerminalRow[];
  /** Remove every row. */
  clear(): void;
  /** The scrollback as plain text. */
  getText(): string;
  /** The id the next row gets. */
  nextId(): number;
  /** How many rows there are, including the open one. */
  size(): number;
  /** Whether text has been written since the last newline. */
  hasOpenRow(): boolean;
  /** Rows kept. It can be changed at any time. */
  maxLines: number;
}

/**
 * Remove control characters, and the bidi formatting characters that can
 * disguise text, from a string. Escape sequences are not interpreted.
 */
export function stripControls(text: string): string;

/** Create a buffer that reads command output into rows. */
export function createTerminalBuffer(options?: {
  maxLines?: number;
  maxLineLength?: number;
  tabSize?: number;
}): TerminalBuffer;
