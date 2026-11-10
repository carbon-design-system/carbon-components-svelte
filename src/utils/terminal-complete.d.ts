/**
 * A completion function returns the candidates for the word at the cursor, or
 * an object that also says which part of the line they replace.
 */
export type TerminalCompletion =
  string[] | { candidates: string[]; from?: number; to?: number };

/** Where the word at the cursor starts. */
export function wordStart(value: string, cursor: number): number;

/** The longest string every candidate starts with. */
export function commonPrefix(candidates: string[]): string;

/**
 * Apply a completion to a line. One candidate replaces the word. Several
 * extend it to what they share; when that adds nothing, the line is left
 * alone and `list` holds the candidates to show.
 */
export function applyCompletion(
  value: string,
  cursor: number,
  result: TerminalCompletion | null | undefined,
): { value: string; cursor: number; list: string[] };
