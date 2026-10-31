// @ts-check

/**
 * @typedef {{ left: number; top: number; width: number; height: number }} Box
 * @typedef {{ side: "top" | "right" | "bottom" | "left"; value: number; x: number; y: number }} SideLabel
 * @typedef {{ x1: number; y1: number; x2: number; y2: number; value: number }} Segment
 */

/**
 * Signed distance from `y` to the nearest baseline row, rounded to 0.1px,
 * or `null` without rows. Rows sit at `offset + n * step`.
 * @param {number} y
 * @param {number} step
 * @param {number} offset
 * @returns {number | null}
 */
export function rowDelta(y, step, offset) {
  if (!(step > 0)) return null;
  const mod = (((y - offset) % step) + step) % step;
  const delta = mod > step / 2 ? mod - step : mod;
  return Math.round(delta * 10) / 10;
}

/**
 * Margin, padding, and content boxes of an element from its border box
 * and its side widths (top, right, bottom, left). Negative margins draw
 * as zero.
 * @param {Box} rect border box
 * @param {number[]} margin
 * @param {number[]} border
 * @param {number[]} padding
 */
export function boxes(rect, margin, border, padding) {
  const [mt, mr, mb, ml] = margin.map((v) => Math.max(0, v));
  /** @type {Box} */
  const marginBox = {
    left: rect.left - ml,
    top: rect.top - mt,
    width: rect.width + ml + mr,
    height: rect.height + mt + mb,
  };
  /** @type {Box} */
  const paddingBox = {
    left: rect.left + border[3],
    top: rect.top + border[0],
    width: Math.max(0, rect.width - border[1] - border[3]),
    height: Math.max(0, rect.height - border[0] - border[2]),
  };
  /** @type {Box} */
  const contentBox = {
    left: paddingBox.left + padding[3],
    top: paddingBox.top + padding[0],
    width: Math.max(0, paddingBox.width - padding[1] - padding[3]),
    height: Math.max(0, paddingBox.height - padding[0] - padding[2]),
  };
  return { marginBox, paddingBox, contentBox, marginWidths: [mt, mr, mb, ml] };
}

/**
 * Labels centered in each non-zero side of the ring between `outer` and
 * `inner`.
 * @param {Box} outer
 * @param {Box} inner
 * @param {number[]} values top, right, bottom, left (signed)
 * @returns {SideLabel[]}
 */
export function ringLabels(outer, inner, values) {
  const cx = inner.left + inner.width / 2;
  const cy = inner.top + inner.height / 2;
  const [t, r, b, l] = values;
  /** @type {SideLabel[]} */
  const labels = [];
  if (t)
    labels.push({
      side: "top",
      value: t,
      x: cx,
      y: (outer.top + inner.top) / 2,
    });
  if (r) {
    labels.push({
      side: "right",
      value: r,
      x: (inner.left + inner.width + outer.left + outer.width) / 2,
      y: cy,
    });
  }
  if (b) {
    labels.push({
      side: "bottom",
      value: b,
      x: cx,
      y: (inner.top + inner.height + outer.top + outer.height) / 2,
    });
  }
  if (l)
    labels.push({
      side: "left",
      value: l,
      x: (outer.left + inner.left) / 2,
      y: cy,
    });
  return labels;
}

/**
 * Distance segments between two ranges on one axis. Separated ranges get
 * one segment across the gap; overlapping or nested ranges get one
 * segment per pair of edges that differ.
 * @param {number} a1
 * @param {number} a2
 * @param {number} b1
 * @param {number} b2
 * @returns {[number, number][]}
 */
export function axisSegments(a1, a2, b1, b2) {
  if (b1 >= a2) return [[a2, b1]];
  if (a1 >= b2) return [[b2, a1]];
  /** @type {[number, number][]} */
  const out = [];
  if (Math.abs(a1 - b1) >= 0.5) out.push([Math.min(a1, b1), Math.max(a1, b1)]);
  if (Math.abs(a2 - b2) >= 0.5) out.push([Math.min(a2, b2), Math.max(a2, b2)]);
  return out;
}

/**
 * Where to draw a segment across the other axis: the middle of the
 * overlap if there is one, else the middle of the first range.
 * @param {number} a1
 * @param {number} a2
 * @param {number} b1
 * @param {number} b2
 */
export function crossCenter(a1, a2, b1, b2) {
  const lo = Math.max(a1, b1);
  const hi = Math.min(a2, b2);
  return hi > lo ? (lo + hi) / 2 : (a1 + a2) / 2;
}

/**
 * Horizontal and vertical distance segments from rect `a` to rect `b`.
 * @param {{ left: number; top: number; right: number; bottom: number }} a
 * @param {{ left: number; top: number; right: number; bottom: number }} b
 * @returns {Segment[]}
 */
export function distanceSegments(a, b) {
  const y = crossCenter(a.top, a.bottom, b.top, b.bottom);
  const x = crossCenter(a.left, a.right, b.left, b.right);
  return [
    ...axisSegments(a.left, a.right, b.left, b.right).map(([x1, x2]) => ({
      x1,
      x2,
      y1: y,
      y2: y,
      value: x2 - x1,
    })),
    ...axisSegments(a.top, a.bottom, b.top, b.bottom).map(([y1, y2]) => ({
      x1: x,
      x2: x,
      y1,
      y2,
      value: y2 - y1,
    })),
  ];
}

/**
 * @param {Box} a
 * @param {Box} b
 */
function contains(a, b) {
  return (
    a.left <= b.left + 0.5 &&
    a.top <= b.top + 0.5 &&
    a.left + a.width >= b.left + b.width - 0.5 &&
    a.top + a.height >= b.top + b.height - 0.5
  );
}

/**
 * Distance from a point to the nearest point of a box; 0 inside it.
 * @param {number} x
 * @param {number} y
 * @param {Box} box
 */
function pointToBox(x, y, box) {
  const dx = Math.max(box.left - x, 0, x - (box.left + box.width));
  const dy = Math.max(box.top - y, 0, y - (box.top + box.height));
  return Math.hypot(dx, dy);
}

/**
 * The targets that fail WCAG 2.2 target size (2.5.8), each with the target
 * that crowds it most and how many pixels more room it needs. A target
 * passes when it is at least `size` pixels in both dimensions, or when it
 * is spaced: a circle of diameter `size` centered on it intersects no
 * other target and no other undersized target's circle. Targets nested in
 * each other count as one. With `layers`, only targets in the same layer
 * meet: a fixed header that scrolls over the page does not crowd the
 * page's targets.
 * @param {Box[]} targets
 * @param {number} size
 * @param {unknown[]} [layers] one key per target
 * @returns {{ index: number; by: number; needs: number }[]}
 */
export function targetConflicts(targets, size, layers) {
  const radius = size / 2;
  const small = targets.map((t) => t.width < size || t.height < size);
  const centers = targets.map((t) => [
    t.left + t.width / 2,
    t.top + t.height / 2,
  ]);
  /** @type {{ index: number; by: number; needs: number }[]} */
  const conflicts = [];
  targets.forEach((target, i) => {
    if (!small[i]) return;
    const [cx, cy] = centers[i];
    let by = -1;
    let needs = 0;
    targets.forEach((other, j) => {
      if (
        j === i ||
        (layers && layers[i] !== layers[j]) ||
        contains(target, other) ||
        contains(other, target)
      ) {
        return;
      }
      // How far the circle reaches into the other target, or into the
      // other small target's circle.
      const intoBox = radius - pointToBox(cx, cy, other);
      const intoCircle = small[j]
        ? size - Math.hypot(cx - centers[j][0], cy - centers[j][1])
        : 0;
      const overlap = Math.max(intoBox, intoCircle);
      if (overlap > 0.01 && overlap > needs) {
        by = j;
        needs = overlap;
      }
    });
    if (by !== -1) {
      conflicts.push({ index: i, by, needs: Math.ceil(needs * 10) / 10 });
    }
  });
  return conflicts;
}

/**
 * Indexes of the targets that fail WCAG 2.2 target size (2.5.8). A target
 * passes when it is at least `size` pixels in both dimensions, or when it
 * is spaced: a circle of diameter `size` centered on it intersects no
 * other target and no other undersized target's circle. Targets nested
 * in each other count as one. With `layers`, only targets in the same
 * layer meet: a fixed header that scrolls over the page does not crowd
 * the page's targets.
 * @param {Box[]} targets
 * @param {number} size
 * @param {unknown[]} [layers] one key per target
 * @returns {number[]}
 */
export function failingTargets(targets, size, layers) {
  return targetConflicts(targets, size, layers).map((c) => c.index);
}

/**
 * Labels for page marks, merging labels that would overlap. Each label
 * sits above the top-left corner of its mark, so marks in a row, such as
 * a toolbar of small icon buttons, would print over each other. Marks
 * with the same `group` whose labels collide share one label on the
 * first: "16 × 16 · +2 more". The others keep their outline but get no
 * label (`null`). Label widths are estimated from the text length, so
 * nothing is measured.
 * @param {{ x: number; y: number; text: string; group: string }[]} marks
 * @param {{ charWidth?: number; padding?: number; height?: number }} [metrics]
 * @returns {(string | null)[]}
 */
export function mergeLabels(marks, metrics = {}) {
  const { charWidth = 7, padding = 16, height = 20 } = metrics;
  /** @param {string} text */
  const width = (text) => text.length * charWidth + padding;
  /** @type {(string | null)[]} */
  const labels = marks.map((m) => m.text);
  /** @type {{ group: string; y: number; right: number; lead: number; count: number }[]} */
  const clusters = [];
  const order = marks
    .map((_, index) => index)
    .sort((a, b) => marks[a].y - marks[b].y || marks[a].x - marks[b].x);
  for (const index of order) {
    const m = marks[index];
    const cluster = clusters.find(
      (c) =>
        c.group === m.group && Math.abs(c.y - m.y) < height && m.x < c.right,
    );
    if (!cluster) {
      clusters.push({
        group: m.group,
        y: m.y,
        right: m.x + width(m.text),
        lead: index,
        count: 1,
      });
      continue;
    }
    cluster.count += 1;
    labels[index] = null;
    const lead = marks[cluster.lead];
    cluster.right = Math.max(
      cluster.right,
      m.x + width(m.text),
      // The merged label is longer than the lead's own.
      lead.x + width(`${lead.text} · +${cluster.count - 1} more`),
    );
  }
  for (const c of clusters) {
    if (c.count > 1)
      labels[c.lead] = `${marks[c.lead].text} · +${c.count - 1} more`;
  }
  return labels;
}
