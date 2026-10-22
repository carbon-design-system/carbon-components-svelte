/**
 * Names of the `--cds-viz-*` color tokens declared by `css/viz*.css`. Values
 * live in CSS only, so themes and consumer overrides keep working.
 */

export type VizSemanticColor =
  | "interactive"
  | "neutral"
  | "success"
  | "error"
  | "warning"
  | "info";

export type VizSequentialHue = "purple" | "blue" | "cyan" | "teal";

export type VizDivergingPalette = "red-cyan" | "purple-teal";

/** A `--cds-viz-*` token name without the prefix, such as `"cat-03"`. */
export type VizColorToken =
  | `cat-${string}`
  | `group-${number}-${number}-${number}`
  | `seq-${VizSequentialHue}-${string}`
  | `div-${VizDivergingPalette}-${string}`;

/**
 * A series color: a semantic name, a 1-based categorical index, a viz token
 * name, or any CSS color value.
 */
export type VizColor =
  | VizSemanticColor
  | VizColorToken
  | number
  | (string & {});

export const VIZ_CATEGORICAL_COUNT: 14;

/** Semantic series colors, aliased to core theme tokens in CSS. */
export const VIZ_SEMANTIC_COLORS: readonly [
  "interactive",
  "neutral",
  "success",
  "error",
  "warning",
  "info",
];

/** Number of prescribed options for each group size. */
export const VIZ_GROUP_OPTIONS: {
  readonly 1: 4;
  readonly 2: 5;
  readonly 3: 5;
  readonly 4: 3;
  readonly 5: 2;
};

export const VIZ_SEQUENTIAL_STEPS: 11;
export const VIZ_DIVERGING_STEPS: 17;

/**
 * Resolve a `VizColor` to a CSS color value. Semantic names, categorical
 * indices (1-based, cycling past 14), and `--cds-viz-*` token names become
 * `var()` references. Anything else passes through as a CSS color.
 */
export function vizColor(
  color: VizColor | undefined | null,
): string | undefined;

/**
 * Colors for `count` series. Up to 5 series use one of Carbon's prescribed
 * high-contrast groups (`option` is 1-based and wraps); more use the first
 * `count` of the 14 categorical colors, cycling past 14.
 */
export function categoricalColors(count: number, option?: number): string[];
