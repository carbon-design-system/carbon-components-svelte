// @ts-check
// `start` and `end` name inline sides, as in floating-ui, so they swap under
// `dir="rtl"`. `left` and `right` name physical sides and stay.

/**
 * The physical side of a `start` or `end` alignment on the inline axis.
 * They swap in RTL, where the inline start is the right. `center` stays.
 *
 * @param {"start" | "center" | "end"} align
 * @param {boolean} rtl
 * @returns {"start" | "center" | "end"} `start` for the left edge, `end` for the right.
 */
export function physicalAlign(align, rtl) {
  if (!rtl || align === "center") return align;
  return align === "start" ? "end" : "start";
}

// Carbon v11 placements and the older placement each one maps to in LTR.
/** @type {Record<string, string>} */
const V11_PLACEMENTS = {
  "top-start": "top-left",
  "top-end": "top-right",
  "bottom-start": "bottom-left",
  "bottom-end": "bottom-right",
  "left-start": "left-top",
  "left-end": "left-bottom",
  "right-start": "right-top",
  "right-end": "right-bottom",
};

// The RTL placement of each inline one.
/** @type {Record<string, string>} */
const RTL_PLACEMENTS = {
  "top-left": "top-right",
  "top-right": "top-left",
  "bottom-left": "bottom-right",
  "bottom-right": "bottom-left",
};

const INLINE_ALIGN = /^(top|bottom)-(start|end)$/;

/**
 * Whether a popover placement aligns to an inline side, so it swaps in RTL:
 * `top-start`, `top-end`, `bottom-start` and `bottom-end`.
 *
 * @param {string} align
 * @returns {boolean}
 */
export function isInlineAlign(align) {
  return INLINE_ALIGN.test(align);
}

/**
 * The physical placement of a popover `align`, named as the older placements
 * (`top-left`, `left-bottom`). Carbon v11's `top-start` is `top-left` in LTR
 * and `top-right` in RTL. `left-start` and `right-start` align on the block
 * axis, so they stay. The older names and the bare sides are physical
 * already.
 *
 * @param {string} align
 * @param {boolean} rtl
 * @returns {string}
 */
export function popoverPlacement(align, rtl) {
  const placement = V11_PLACEMENTS[align];
  if (!placement) return align;
  return rtl && isInlineAlign(align) ? RTL_PLACEMENTS[placement] : placement;
}
