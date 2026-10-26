/** Carbon spacing scale, in rem. */
export const SPACING_REM: number[];

/**
 * Spacing token name for `px`, `"0"` for zero, `"hairline"` for 1px, or
 * `null` when off the scale.
 */
export function spacingToken(px: number, remPx?: number): string | null;

/**
 * Spacing token for one padding side, measured from the outer edge: when
 * the padding alone is off the scale but padding plus border is on it,
 * `withBorder` is the border width that made it fit.
 */
export function paddingToken(
  px: number,
  borderPx: number,
  remPx?: number,
): { token: string | null; withBorder: number };

/** Pixels rounded to 0.1, as a string. */
export function formatPx(px: number): string;

export type SpacingStyle = Pick<
  CSSStyleDeclaration,
  | "display"
  | "rowGap"
  | "columnGap"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "borderTopWidth"
  | "borderRightWidth"
  | "borderBottomWidth"
  | "borderLeftWidth"
>;

/** Gap of a flex or grid container, or `null` for anything else. */
export function gaps(
  style: Pick<SpacingStyle, "display" | "rowGap" | "columnGap">,
): { row: number; column: number } | null;

/** Off-scale margin, padding, and gap on one element, as `prop value` strings. */
export function offScale(style: SpacingStyle, remPx?: number): string[];

/** Each distinct non-zero side value with its token name, one card line each. */
export function sideTokens(
  values: number[],
  options?: { borders?: number[]; carbon?: boolean; remPx?: number },
): {
  value: string;
  token: string;
  off: boolean;
  withBorder: string | null;
}[];

/** The spacing token closest to `px`, for a fix suggestion. */
export function nearestSpacing(
  px: number,
  remPx?: number,
): { token: string; px: number };
