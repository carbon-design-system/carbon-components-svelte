/**
 * Whether every UTF-16 code unit in `text` is its own grapheme, so a cut at
 * any index is safe.
 */
export function isOneUnitPerGrapheme(text: string): boolean;

/** Whether `index` falls between graphemes of `text`. `0` and `text.length` do. */
export function isGraphemeBoundary(text: string, index: number): boolean;

/** Nearest grapheme boundary at or before `index`. */
export function graphemeFloor(text: string, index: number): number;

/** Nearest grapheme boundary at or after `index`. */
export function graphemeCeil(text: string, index: number): number;
