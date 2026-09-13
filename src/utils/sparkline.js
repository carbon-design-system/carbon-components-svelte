// @ts-check
// Sparkline geometry math, kept DOM-free so it can be unit-tested without
// rendering the component.

/**
 * A plotted point in SVG user units.
 * @typedef {{ x: number, y: number }} SparklinePoint
 */

/**
 * A single bar's geometry in SVG user units.
 * @typedef {{ x: number, y: number, width: number, height: number }} SparklineBar
 */

/**
 * The value range a series is plotted against.
 * @typedef {{ min: number, max: number }} SparklineDomain
 */

/**
 * Drop non-finite entries (`NaN`, `Infinity`) so downstream math never has to
 * guard against them.
 *
 * @param {readonly number[]} values
 * @returns {number[]}
 */
export function normalizeSparklineValues(values) {
  return values.filter(Number.isFinite);
}

/**
 * The `[min, max]` of `values` itself, with no override applied. Empty input
 * has no extent, so it reports `0` on both ends.
 *
 * @param {readonly number[]} values
 * @returns {SparklineDomain}
 */
function getDataExtent(values) {
  if (values.length === 0) return { min: 0, max: 0 };

  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return { min, max };
}

/**
 * The value range to plot `values` against: the data extent, with `min`/`max`
 * overrides applied, optionally widened to include `0`. A zero-width extent
 * (a flat series, or a single value) is expanded symmetrically by `1` so it
 * lands on the vertical center instead of collapsing to a point.
 *
 * @param {readonly number[]} values
 * @param {Object} [options]
 * @param {number} [options.min] Domain floor override.
 * @param {number} [options.max] Domain ceiling override.
 * @param {boolean} [options.includeZero] Widen the domain to include `0`.
 * @returns {SparklineDomain}
 */
export function getSparklineDomain(
  values,
  { min, max, includeZero = false } = {},
) {
  const extent = getDataExtent(values);

  let lo = min ?? extent.min;
  let hi = max ?? extent.max;

  if (includeZero) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }

  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }

  return { min: lo, max: hi };
}

/**
 * Plot `values` as points inside a `width` x `height` viewBox. `x` spreads
 * evenly across `[padding, width - padding]`; a single value sits centered at
 * `width / 2`. `y` maps the domain to `[height - padding, padding]` (low to
 * high), clamping values that fall outside an overridden domain.
 *
 * @param {readonly number[]} values
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} [options.padding]
 * @param {number} [options.min] Domain floor override.
 * @param {number} [options.max] Domain ceiling override.
 * @returns {SparklinePoint[]}
 */
export function getSparklinePoints(
  values,
  { width, height, padding = 0, min, max },
) {
  const count = values.length;
  if (count === 0) return [];

  const domain = getSparklineDomain(values, { min, max });
  const span = domain.max - domain.min;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values.map((value, index) => {
    const x =
      count === 1 ? width / 2 : padding + (index / (count - 1)) * innerWidth;
    const clamped = Math.min(domain.max, Math.max(domain.min, value));
    const y = padding + ((domain.max - clamped) / span) * innerHeight;
    return { x, y };
  });
}

/**
 * An SVG path `d` for a polyline through `points`, or `""` when there are
 * fewer than two points to connect.
 *
 * @param {readonly SparklinePoint[]} points
 * @returns {string}
 */
export function toLinePath(points) {
  if (points.length < 2) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

/**
 * An SVG path `d` for the filled area under the polyline through `points`,
 * closed down to `baselineY`. `""` when there are fewer than two points.
 *
 * @param {readonly SparklinePoint[]} points
 * @param {number} baselineY
 * @returns {string}
 */
export function toAreaPath(points, baselineY) {
  if (points.length < 2) return "";

  const linePath = toLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

/**
 * Plot `values` as bars inside a `width` x `height` viewBox. The domain
 * includes `0` so every bar has a baseline to draw from; negative values draw
 * downward from it. Bar width is `(width - gap * (n - 1)) / n`, floored at
 * `1` so a large series still renders visible bars.
 *
 * @param {readonly number[]} values
 * @param {Object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} [options.gap]
 * @param {number} [options.min] Domain floor override.
 * @param {number} [options.max] Domain ceiling override.
 * @returns {SparklineBar[]}
 */
export function getSparklineBars(values, { width, height, gap = 0, min, max }) {
  const count = values.length;
  if (count === 0) return [];

  const domain = getSparklineDomain(values, { min, max, includeZero: true });
  const span = domain.max - domain.min;
  const barWidth = Math.max(1, (width - gap * (count - 1)) / count);
  const baselineY = height - ((0 - domain.min) / span) * height;

  return values.map((value, index) => {
    const clamped = Math.min(domain.max, Math.max(domain.min, value));
    const valueY = height - ((clamped - domain.min) / span) * height;

    return {
      x: index * (barWidth + gap),
      y: Math.min(valueY, baselineY),
      width: barWidth,
      height: Math.abs(valueY - baselineY),
    };
  });
}
