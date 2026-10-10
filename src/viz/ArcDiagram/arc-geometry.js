// @ts-check
// Node and arc geometry for `ArcDiagram`: nodes on one line, an arc per
// link above it, and below it when the link runs backward.

import { categoricalColors, vizColor } from "../utils/tokens.js";

/** @param {number} value */
function fmt(value) {
  return `${Math.round(value * 100) / 100}`;
}

/**
 * Nodes spaced evenly along a line, in the given order, by group, or by
 * how many links touch them, and a semicircle per link whose stroke
 * follows its value. In a directed diagram a link from a later node to
 * an earlier one arcs under the line.
 *
 * @template N
 * @template L
 * @param {ReadonlyArray<N>} nodes
 * @param {ReadonlyArray<L>} links
 * @param {import("./arc-geometry.d.ts").ArcDiagramOptions<N, L>} options
 * @returns {import("./arc-geometry.d.ts").ArcDiagram<N, L>}
 */
export function buildArcDiagram(nodes, links, options) {
  const {
    id,
    label,
    group,
    source,
    target,
    value,
    sort = "none",
    directed = false,
    width,
    strokeRange = [1, 8],
    palette = 1,
    colors = {},
  } = options;

  const entries = nodes.map((row, i) => {
    const raw = group ? group(row, i) : undefined;
    return {
      key: String(id(row, i)),
      label: label ? String(label(row, i) ?? id(row, i)) : String(id(row, i)),
      group: raw === undefined || raw === null ? undefined : String(raw),
      datum: row,
      index: i,
      degree: 0,
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

  /** @type {string[]} */
  const groupKeys = [];
  for (const entry of entries) {
    if (entry.group !== undefined && !groupKeys.includes(entry.group)) {
      groupKeys.push(entry.group);
    }
  }
  const ordered = [...entries];
  if (sort === "group") {
    ordered.sort(
      (a, b) =>
        groupKeys.indexOf(a.group ?? "") - groupKeys.indexOf(b.group ?? "") ||
        a.index - b.index,
    );
  } else if (sort === "degree") {
    ordered.sort((a, b) => b.degree - a.degree || a.index - b.index);
  }

  const assigned = categoricalColors(groupKeys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  groupKeys.forEach((key, i) => {
    const fixed = colors[key];
    colorOf.set(
      key,
      fixed === undefined ? assigned[i] : (vizColor(fixed) ?? assigned[i]),
    );
  });

  const step = ordered.length > 1 ? width / (ordered.length - 1) : 0;
  const placed = ordered.map((entry, order) => ({
    key: entry.key,
    label: entry.label,
    group: entry.group,
    color: entry.group === undefined ? undefined : colorOf.get(entry.group),
    datum: entry.datum,
    index: entry.index,
    order,
    degree: entry.degree,
    x: ordered.length > 1 ? order * step : width / 2,
  }));
  const at = new Map(placed.map((node) => [node.key, node]));

  const values = edges.map((edge) => edge.value);
  const most = values.length ? Math.max(...values) : 1;
  const least = values.length ? Math.min(...values) : 1;
  const [thin, thick] = strokeRange;
  let above = 0;
  let below = 0;
  const arcs = edges.map((edge) => {
    const from = /** @type {(typeof placed)[number]} */ (at.get(edge.from.key));
    const to = /** @type {(typeof placed)[number]} */ (at.get(edge.to.key));
    const backward = directed && to.order < from.order;
    const x1 = Math.min(from.x, to.x);
    const x2 = Math.max(from.x, to.x);
    const r = Math.max((x2 - x1) / 2, 4);
    if (backward) below = Math.max(below, r);
    else above = Math.max(above, r);
    const stroke =
      most > least
        ? thin + ((edge.value - least) / (most - least)) * (thick - thin)
        : (thin + thick) / 2;
    return {
      id: `${edge.from.key}\u0000${edge.to.key}\u0000${edge.index}`,
      source: from.key,
      target: to.key,
      value: edge.value,
      backward,
      stroke,
      color: from.color,
      datum: edge.datum,
      index: edge.index,
      // A semicircle, over the line or under it for a backward link.
      d:
        from.x === to.x
          ? `M${fmt(x1)},0A4,4,0,1,${backward ? 0 : 1},${fmt(x1 + 0.01)},0`
          : `M${fmt(x1)},0A${fmt(r)},${fmt(r)},0,0,${backward ? 0 : 1},${fmt(x2)},0`,
    };
  });

  return {
    nodes: placed,
    links: arcs,
    above,
    below,
    groups: groupKeys.map((key) => ({
      key,
      color: /** @type {string} */ (colorOf.get(key)),
    })),
  };
}
