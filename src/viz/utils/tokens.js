// @ts-check
// Names of the `--cds-viz-*` color tokens declared by `css/viz*.css`. Values
// live in CSS only, so themes and consumer overrides keep working.

/** @typedef {import("./tokens.d.ts").VizColor} VizColor */

export const VIZ_CATEGORICAL_COUNT = 14;

/** Semantic series colors, aliased to core theme tokens in CSS. */
export const VIZ_SEMANTIC_COLORS = /** @type {const} */ ([
  "interactive",
  "neutral",
  "success",
  "error",
  "warning",
  "info",
]);

/** Number of prescribed options for each group size. */
export const VIZ_GROUP_OPTIONS = /** @type {const} */ ({
  1: 4,
  2: 5,
  3: 5,
  4: 3,
  5: 2,
});

export const VIZ_SEQUENTIAL_STEPS = 11;
export const VIZ_DIVERGING_STEPS = 17;

const SEMANTIC = new Set(VIZ_SEMANTIC_COLORS);
const TOKEN_REGEX = /^(cat|group|seq|div)-[a-z0-9-]+$/;

/**
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Resolve a `VizColor` to a CSS color value. Semantic names, categorical
 * indices (1-based, cycling past 14), and `--cds-viz-*` token names become
 * `var()` references. Anything else passes through as a CSS color.
 *
 * @param {VizColor | undefined | null} color
 * @returns {string | undefined}
 */
export function vizColor(color) {
  if (color === undefined || color === null || color === "") return undefined;
  if (typeof color === "number") {
    if (!Number.isFinite(color)) return undefined;
    const index =
      (((Math.trunc(color) - 1) % VIZ_CATEGORICAL_COUNT) +
        VIZ_CATEGORICAL_COUNT) %
      VIZ_CATEGORICAL_COUNT;
    return `var(--cds-viz-cat-${pad(index + 1)})`;
  }
  if (SEMANTIC.has(/** @type {any} */ (color)) || TOKEN_REGEX.test(color)) {
    return `var(--cds-viz-${color})`;
  }
  return color;
}

/**
 * Colors for `count` series. Up to 5 series use one of Carbon's prescribed
 * high-contrast groups (`option` is 1-based and wraps); more use the first
 * `count` of the 14 categorical colors, cycling past 14.
 *
 * @param {number} count
 * @param {number} [option]
 * @returns {string[]}
 */
export function categoricalColors(count, option = 1) {
  const size = Math.max(0, Math.trunc(count) || 0);
  /** @type {string[]} */
  const colors = [];

  const options = VIZ_GROUP_OPTIONS[/** @type {1 | 2 | 3 | 4 | 5} */ (size)];
  if (options) {
    const o = ((((Math.trunc(option) || 1) - 1) % options) + options) % options;
    for (let i = 1; i <= size; i++) {
      colors.push(`var(--cds-viz-group-${size}-${o + 1}-${i})`);
    }
    return colors;
  }

  for (let i = 1; i <= size; i++) {
    colors.push(/** @type {string} */ (vizColor(i)));
  }
  return colors;
}
