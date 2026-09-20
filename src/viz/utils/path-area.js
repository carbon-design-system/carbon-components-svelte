// @ts-check
// SVG path builder for filled areas and bands.
import { resolvePathOptions, runCommands, splitRuns } from "./path-line.js";

/** @typedef {import("./path-line.d.ts").Point} Point */
/** @typedef {import("./path-line.d.ts").Curve} Curve */
/** @typedef {import("./path-line.d.ts").PathOptions} PathOptions */

/** @type {Partial<Record<Curve, Curve>>} */
const REVERSED_CURVE = {
  "step-after": "step-before",
  "step-before": "step-after",
};

/**
 * SVG path `d` for the area between `points` and `baseline`. A number is a
 * flat baseline. An array gives the lower edge per point (same indexes as
 * `points`), for stacked layers, streams, and confidence bands. Each gap-free
 * run closes on its own, so gaps stay empty.
 *
 * @param {ReadonlyArray<Point | null | undefined>} points
 * @param {number | ReadonlyArray<number | null | undefined>} baseline
 * @param {PathOptions} [options]
 * @returns {string}
 */
export function pathArea(points, baseline, options) {
  const { curve, f } = resolvePathOptions(options);
  const flat = typeof baseline === "number";
  /** @type {string[]} */
  const parts = [];

  for (const run of splitRuns(points)) {
    const upper = run.points;
    const commands = runCommands(upper, curve, f, "M");
    for (let i = 0; i < commands.length; i++) parts.push(commands[i]);

    if (flat) {
      const base = f(/** @type {number} */ (baseline));
      parts.push(
        `L${f(upper[upper.length - 1].x)},${base}L${f(upper[0].x)},${base}Z`,
      );
      continue;
    }

    /** @type {Point[]} */
    const lower = [];
    for (let i = upper.length - 1; i >= 0; i--) {
      const y = /** @type {ReadonlyArray<number | null | undefined>} */ (
        baseline
      )[run.start + i];
      lower.push({
        x: upper[i].x,
        y: Number.isFinite(y) ? Number(y) : upper[i].y,
      });
    }
    const back = runCommands(lower, REVERSED_CURVE[curve] ?? curve, f, "L");
    for (let i = 0; i < back.length; i++) parts.push(back[i]);
    parts.push("Z");
  }
  return parts.join("");
}
