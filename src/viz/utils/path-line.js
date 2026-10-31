// @ts-check
// SVG path builders for lines and areas. Inputs are already in pixel space.

/** @typedef {import("./path-line.d.ts").Point} Point */
/** @typedef {import("./path-line.d.ts").Curve} Curve */
/** @typedef {import("./path-line.d.ts").PathOptions} PathOptions */

/**
 * Number formatter that rounds to `precision` decimals and drops trailing
 * zeros, which keeps long `d` attributes short.
 *
 * @param {number} precision
 * @returns {(value: number) => string}
 */
function createFormat(precision) {
  const factor = 10 ** precision;
  return (value) => `${Math.round(value * factor) / factor}`;
}

/**
 * Split `points` into runs of consecutive present points. A missing or
 * non-finite point ends the current run, so gaps are never bridged.
 *
 * @param {ReadonlyArray<Point | null | undefined>} points
 * @returns {Array<{ start: number, points: Point[] }>}
 */
export function splitRuns(points) {
  /** @type {Array<{ start: number, points: Point[] }>} */
  const runs = [];
  /** @type {{ start: number, points: Point[] } | null} */
  let run = null;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
      if (!run) {
        run = { start: i, points: [] };
        runs.push(run);
      }
      run.points.push(point);
    } else {
      run = null;
    }
  }
  return runs;
}

/**
 * Monotone cubic tangents (Fritsch-Carlson). The curve never overshoots the
 * data between neighbors, so it cannot invent peaks or dips.
 *
 * @param {ReadonlyArray<Point>} points At least 3, ascending or descending x.
 * @returns {number[]}
 */
function monotoneTangents(points) {
  const n = points.length;
  /** @type {number[]} */
  const slopes = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    slopes[i] = dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx;
  }

  /** @type {number[]} */
  const tangents = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tangents[i] =
      slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    const slope = slopes[i];
    if (slope === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slope;
    const b = tangents[i + 1] / slope;
    const norm = a * a + b * b;
    if (norm > 9) {
      const t = 3 / Math.sqrt(norm);
      tangents[i] = t * a * slope;
      tangents[i + 1] = t * b * slope;
    }
  }
  return tangents;
}

/**
 * Path commands through one gap-free run. `move` is the command that reaches
 * the first point: `"M"` to start a subpath, `"L"` to continue one.
 *
 * @param {ReadonlyArray<Point>} points
 * @param {Curve} curve
 * @param {(value: number) => string} f
 * @param {"M" | "L"} move
 * @returns {string[]}
 */
export function runCommands(points, curve, f, move) {
  const n = points.length;
  if (n === 0) return [];
  /** @type {string[]} */
  const parts = [`${move}${f(points[0].x)},${f(points[0].y)}`];

  if (curve === "monotone" && n > 2) {
    const tangents = monotoneTangents(points);
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const third = (p1.x - p0.x) / 3;
      if (third === 0) {
        parts.push(`L${f(p1.x)},${f(p1.y)}`);
        continue;
      }
      parts.push(
        `C${f(p0.x + third)},${f(p0.y + tangents[i] * third)},${f(p1.x - third)},${f(p1.y - tangents[i + 1] * third)},${f(p1.x)},${f(p1.y)}`,
      );
    }
    return parts;
  }

  for (let i = 1; i < n; i++) {
    const prev = points[i - 1];
    const point = points[i];
    if (curve === "step-after") {
      parts.push(`H${f(point.x)}V${f(point.y)}`);
    } else if (curve === "step-before") {
      parts.push(`V${f(point.y)}H${f(point.x)}`);
    } else if (curve === "step") {
      parts.push(`H${f((prev.x + point.x) / 2)}V${f(point.y)}H${f(point.x)}`);
    } else {
      parts.push(`L${f(point.x)},${f(point.y)}`);
    }
  }
  return parts;
}

/**
 * Resolve path options into a curve and a number formatter.
 *
 * @param {PathOptions} [options]
 * @returns {{ curve: Curve, f: (value: number) => string }}
 */
export function resolvePathOptions(options) {
  return {
    curve: options?.curve ?? "linear",
    f: createFormat(options?.precision ?? 2),
  };
}

/**
 * SVG path `d` through `points`. A `null` or non-finite point is a gap: the
 * line stops and a new subpath starts after it. A run of one point becomes a
 * zero-length segment, which round line caps paint as a dot.
 *
 * @param {ReadonlyArray<Point | null | undefined>} points
 * @param {PathOptions} [options]
 * @returns {string}
 */
export function pathLine(points, options) {
  const { curve, f } = resolvePathOptions(options);
  /** @type {string[]} */
  const parts = [];
  for (const run of splitRuns(points)) {
    const commands = runCommands(run.points, curve, f, "M");
    for (let i = 0; i < commands.length; i++) parts.push(commands[i]);
    if (run.points.length === 1) parts.push("l0,0");
  }
  return parts.join("");
}
