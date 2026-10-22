// @ts-check
// Where a fixed tooltip can sit without covering the marks: the plot's
// corners in a fixed order, taken by the first one no series crosses.

import { GLYPH_WIDTH, yScaleOf } from "./model.js";

/**
 * The size a tooltip will take, from its text, without measuring the DOM.
 *
 * @param {string} title
 * @param {ReadonlyArray<{ label: string; value: string }>} rows
 * @returns {{ width: number; height: number }}
 */
export function estimateTooltipSize(title, rows) {
  const PAD_X = 32;
  const PAD_Y = 16;
  const ROW = 18;
  const SWATCH = 20;
  let widest = title.length * GLYPH_WIDTH;
  for (const row of rows) {
    widest = Math.max(
      widest,
      SWATCH + (row.label.length + row.value.length) * GLYPH_WIDTH + 16,
    );
  }
  return {
    width: Math.max(128, widest + PAD_X),
    height: PAD_Y + ROW + rows.length * ROW,
  };
}

/**
 * The visible series as pixel segments between consecutive points. With
 * `toBaseline`, as for bars, every point also drops a segment to the
 * baseline, so the bodies count as covered too.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {{ toBaseline?: boolean }} [options]
 * @returns {Array<[number, number, number, number]>}
 */
export function seriesSegments(groups, scales, options = {}) {
  const { toBaseline = false } = options;
  /** @type {Array<[number, number, number, number]>} */
  const out = [];
  for (const group of groups) {
    if (group.hidden) continue;
    const y = yScaleOf(scales, group);
    const zero = y.map(0);
    const base = Number.isFinite(zero)
      ? Math.min(
          Math.max(zero, scales.horizontal ? scales.plot.x0 : scales.plot.y0),
          scales.horizontal ? scales.plot.x1 : scales.plot.y1,
        )
      : scales.horizontal
        ? scales.plot.x0
        : scales.plot.y1;
    let px = Number.NaN;
    let py = Number.NaN;
    for (let i = 0; i < group.xs.length; i++) {
      const along = scales.x.map(group.xs[i]);
      const across = y.map(group.ys[i]);
      const cx = scales.horizontal ? across : along;
      const cy = scales.horizontal ? along : across;
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
        px = Number.NaN;
        continue;
      }
      if (Number.isFinite(px)) out.push([px, py, cx, cy]);
      else out.push([cx, cy, cx, cy]);
      if (toBaseline) {
        out.push(scales.horizontal ? [base, cy, cx, cy] : [cx, base, cx, cy]);
      }
      px = cx;
      py = cy;
    }
  }
  return out;
}

/**
 * Whether a segment touches a rectangle, by clipping it to the box.
 *
 * @param {[number, number, number, number]} segment
 * @param {{ x: number; y: number; width: number; height: number }} box
 */
function crosses([x1, y1, x2, y2], box) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [-dx, x1 - box.x],
    [dx, box.x + box.width - x1],
    [-dy, y1 - box.y],
    [dy, box.y + box.height - y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
  }
  return true;
}

/**
 * The first corner of the plot, top left first, where a box of the given
 * size covers no segment. `null` when every corner is crossed, so the
 * caller can fall back to following the pointer.
 *
 * @param {{ x0: number; y0: number; x1: number; y1: number }} plot
 * @param {{ width: number; height: number }} size
 * @param {ReadonlyArray<[number, number, number, number]>} segments
 * @param {number} [inset]
 * @returns {{ x: number; y: number; corner: "tl" | "tr" | "bl" | "br" } | null}
 */
export function freeCorner(plot, size, segments, inset = 8) {
  const w = size.width;
  const h = size.height;
  if (w > plot.x1 - plot.x0 - inset * 2 || h > plot.y1 - plot.y0 - inset * 2) {
    return null;
  }
  /** @type {Array<{ x: number; y: number; corner: "tl" | "tr" | "bl" | "br" }>} */
  const corners = [
    { x: plot.x0 + inset, y: plot.y0 + inset, corner: "tl" },
    { x: plot.x1 - inset - w, y: plot.y0 + inset, corner: "tr" },
    { x: plot.x0 + inset, y: plot.y1 - inset - h, corner: "bl" },
    { x: plot.x1 - inset - w, y: plot.y1 - inset - h, corner: "br" },
  ];
  // A little breathing room around the box, so a line grazing the edge
  // still counts as crossing.
  const room = 6;
  for (const at of corners) {
    const box = {
      x: at.x - room,
      y: at.y - room,
      width: w + room * 2,
      height: h + room * 2,
    };
    if (!segments.some((segment) => crosses(segment, box))) return at;
  }
  return null;
}
