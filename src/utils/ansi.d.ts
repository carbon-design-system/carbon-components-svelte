/**
 * A color: `0` to `15` is a position in the 16-color palette, which the
 * stylesheet themes. A `#rrggbb` string is a 256-color or truecolor value.
 * `"text"` and `"background"` are the page's own colors, which reverse video
 * swaps in for a color that was never set.
 */
export type AnsiColor = number | string;

/** The SGR attributes in effect. An absent field is the terminal default. */
export interface AnsiStyle {
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  inverse?: boolean;
}

export interface AnsiRun {
  text: string;
  /**
   * The run's style, with reverse video already applied, or `null` for the
   * default style.
   */
  style: AnsiStyle | null;
}

/** Whether `text` may hold an escape sequence. */
export function hasAnsi(text: string): boolean;

/** `text` without its escape sequences. */
export function stripAnsi(text: string): string;

/**
 * Split `text` into runs of one style. Each line starts from the default
 * style, so a color left open on one line does not color the next.
 */
export function parseAnsi(text: string): AnsiRun[];

/**
 * Move a `#rrggbb` color toward black or white until it reads against a
 * background, as a terminal's minimum contrast ratio does. Anything that is
 * not `#rrggbb` is returned as is.
 */
export function ensureContrast(
  color: string,
  backgroundLuminance: number,
  minRatio?: number,
): string;
