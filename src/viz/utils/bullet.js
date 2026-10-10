// @ts-check
// Bullet graph math: measure, target, and qualitative bands as percentages.

/**
 * Positions for a bullet graph, as percentages of the `[min, max]` domain.
 * Without `max`, the domain ends at the largest of the value, the target, and
 * the last band. Bands are ascending upper bounds; the last band always runs
 * to the end of the domain. Everything is clamped to the domain.
 *
 * @param {import("./bullet.d.ts").BulletInput} input
 * @returns {import("./bullet.d.ts").BulletGeometry}
 */
export function getBulletGeometry({ value, target, min = 0, max, bands = [] }) {
  const bounds = bands
    .filter((bound) => Number.isFinite(bound))
    .sort((a, b) => a - b);

  let end = max;
  if (end === undefined || !Number.isFinite(end)) {
    end = Number.isFinite(value) ? value : min;
    if (target !== undefined && target !== null && target > end) end = target;
    if (bounds.length > 0 && bounds[bounds.length - 1] > end) {
      end = bounds[bounds.length - 1];
    }
  }
  const span = end - min;

  /** @param {number} v */
  function pct(v) {
    if (!(span > 0) || !Number.isFinite(v)) return 0;
    return Math.min(Math.max((v - min) / span, 0), 1) * 100;
  }

  /** @type {import("./bullet.d.ts").BulletBand[]} */
  const ranges = [];
  let from = min;
  for (let i = 0; i < bounds.length; i++) {
    const to = Math.min(Math.max(bounds[i], min), end);
    if (to > from) {
      ranges.push({ from, to, pct: pct(to) - pct(from), index: ranges.length });
      from = to;
    }
  }
  if (bounds.length > 0 && end > from) {
    ranges.push({ from, to: end, pct: 100 - pct(from), index: ranges.length });
  }

  return {
    domain: [min, end],
    valuePct: pct(value),
    targetPct:
      target === undefined || target === null || !Number.isFinite(target)
        ? null
        : pct(target),
    bands: ranges,
  };
}
