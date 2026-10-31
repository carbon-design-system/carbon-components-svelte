export type Rgba = [number, number, number, number];

export type ColorRole = "text" | "background" | "border";

export type Background = {
  color: Rgba;
  own: Rgba | null;
  source: Element | null;
  image: boolean;
};

export type BackgroundCache = Map<Element, Background>;

/** Any CSS color in canvas form, or `null` for values that are not colors. */
export function normalizeColor(value: string): string | null;

/** Channels of a `normalizeColor` result. */
export function toRgba(normalized: string | null): Rgba | null;

/** `#rrggbb`, plus the opacity when below 1. */
export function toHex(rgba: Rgba): string;

/** Composites `top` over an opaque `bottom`. */
export function blend(top: Rgba, bottom: Rgba): Rgba;

/** WCAG 2 contrast ratio between two opaque colors. */
export function contrastRatio(a: Rgba, b: Rgba): number;

/** The background actually behind `el`, composited over white. */
export function effectiveBackground(
  el: Element,
  cache?: BackgroundCache,
): Background;

/** WCAG contrast check for the text of `el`. */
export function textContrast(
  el: Element,
  cache?: BackgroundCache,
): {
  ratio: number;
  aa: number;
  aaa: number;
  large: boolean;
  approximate: boolean;
};

/** Whether the page has any theme tokens to name colors with. */
export function hasTokens(): boolean;

/** Token names for `color` as used in `role`, best fit first. */
export function colorTokens(
  el: Element,
  color: string,
  role: ColorRole,
): string[];
