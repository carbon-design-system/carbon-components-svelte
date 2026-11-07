// @ts-check

/**
 * @typedef {import("./signature-path.js").SignaturePoint} SignaturePoint
 * @typedef {import("./signature-path.js").SignatureStrokeOptions} SignatureStrokeOptions
 */

/** Pixels in a straight line, below which a new sample is not a new point. */
const MIN_DISTANCE = 0.6;
/** Weight of the newest speed sample; the rest is the running speed. */
const SPEED_WEIGHT = 0.7;
/** The width of the first point, as a fraction of the way from min to max. */
const START_WIDTH = 0.6;
/** RDP tolerance, in viewBox units, when a stroke ends. */
export const SIMPLIFY_TOLERANCE = 0.35;

/**
 * Round to two decimals and drop trailing zeros, so a path stays short.
 * @param {number} n
 */
function fmt(n) {
  return String(Math.round(n * 100) / 100);
}

/**
 * Build one stroke from pointer samples. Each accepted sample becomes a
 * `[x, y, width]` point; the width comes from the pen's pressure, or from
 * how fast a mouse or finger moves (slow is thick, fast is thin), smoothed
 * so the width does not jump between samples.
 *
 * @param {SignatureStrokeOptions} [options]
 */
export function createStroke(options = {}) {
  const { minWidth = 0.8, maxWidth = 3.2 } = options;
  /** @type {SignaturePoint[]} */
  const points = [];
  let lastTime = 0;
  let speed = 0;
  let width = minWidth + (maxWidth - minWidth) * START_WIDTH;

  return {
    points,
    /**
     * Add a sample in viewBox units. Returns whether it became a point.
     * `pressure` is only trusted from a pen: a mouse reports a constant
     * 0.5 while pressed and a finger often does too.
     * @param {number} x
     * @param {number} y
     * @param {{ pressure?: number; time?: number; pointerType?: string }} [sample]
     */
    add(x, y, { pressure = 0, time = 0, pointerType = "mouse" } = {}) {
      const last = points[points.length - 1];
      const usePressure = pointerType === "pen" && pressure > 0;
      if (!last) {
        if (usePressure) width = minWidth + (maxWidth - minWidth) * pressure;
        points.push([x, y, width]);
        lastTime = time;
        return true;
      }
      const dx = x - last[0];
      const dy = y - last[1];
      const distance = Math.hypot(dx, dy);
      if (distance < MIN_DISTANCE) return false;

      if (usePressure) {
        // Low-pass the pressure so a jittery digitizer does not draw teeth.
        const target = minWidth + (maxWidth - minWidth) * pressure;
        width = width * (1 - SPEED_WEIGHT) + target * SPEED_WEIGHT;
      } else {
        // Samples can share a timestamp (coalesced events): never divide by 0.
        const elapsed = Math.max(time - lastTime, 1);
        speed =
          (distance / elapsed) * SPEED_WEIGHT + speed * (1 - SPEED_WEIGHT);
        const target = Math.max(maxWidth / (speed + 1), minWidth);
        width = width * (1 - SPEED_WEIGHT) + target * SPEED_WEIGHT;
      }
      lastTime = time;
      points.push([x, y, width]);
      return true;
    },
  };
}

/**
 * Ramer-Douglas-Peucker: drop points that sit within `tolerance` of the
 * line through their neighbours. The ends stay. Iterative, so a stroke of
 * any length cannot overflow the stack.
 *
 * @param {SignaturePoint[]} points
 * @param {number} [tolerance]
 * @returns {SignaturePoint[]}
 */
export function simplify(points, tolerance = SIMPLIFY_TOLERANCE) {
  const last = points.length - 1;
  if (last < 2) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = keep[last] = 1;
  /** @type {Array<[number, number]>} */
  const stack = [[0, last]];
  while (stack.length > 0) {
    const [from, to] = /** @type {[number, number]} */ (stack.pop());
    const [ax, ay] = points[from];
    const [bx, by] = points[to];
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy);
    let farthest = -1;
    let max = tolerance;
    for (let i = from + 1; i < to; i++) {
      const [px, py] = points[i];
      const d =
        length === 0
          ? Math.hypot(px - ax, py - ay)
          : Math.abs(dy * (px - ax) - dx * (py - ay)) / length;
      if (d > max) {
        max = d;
        farthest = i;
      }
    }
    if (farthest > -1) {
      keep[farthest] = 1;
      stack.push([from, farthest], [farthest, to]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * The curves along one side of the outline: quadratics through the
 * midpoints, so a polyline of samples reads as one smooth line. Each is
 * `[from, control, to]`; the last is a straight line, with no control.
 *
 * @param {Array<[number, number]>} side
 * @returns {Array<[[number, number], [number, number] | null, [number, number]]>}
 */
function sideCurves(side) {
  /** @type {Array<[[number, number], [number, number] | null, [number, number]]>} */
  const curves = [];
  let from = side[0];
  for (let i = 1; i < side.length - 1; i++) {
    const [cx, cy] = side[i];
    const [nx, ny] = side[i + 1];
    /** @type {[number, number]} */
    const to = [(cx + nx) / 2, (cy + ny) / 2];
    curves.push([from, side[i], to]);
    from = to;
  }
  curves.push([from, null, side[side.length - 1]]);
  return curves;
}

/**
 * Path data for the curves of a side, drawn forward or, for the other edge
 * of the ribbon, back along the very same curves. The cursor is already at
 * the first point (or, reversed, the last).
 *
 * @param {ReturnType<typeof sideCurves>} curves
 * @param {boolean} reverse
 */
function curvesPath(curves, reverse) {
  let d = "";
  const ordered = reverse ? curves.slice().reverse() : curves;
  for (const [from, control, to] of ordered) {
    const end = reverse ? from : to;
    d += control
      ? `Q${fmt(control[0])} ${fmt(control[1])} ${fmt(end[0])} ${fmt(end[1])}`
      : `L${fmt(end[0])} ${fmt(end[1])}`;
  }
  return d;
}

/**
 * The outline of a stroke as SVG path data: a ribbon as wide as each point's
 * width, with round caps. One closed shape per stroke, so a canvas
 * (`new Path2D(d)`) and an SVG `<path>` draw the same pixels from the same
 * string.
 *
 * @param {SignaturePoint[]} points
 * @returns {string}
 */
export function strokePath(points) {
  const count = points.length;
  if (count === 0) return "";
  if (count === 1) {
    const [x, y, w] = points[0];
    const r = Math.max(w, 1) / 2;
    return `M${fmt(x - r)} ${fmt(y)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(r * 2)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-r * 2)} 0Z`;
  }

  /** @type {Array<[number, number]>} */
  const left = [];
  /** @type {Array<[number, number]>} */
  const right = [];
  let nx = 0;
  let ny = 0;
  for (let i = 0; i < count; i++) {
    const [x, y, w] = points[i];
    const before = points[Math.max(i - 1, 0)];
    const after = points[Math.min(i + 1, count - 1)];
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      nx = -dy / length;
      ny = dx / length;
    }
    const r = w / 2;
    left.push([x + nx * r, y + ny * r]);
    right.push([x - nx * r, y - ny * r]);
  }

  const endRadius = points[count - 1][2] / 2;
  const startRadius = points[0][2] / 2;
  const [rx, ry] = right[count - 1];
  const [lx, ly] = left[0];
  // Both caps are half circles that turn the same way (counterclockwise on
  // screen), from the left edge to the right edge at the end and from the
  // right edge to the left at the start.
  return (
    `M${fmt(lx)} ${fmt(ly)}${curvesPath(sideCurves(left), false)}` +
    `A${fmt(endRadius)} ${fmt(endRadius)} 0 0 0 ${fmt(rx)} ${fmt(ry)}` +
    `${curvesPath(sideCurves(right), true)}` +
    `A${fmt(startRadius)} ${fmt(startRadius)} 0 0 0 ${fmt(lx)} ${fmt(ly)}Z`
  );
}

/**
 * @param {string} text
 */
function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A standalone SVG document for strokes: one filled path per stroke on a
 * transparent background, in the pad's own coordinates.
 *
 * @param {SignaturePoint[][]} strokes
 * @param {{ width: number; height: number; color: string; background?: string; title?: string }} options
 */
export function strokesToSvg(strokes, options) {
  const { width, height, color, background, title = "Signature" } = options;
  const paths = strokes
    .map((points) => `<path d="${strokePath(points)}"/>`)
    .join("");
  return svgDocument(
    `${background ? `<rect width="${width}" height="${height}" fill="${escapeXml(background)}"/>` : ""}<g fill="${escapeXml(color)}">${paths}</g>`,
    { width, height, title },
  );
}

/**
 * A standalone SVG document for a typed signature. SVG text is drawn with
 * whatever fonts the viewer has, so this can differ from the preview on
 * another machine; the PNG is the portable image of a typed signature.
 *
 * @param {string} text
 * @param {{ width: number; height: number; color: string; background?: string; fontFamily: string; fontSize: number; title?: string }} options
 */
export function textToSvg(text, options) {
  const {
    width,
    height,
    color,
    background,
    fontFamily,
    fontSize,
    title = "Signature",
  } = options;
  return svgDocument(
    `${background ? `<rect width="${width}" height="${height}" fill="${escapeXml(background)}"/>` : ""}<text x="${fmt(width / 2)}" y="${fmt(height / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(fontFamily)}" font-size="${fmt(fontSize)}" fill="${escapeXml(color)}">${escapeXml(text)}</text>`,
    { width, height, title },
  );
}

/**
 * @param {string} body
 * @param {{ width: number; height: number; title: string }} options
 */
function svgDocument(body, { width, height, title }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">${body}</svg>`;
}

/**
 * The font size that fits `text` in `maxWidth`, never larger than `maxSize`.
 * `measure` returns the width of the text at 1 unit of font size; without
 * one (no canvas, as on the server) the width is estimated.
 *
 * @param {string} text
 * @param {{ maxWidth: number; maxSize: number; minSize?: number; measure?: (text: string) => number }} options
 */
export function fitFontSize(text, { maxWidth, maxSize, minSize = 8, measure }) {
  const perUnit = measure ? measure(text) : text.length * 0.5;
  if (!(perUnit > 0)) return maxSize;
  return Math.max(minSize, Math.min(maxSize, maxWidth / perUnit));
}
