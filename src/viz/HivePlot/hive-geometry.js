// @ts-check
// Axis, node, and link geometry for `HivePlot`: an axis per kind of node
// out from the center, nodes along their axis, and a curve per link.

import { categoricalColors, vizColor } from "../utils/tokens.js";

const TAU = Math.PI * 2;

/** @param {number} value */
function fmt(value) {
  return `${Math.round(value * 100) / 100}`;
}

/**
 * Axes spaced evenly around the center, one per kind in first-seen or
 * given order. A node sits on its axis by its given position, else by
 * how many links touch it, the most linked farthest out. A link is a
 * curve bent toward the center, or a small loop out from the axis when
 * both ends share one.
 *
 * @template N
 * @template L
 * @param {ReadonlyArray<N>} nodes
 * @param {ReadonlyArray<L>} links
 * @param {import("./hive-geometry.d.ts").HiveOptions<N, L>} options
 * @returns {import("./hive-geometry.d.ts").Hive<N, L>}
 */
export function buildHive(nodes, links, options) {
  const {
    id,
    label,
    axis: axisOf,
    position,
    source,
    target,
    value,
    axes: order,
    radius,
    innerRadius,
    palette = 1,
    colors = {},
  } = options;

  /** @type {string[]} */
  const axisKeys = order ? order.map(String) : [];
  const entries = nodes.map((row, i) => {
    const kind = String(axisOf(row, i));
    if (!axisKeys.includes(kind)) axisKeys.push(kind);
    const raw = position ? position(row, i) : undefined;
    const given = raw === null || raw === undefined ? Number.NaN : Number(raw);
    return {
      key: String(id(row, i)),
      label: label ? String(label(row, i) ?? id(row, i)) : String(id(row, i)),
      axis: kind,
      given,
      degree: 0,
      datum: row,
      index: i,
    };
  });
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));

  const edges = links.flatMap((row, i) => {
    const from = byKey.get(String(source(row, i)));
    const to = byKey.get(String(target(row, i)));
    if (!from || !to) return [];
    const raw = value ? value(row, i) : 1;
    const amount = raw === null || raw === undefined ? 1 : Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return [];
    from.degree += 1;
    if (to !== from) to.degree += 1;
    return [{ from, to, value: amount, datum: row, index: i }];
  });

  const assigned = categoricalColors(axisKeys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  axisKeys.forEach((key, i) => {
    const fixed = colors[key];
    colorOf.set(
      key,
      fixed === undefined ? assigned[i] : (vizColor(fixed) ?? assigned[i]),
    );
  });

  // The angle of each axis, starting at 12 o'clock.
  const angleOf = new Map(
    axisKeys.map((key, i) => [key, (i / axisKeys.length) * TAU]),
  );
  const axes = axisKeys.map((key) => {
    const angle = /** @type {number} */ (angleOf.get(key));
    return {
      key,
      angle,
      color: /** @type {string} */ (colorOf.get(key)),
      x1: innerRadius * Math.sin(angle),
      y1: -innerRadius * Math.cos(angle),
      x2: radius * Math.sin(angle),
      y2: -radius * Math.cos(angle),
      labelX: (radius + 14) * Math.sin(angle),
      labelY: -(radius + 14) * Math.cos(angle),
      count: 0,
    };
  });

  // Nodes take their place along the axis: by the given position, or by
  // degree, spread in rank order so none sit on top of another.
  const placed = axisKeys.flatMap((key) => {
    const own = entries.filter((entry) => entry.axis === key);
    const useGiven =
      own.length > 0 && own.every((entry) => Number.isFinite(entry.given));
    const measure = (/** @type {(typeof own)[number]} */ entry) =>
      useGiven ? entry.given : entry.degree;
    const sorted = [...own].sort(
      (a, b) => measure(a) - measure(b) || a.index - b.index,
    );
    const lo = sorted.length ? measure(sorted[0]) : 0;
    const hi = sorted.length ? measure(sorted[sorted.length - 1]) : 0;
    const angle = /** @type {number} */ (angleOf.get(key));
    const axisEntry = /** @type {(typeof axes)[number]} */ (
      axes.find((entry) => entry.key === key)
    );
    axisEntry.count = own.length;
    return sorted.map((entry, rank) => {
      const t =
        useGiven && hi > lo
          ? (measure(entry) - lo) / (hi - lo)
          : sorted.length > 1
            ? rank / (sorted.length - 1)
            : 0.5;
      const r = innerRadius + t * (radius - innerRadius);
      return {
        key: entry.key,
        label: entry.label,
        axis: key,
        color: /** @type {string} */ (colorOf.get(key)),
        degree: entry.degree,
        position: useGiven ? entry.given : entry.degree,
        rank,
        r,
        x: r * Math.sin(angle),
        y: -r * Math.cos(angle),
        datum: entry.datum,
        index: entry.index,
      };
    });
  });
  const at = new Map(placed.map((node) => [node.key, node]));

  const curves = edges.map((edge) => {
    const from = /** @type {(typeof placed)[number]} */ (at.get(edge.from.key));
    const to = /** @type {(typeof placed)[number]} */ (at.get(edge.to.key));
    let d;
    if (from.axis === to.axis) {
      // A loop out from the axis, bulging away from the center.
      const angle = /** @type {number} */ (angleOf.get(from.axis));
      const mid = (from.r + to.r) / 2;
      const bulge = Math.max(Math.abs(from.r - to.r) * 0.6, 12);
      const cx = mid * Math.sin(angle) + bulge * Math.cos(angle);
      const cy = -mid * Math.cos(angle) + bulge * Math.sin(angle);
      d = `M${fmt(from.x)},${fmt(from.y)}Q${fmt(cx)},${fmt(cy)} ${fmt(to.x)},${fmt(to.y)}`;
    } else {
      // Bent toward the center, so links between neighboring axes read as
      // a bundle rather than a straight fan.
      const cx = (from.x + to.x) * 0.25;
      const cy = (from.y + to.y) * 0.25;
      d = `M${fmt(from.x)},${fmt(from.y)}Q${fmt(cx)},${fmt(cy)} ${fmt(to.x)},${fmt(to.y)}`;
    }
    return {
      id: `${from.key}\u0000${to.key}\u0000${edge.index}`,
      source: from.key,
      target: to.key,
      value: edge.value,
      color: from.color,
      datum: edge.datum,
      index: edge.index,
      d,
    };
  });

  return { axes, nodes: placed, links: curves };
}
