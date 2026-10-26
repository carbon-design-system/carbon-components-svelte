// @ts-check

/** Carbon spacing scale, in rem, so it tracks the root font size. */
export const SPACING_REM = [
  0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 10,
];

/**
 * Name of the spacing token for `px`, `"0"` for zero, `"hairline"` for
 * 1px, or `null` when the value is off the scale. Negative values match
 * by magnitude. The scale starts at 2px; a 1px offset is how borders
 * overlap (a `-1px` margin), not a spacing choice.
 * @param {number} px
 * @param {number} [remPx] root font size in pixels
 * @returns {string | null}
 */
export function spacingToken(px, remPx = 16) {
  const abs = Math.abs(px);
  if (abs < 0.5) return "0";
  if (abs < 1.5) return "hairline";
  const index = SPACING_REM.findIndex(
    (rem) => Math.abs(rem * remPx - abs) < 0.5,
  );
  return index === -1 ? null : `spacing-${String(index + 1).padStart(2, "0")}`;
}

/**
 * Spacing token for one padding side. Carbon specs padding from the outer
 * edge, so a bordered control subtracts its border: a button's 15px left
 * padding plus its 1px border is `spacing-05`. When the padding alone is
 * off the scale but padding plus border is on it, the side counts as on
 * the scale, and `withBorder` is the border width that made it fit.
 * @param {number} px padding
 * @param {number} borderPx border on the same side
 * @param {number} [remPx] root font size in pixels
 * @returns {{ token: string | null; withBorder: number }}
 */
export function paddingToken(px, borderPx, remPx = 16) {
  const token = spacingToken(px, remPx);
  if (token !== null || !(borderPx > 0)) return { token, withBorder: 0 };
  const outer = spacingToken(px + borderPx, remPx);
  return outer === null
    ? { token: null, withBorder: 0 }
    : { token: outer, withBorder: borderPx };
}

/** @param {number} px */
export function formatPx(px) {
  return String(Math.round(px * 10) / 10);
}

const FLEX_OR_GRID = /flex|grid/;

/**
 * @typedef {Pick<CSSStyleDeclaration, "display" | "rowGap" | "columnGap" | "marginTop" | "marginRight" | "marginBottom" | "marginLeft" | "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft" | "borderTopWidth" | "borderRightWidth" | "borderBottomWidth" | "borderLeftWidth">} SpacingStyle
 */

/**
 * Gap of a flex or grid container, or `null` for anything else.
 * @param {Pick<SpacingStyle, "display" | "rowGap" | "columnGap">} style
 * @returns {{ row: number; column: number } | null}
 */
export function gaps(style) {
  if (!FLEX_OR_GRID.test(style.display)) return null;
  const row = Number.parseFloat(style.rowGap) || 0;
  const column = Number.parseFloat(style.columnGap) || 0;
  return row || column ? { row, column } : null;
}

const SIDES = /** @type {const} */ (["Top", "Right", "Bottom", "Left"]);

/**
 * Off-scale margin, padding, and gap on one element, as `prop value`
 * strings. `getComputedStyle` reports `auto` margins as their used pixel
 * value, so equal horizontal margins (centering) and margins wider than
 * the largest token are treated as `auto` and skipped.
 * @param {SpacingStyle} style
 * @param {number} [remPx] root font size in pixels
 * @returns {string[]}
 */
export function offScale(style, remPx = 16) {
  /** @type {string[]} */
  const found = [];
  const ml = Number.parseFloat(style.marginLeft) || 0;
  const mr = Number.parseFloat(style.marginRight) || 0;
  const centered = ml > 0 && Math.abs(ml - mr) < 0.5;
  const largest = SPACING_REM[SPACING_REM.length - 1] * remPx;
  for (const side of SIDES) {
    const value = Number.parseFloat(style[`margin${side}`]) || 0;
    if (centered && (side === "Left" || side === "Right")) continue;
    if (Math.abs(value) > largest) continue;
    if (spacingToken(value, remPx) === null) {
      found.push(`margin-${side.toLowerCase()} ${formatPx(value)}`);
    }
  }
  for (const side of SIDES) {
    const value = Number.parseFloat(style[`padding${side}`]) || 0;
    const borderPx = Number.parseFloat(style[`border${side}Width`]) || 0;
    if (paddingToken(value, borderPx, remPx).token === null) {
      found.push(`padding-${side.toLowerCase()} ${formatPx(value)}`);
    }
  }
  const gap = gaps(style);
  if (gap && gap.row === gap.column) {
    if (spacingToken(gap.row, remPx) === null) {
      found.push(`gap ${formatPx(gap.row)}`);
    }
  } else if (gap) {
    if (spacingToken(gap.row, remPx) === null) {
      found.push(`row-gap ${formatPx(gap.row)}`);
    }
    if (spacingToken(gap.column, remPx) === null) {
      found.push(`column-gap ${formatPx(gap.column)}`);
    }
  }
  return found;
}

/**
 * Each distinct non-zero value in a set of side values, with its token
 * name, one card line each. With `borders` (padding), a side that is on
 * the scale only with its border says so. On `carbon` elements, an
 * off-scale value reads "set by Carbon" and is not flagged.
 * @param {number[]} values top, right, bottom, left
 * @param {{ borders?: number[]; carbon?: boolean; remPx?: number }} [options]
 * @returns {{ value: string; token: string; off: boolean; withBorder: string | null }[]}
 */
export function sideTokens(values, options = {}) {
  const { borders, carbon = false, remPx = 16 } = options;
  /** @type {Map<string, { value: string; token: string; off: boolean; withBorder: string | null }>} */
  const lines = new Map();
  values.forEach((value, index) => {
    if (Math.abs(value) < 0.5) return;
    const fit = borders
      ? paddingToken(value, borders[index], remPx)
      : { token: spacingToken(value, remPx), withBorder: 0 };
    const key = `${formatPx(value)}|${fit.withBorder}`;
    if (lines.has(key)) return;
    lines.set(key, {
      value: formatPx(value),
      token: fit.token ?? (carbon ? "set by Carbon" : "off-scale"),
      off: fit.token === null && !carbon,
      withBorder: fit.withBorder ? formatPx(fit.withBorder) : null,
    });
  });
  return [...lines.values()];
}
