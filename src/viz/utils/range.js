// @ts-check
// Range indicator math: a value and an optional quartile box on a domain.

/**
 * Positions for a value within `[min, max]`, as percentages, with an optional
 * box from the first to the third quartile. Everything is clamped to the
 * domain. A flat or non-finite domain yields zeros and no box.
 *
 * @param {import("./range.d.ts").RangeInput} input
 * @returns {import("./range.d.ts").RangeGeometry}
 */
export function getRangeGeometry({ min, max, value, quartiles }) {
  const span = max - min;
  const valid = Number.isFinite(span) && span > 0;

  /** @param {number} v */
  function pct(v) {
    if (!valid || !Number.isFinite(v)) return 0;
    return Math.min(Math.max((v - min) / span, 0), 1) * 100;
  }

  /** @type {import("./range.d.ts").RangeGeometry["box"]} */
  let box = null;
  if (valid && quartiles && quartiles.length === 3) {
    const sorted = [...quartiles].sort((a, b) => a - b);
    if (sorted.every((q) => Number.isFinite(q))) {
      const startPct = pct(sorted[0]);
      box = {
        startPct,
        widthPct: pct(sorted[2]) - startPct,
        medianPct: pct(sorted[1]),
      };
    }
  }

  return {
    valuePct: value === undefined || value === null ? null : pct(value),
    outside:
      valid && typeof value === "number" && Number.isFinite(value)
        ? value < min
          ? "below"
          : value > max
            ? "above"
            : null
        : null,
    box,
  };
}
