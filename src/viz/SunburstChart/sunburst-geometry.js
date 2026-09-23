// @ts-check
// Ring and arc geometry for `SunburstChart`: the partition wrapped around a
// center, kept out of the component so a test can count how often it runs.

import { partition } from "../utils/partition.js";
import { arcCentroid, pathArc } from "../utils/path-arc.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

const TAU = Math.PI * 2;

/**
 * Lay the tree out as rings: the root, or the node drilled into, is the
 * center, its children the first ring, and so on outward, each node an arc
 * as wide as its share. Ancestors of a drilled root are not drawn; the
 * center stands for the way back up. Nodes take the color of their branch,
 * the ancestor just under the center, or a group of their own.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./sunburst-geometry.d.ts").SunburstOptions<T>} options
 * @returns {import("./sunburst-geometry.d.ts").Sunburst<T>}
 */
export function buildSunburst(rows, options) {
  const {
    id,
    parent,
    value,
    label,
    group,
    sort = "none",
    root,
    maxDepth,
    radius,
    innerRadius = 0.25,
    padAngle = 0.004,
    palette = 1,
    colors = {},
  } = options;

  const tree = partition(rows, {
    id,
    parent,
    value,
    label,
    sort,
    root,
    maxDepth: maxDepth === undefined ? undefined : maxDepth + 1,
  });
  const drawn = tree.nodes.filter((node) => !node.ancestor);
  const tops = drawn.filter((node) => node.depth === tree.ancestors);
  // A lone node at the top is the center; several share the first ring.
  const center = tops.length === 1 ? tops[0] : null;
  const first = center ? tree.ancestors + 1 : tree.ancestors;
  let deepest = 0;
  for (const node of drawn) deepest = Math.max(deepest, node.depth - first);
  const rings = deepest + 1;
  const hole = radius * Math.min(Math.max(innerRadius, 0), 0.9);
  const step = rings > 0 ? (radius - hole) / rings : 0;

  // Color by branch, the node just under the center, or by group.
  /** @type {Map<string, string>} */
  const keyOf = new Map();
  /** @type {string[]} */
  const keys = [];
  for (const node of tree.nodes) {
    let key;
    if (group) key = String(group(node.datum, node.index));
    else if (node.ancestor || node === center) key = "";
    else {
      const up = node.parent === null ? undefined : keyOf.get(node.parent);
      key = up === undefined || up === "" ? node.id : up;
    }
    keyOf.set(node.id, key);
    if (key !== "" && !keys.includes(key)) keys.push(key);
  }
  const assigned = categoricalColors(keys.length, palette);
  /** @type {Map<string, string>} */
  const colorOf = new Map();
  keys.forEach((key, i) => {
    colorOf.set(
      key,
      colors[key] === undefined
        ? assigned[i]
        : (vizColor(colors[key]) ?? assigned[i]),
    );
  });

  const arcs = drawn
    .filter((node) => node !== center && node.x1 > node.x0)
    .map((node) => {
      const ring = node.depth - first;
      const shape = {
        cx: radius,
        cy: radius,
        innerRadius: hole + ring * step,
        outerRadius: hole + (ring + 1) * step,
        startAngle: (node.x0 / 100) * TAU,
        endAngle: (node.x1 / 100) * TAU,
        padAngle,
      };
      const at = arcCentroid(shape);
      return {
        id: node.id,
        parent: node.parent,
        label: node.label,
        depth: node.depth,
        ring,
        value: node.value,
        own: node.own,
        share: node.share,
        leaf: node.leaf,
        datum: node.datum,
        index: node.index,
        group: keyOf.get(node.id) ?? "",
        color:
          colorOf.get(keyOf.get(node.id) ?? "") ?? "var(--cds-viz-neutral)",
        d: pathArc(shape),
        cx: at.x,
        cy: at.y,
      };
    });

  return {
    total: tree.total,
    center: center
      ? {
          id: center.id,
          parent: center.parent,
          label: center.label,
          value: center.value,
          datum: center.datum,
        }
      : null,
    rings,
    hole,
    arcs,
    groups: keys.map((key) => ({
      key,
      label: group
        ? key
        : (tree.nodes.find((node) => node.id === key)?.label ?? key),
      color: /** @type {string} */ (colorOf.get(key)),
    })),
  };
}
