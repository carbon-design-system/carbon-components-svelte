/**
 * Parse a `#rgb` or `#rrggbb` color into channels from 0 to 1. Returns
 * `null` for any other value, including colors with alpha.
 */
export function parseHex(color: string): [number, number, number] | null;

/** Format channels from 0 to 1 as a lowercase `#rrggbb` color. */
export function toHex(rgb: [number, number, number]): string;

/** WCAG relative luminance of sRGB channels from 0 to 1. */
export function relativeLuminance(rgb: [number, number, number]): number;

/**
 * WCAG contrast ratio of two hex colors, from 1 to 21. Returns `null` when
 * either color is not `#rgb` or `#rrggbb`.
 */
export function contrastRatio(a: string, b: string): number | null;

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
