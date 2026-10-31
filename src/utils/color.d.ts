/** Red, green and blue from 0 to 255 (fractions allowed), alpha from 0 to 1. */
export type Rgba = { r: number; g: number; b: number; a: number };

/**
 * Hue in degrees from 0 to 360, saturation and value from 0 to 100, alpha
 * from 0 to 1.
 */
export type Hsva = { h: number; s: number; v: number; a: number };

/**
 * Hue in degrees from 0 to 360, saturation and lightness from 0 to 100,
 * alpha from 0 to 1.
 */
export type Hsla = { h: number; s: number; l: number; a: number };

export type ColorFormat = "hex" | "rgb" | "hsl";

/** Wrap a hue into `[0, 360)`. */
export function wrapHue(hue: number): number;

/**
 * Parse a CSS color: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`,
 * `rgba()`, `hsl()`, `hsla()` (comma or space separated, a percent or
 * number alpha) and `transparent`. Returns `null` for anything else,
 * including named colors, `var()` and the newer color spaces.
 */
export function parseColor(color: string): Rgba | null;

export function hsvaToRgba(hsva: Hsva): Rgba;

/** Convert to HSV. A gray has no hue, so `hue` (default `0`) is kept. */
export function rgbaToHsva(rgba: Rgba, hue?: number): Hsva;

export function hsvaToHsla(hsva: Hsva): Hsla;

export function hslaToHsva(hsla: Hsla): Hsva;

export function hslaToRgba(hsla: Hsla): Rgba;

/** The channel as an integer from 0 to 255. */
export function to8Bit(value: number): number;

/**
 * Whether two colors are the same once stored as 8-bit channels, which is
 * the precision of `#rrggbbaa`.
 */
export function sameColor(a: Rgba, b: Rgba): boolean;

/** Format as `#rrggbb`, or `#rrggbbaa` when not opaque. */
export function formatHex(rgba: Rgba): string;

/** Format as `rgb(r, g, b)`, or `rgba(r, g, b, a)` when not opaque. */
export function formatRgb(rgba: Rgba): string;

/**
 * Format as `hsl(h, s%, l%)`, or `hsla(h, s%, l%, a)` when not opaque.
 * The three numbers are rounded to whole numbers.
 */
export function formatHsl(hsla: Hsla): string;

/**
 * Serialize a color as a CSS string in `format`. HSL reads the HSV model,
 * not the RGB it rounds to, so a gray keeps its hue.
 */
export function formatColor(hsva: Hsva, format: ColorFormat): string;

/**
 * WCAG contrast ratio of `foreground` against `background`, from 1 to 21.
 * A translucent background is laid over white first, and a translucent
 * foreground over that, so the ratio is for what the eye gets.
 */
export function colorContrast(foreground: Rgba, background: Rgba): number;

/**
 * Black or white, whichever reads better on `rgba` (laid over white when
 * translucent). For a mark drawn on a color.
 */
export function readableOn(rgba: Rgba): "black" | "white";

/** The English name of a hue: `"blue"`, `"teal"`. */
export function describeHue(hue: number): string;

/**
 * A spoken English name for a color, such as `"dark teal"`, `"light grayish
 * blue"`, `"brown"` or `"white"`. It is coarse by design: a hue family, a
 * lightness step, and a note when the color is washed out. Alpha is not
 * part of the name.
 */
export function describeColor(hsva: Hsva): string;
