/** sRGB channels from 0 to 1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Lightness from 0 to 1, chroma from 0 to about 0.4, hue in degrees. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/**
 * Parse `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()`.
 * Returns `null` for anything else.
 */
export function parseColor(value: string): Rgba | null;

/** Format as `#rrggbb`, or `#rrggbbaa` when translucent. */
export function formatHex(color: Rgba): string;

export function toOklch(color: Rgba): Oklch;

/**
 * Convert to sRGB. A color outside the gamut loses chroma, not lightness or
 * hue, until it fits.
 */
export function fromOklch(color: Oklch): Rgba;

/** Distance in OKLab scaled by 100. About 2 is the smallest visible difference. */
export function deltaE(a: Rgba, b: Rgba): number;

/** Put a translucent color over an opaque one. */
export function composite(top: Rgba, bottom: Rgba): Rgba;

/** WCAG 2 relative luminance. */
export function luminance(color: Rgba): number;

/** WCAG 2 contrast ratio, from 1 to 21. */
export function contrast(fg: Rgba, bg: Rgba): number;

/** APCA-W3 0.0.98G lightness contrast Lc of text on a background. */
export function apca(fg: Rgba, bg: Rgba): number;
