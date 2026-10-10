// @ts-check
// Card and link geometry for `OrgChart`: the tree layout stood upright,
// kept out of the component so a test can count how often it runs.

import { categoricalColors, vizColor } from "../utils/tokens.js";
import { treeLayout } from "../utils/tree-layout.js";

/**
 * Lay the tree out top down: the root on top, each level a row of cards,
 * and every parent centered over its children. Nodes inside a collapsed
 * node are left out, and the node that folds them keeps their count. Cards
 * take the color of their group, when one is read.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./org-geometry.d.ts").OrgOptions<T>} options
 * @returns {import("./org-geometry.d.ts").Org<T>}
 */
export function buildOrg(rows, options) {
  const {
    id,
    parent,
    label,
    sublabel,
    group,
    collapsed = [],
    nodeWidth,
    nodeHeight,
    rankGap,
    nodeGap,
    palette = 1,
    colors = {},
  } = options;

  // The whole tree once, to learn who descends from whom, then the part
  // that is not folded away.
  const whole = treeLayout(rows, { id, parent, width: 1, height: 1 });
  const closed = new Set(collapsed.map(String));
  /** @type {Set<string>} */
  const hiddenIds = new Set();
  /** @type {Map<string, number>} */
  const under = new Map();
  for (const node of whole.nodes) {
    const up = node.parent;
    if (up && (closed.has(up.id) || hiddenIds.has(up.id))) {
      hiddenIds.add(node.id);
      let at = up;
      while (at) {
        if (closed.has(at.id)) {
          under.set(at.id, (under.get(at.id) ?? 0) + 1);
          break;
        }
        at = at.parent;
      }
    }
  }
  /** @type {Map<string, number>} */
  const childCount = new Map();
  for (const node of whole.nodes) childCount.set(node.id, node.children.length);

  const visible = rows.filter((row, i) => !hiddenIds.has(String(id(row, i))));
  const step = nodeWidth + nodeGap;
  const rise = nodeHeight + rankGap;
  const layout = treeLayout(visible, {
    id,
    parent,
    // Across is the tree's y, down is its x: a column per depth becomes a
    // row per level.
    width: 1,
    height: 1,
  });
  const leaves = Math.max(layout.leaves, 1);
  const across = leaves * step - nodeGap;
  const depth = layout.depth;

  /** @type {string[]} */
  const keys = [];
  const groupOf = new Map(
    layout.nodes.map((node) => {
      const index = rows.indexOf(node.row);
      const raw = group ? group(node.row, index) : undefined;
      const key = raw === undefined || raw === null ? undefined : String(raw);
      if (key !== undefined && !keys.includes(key)) keys.push(key);
      return [node.id, key];
    }),
  );
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

  const nodes = layout.nodes.map((node, order) => {
    const index = rows.indexOf(node.row);
    const key = groupOf.get(node.id);
    // The layout spreads leaves over [0, 1] across and depths over [0, 1]
    // down; a single leaf or level sits at the start.
    const x = leaves > 1 ? node.y * (across - nodeWidth) : 0;
    const y = node.depth * rise;
    return {
      id: node.id,
      index: order,
      row: node.row,
      label: label ? String(label(node.row, index) ?? node.id) : node.id,
      sublabel: sublabel ? String(sublabel(node.row, index) ?? "") : "",
      group: key,
      color: key === undefined ? undefined : colorOf.get(key),
      parentId: node.parent ? node.parent.id : null,
      depth: node.depth,
      x,
      y,
      branch: (childCount.get(node.id) ?? 0) > 0,
      collapsed: closed.has(node.id) && (childCount.get(node.id) ?? 0) > 0,
      childCount: childCount.get(node.id) ?? 0,
      hidden: under.get(node.id) ?? 0,
    };
  });
  const at = new Map(nodes.map((node) => [node.id, node]));
  const links = layout.links.map((link) => {
    const from = /** @type {(typeof nodes)[number]} */ (at.get(link.source.id));
    const to = /** @type {(typeof nodes)[number]} */ (at.get(link.target.id));
    const x1 = from.x + nodeWidth / 2;
    const y1 = from.y + nodeHeight;
    const x2 = to.x + nodeWidth / 2;
    const y2 = to.y;
    const mid = y1 + rankGap / 2;
    return {
      id: `${from.id}/${to.id}`,
      d: `M${x1},${y1}V${mid}H${x2}V${y2}`,
    };
  });

  return {
    nodes,
    links,
    width: across,
    height: depth * rise + nodeHeight,
    groups: keys.map((key) => ({
      key,
      color: /** @type {string} */ (colorOf.get(key)),
    })),
  };
}
