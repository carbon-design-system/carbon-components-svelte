// @ts-check
// Arc and ribbon geometry for `ChordDiagram`: a group per node around a
// circle, sized by the flow it touches, and a ribbon per pair of nodes.

import { pathArc } from "../utils/path-arc.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

const TAU = Math.PI * 2;

/** @param {number} value */
function fmt(value) {
  return `${Math.round(value * 100) / 100}`;
}

/**
 * @param {number} radius
 * @param {number} angle
 */
function point(radius, angle) {
  return `${fmt(radius * Math.sin(angle))},${fmt(-radius * Math.cos(angle))}`;
}

/**
 * A ribbon between two sub-arcs: along one, a curve through the center
 * to the other, along it, and back. A loop within one sub-arc goes along
 * it and curves back to its own start. Angles are radians from 12 o'clock.
 *
 * @param {number} r
 * @param {[number, number]} a
 * @param {[number, number]} b
 */
function ribbon(r, a, b) {
  const largeA = a[1] - a[0] > Math.PI ? 1 : 0;
  const along = `M${point(r, a[0])}A${fmt(r)},${fmt(r)},0,${largeA},1,${point(r, a[1])}`;
  if (a === b) return `${along}Q0,0 ${point(r, a[0])}Z`;
  const largeB = b[1] - b[0] > Math.PI ? 1 : 0;
  return (
    `${along}Q0,0 ${point(r, b[0])}A${fmt(r)},${fmt(r)},0,${largeB},1,${point(r, b[1])}` +
    `Q0,0 ${point(r, a[0])}Z`
  );
}

/**
 * Groups around the circle in node order, each sized by what flows out
 * of it, and one ribbon per pair of nodes. A
 * ribbon's end in each group is as wide as the flow leaving that group
 * for the other, so both directions read from one shape. A flow from a
 * node to itself is a loop within its own group.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./chord-geometry.d.ts").ChordOptions<T>} options
 * @returns {import("./chord-geometry.d.ts").Chord<T>}
 */
export function buildChord(rows, options) {
  const {
    source,
    target,
    value,
    nodes: order,
    radius,
    thickness,
    padAngle = 0.04,
    sort = "none",
    palette = 1,
    colors = {},
  } = options;

  /** @type {string[]} */
  const keys = order ? order.map(String) : [];
  /** @type {Map<string, Map<string, { value: number; rows: T[] }>>} */
  const flows = new Map();
  rows.forEach((row, i) => {
    const from = String(source(row, i));
    const to = String(target(row, i));
    const raw = value(row, i);
    const amount = raw === null || raw === undefined ? 0 : Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!keys.includes(from)) keys.push(from);
    if (!keys.includes(to)) keys.push(to);
    let out = flows.get(from);
    if (!out) {
      out = new Map();
      flows.set(from, out);
    }
    const cell = out.get(to) ?? { value: 0, rows: [] };
    cell.value += amount;
    cell.rows.push(row);
    out.set(to, cell);
  });
  const flow = (/** @type {string} */ a, /** @type {string} */ b) =>
    flows.get(a)?.get(b)?.value ?? 0;

  // A group's size is everything it sends; what it receives shows in the
  // ribbons arriving from the other groups.
  const totals = keys.map((key) =>
    keys.reduce((sum, other) => sum + flow(key, other), 0),
  );
  let ranked = keys.map((key, i) => ({ key, total: totals[i], index: i }));
  if (sort === "value") ranked = [...ranked].sort((a, b) => b.total - a.total);
  const whole = totals.reduce((sum, total) => sum + total, 0);
  const pad = ranked.length > 1 ? padAngle : 0;
  const sweep = TAU - pad * ranked.length;

  const assigned = categoricalColors(keys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  keys.forEach((key, i) => {
    const fixed = colors[key];
    colorOf.set(
      key,
      fixed === undefined ? assigned[i] : (vizColor(fixed) ?? assigned[i]),
    );
  });

  // Each group's arc, then within it a sub-arc per partner in group
  // order, as wide as what it sends to that partner.
  const inner = radius - thickness;
  /** @type {Map<string, Map<string, [number, number]>>} */
  const sub = new Map();
  let angle = 0;
  const groups = ranked.map((entry) => {
    const start = angle;
    const span = whole > 0 ? (entry.total / whole) * sweep : 0;
    /** @type {Map<string, [number, number]>} */
    const parts = new Map();
    let at = start;
    for (const other of ranked) {
      const amount = flow(entry.key, other.key);
      const width = whole > 0 ? (amount / whole) * sweep : 0;
      parts.set(other.key, [at, at + width]);
      at += width;
    }
    sub.set(entry.key, parts);
    angle = start + span + pad;
    const mid = start + span / 2;
    const received = keys.reduce(
      (sum, other) => sum + flow(other, entry.key),
      0,
    );
    return {
      key: entry.key,
      index: entry.index,
      total: entry.total,
      out: entry.total,
      in: received,
      startAngle: start,
      endAngle: start + span,
      color: /** @type {string} */ (colorOf.get(entry.key)),
      d: pathArc({
        innerRadius: inner,
        outerRadius: radius,
        startAngle: start,
        endAngle: start + span,
      }),
      labelAngle: mid,
      labelX: (radius + 6) * Math.sin(mid),
      labelY: -(radius + 6) * Math.cos(mid),
      // Text on the left half is flipped so it never reads upside down.
      flip: mid > Math.PI,
    };
  });

  /** @type {import("./chord-geometry.d.ts").ChordRibbon<T>[]} */
  const ribbons = [];
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i; j < ranked.length; j++) {
      const a = ranked[i].key;
      const b = ranked[j].key;
      const ab = flow(a, b);
      const ba = a === b ? 0 : flow(b, a);
      if (ab <= 0 && ba <= 0) continue;
      // The heavier direction is the source, and colors the ribbon.
      const from = ab >= ba ? a : b;
      const to = from === a ? b : a;
      const partsA = /** @type {Map<string, [number, number]>} */ (sub.get(a));
      const partsB = /** @type {Map<string, [number, number]>} */ (sub.get(b));
      const endA = /** @type {[number, number]} */ (partsA.get(b));
      const endB = /** @type {[number, number]} */ (partsB.get(a));
      ribbons.push({
        id: `${a}\u0000${b}`,
        source: from,
        target: to,
        forward: from === a ? ab : ba,
        backward: from === a ? ba : ab,
        value: ab + ba,
        color: /** @type {string} */ (colorOf.get(from)),
        rows: [
          ...(flows.get(a)?.get(b)?.rows ?? []),
          ...(a === b ? [] : (flows.get(b)?.get(a)?.rows ?? [])),
        ],
        d: a === b ? ribbon(inner, endA, endA) : ribbon(inner, endA, endB),
      });
    }
  }

  return {
    groups,
    ribbons,
    total: whole,
    keys: ranked.map((entry) => entry.key),
  };
}
