// @ts-check
// Node and link geometry for `TreeChart`, kept out of the component so a test
// can count how often it runs.

import { treeLayout } from "../utils/tree-layout.js";

/**
 * Lay out the rows that are not inside a collapsed node. The layout leaves
 * `labelSpace` free on either side: branch labels hang to the left of their
 * node and leaf labels to the right.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./tree-geometry.d.ts").TreeOptions<T>} options
 * @returns {import("./tree-geometry.d.ts").Tree<T>}
 */
export function buildTree(rows, options) {
  const {
    id,
    parent,
    label,
    collapsed = [],
    width,
    height,
    labelSpace = 96,
    align = "depth",
  } = options;

  // Lay out the whole tree once to learn who descends from whom, then again
  // without what is folded away, so the visible part gets the full height.
  const whole = treeLayout(rows, { id, parent, width: 1, height: 1 });
  const closed = new Set(collapsed.map(String));
  /** @type {Set<string>} */
  const hiddenIds = new Set();
  for (const node of whole.nodes) {
    const up = node.parent;
    if (up && (closed.has(up.id) || hiddenIds.has(up.id)))
      hiddenIds.add(node.id);
  }
  /** @type {Map<string, number>} */
  const childCount = new Map();
  for (const node of whole.nodes) childCount.set(node.id, node.children.length);

  const visible = rows.filter((row, i) => !hiddenIds.has(String(id(row, i))));
  const inner = Math.max(width - labelSpace * 2, 1);
  const pad = 12;
  const layout = treeLayout(visible, {
    id,
    parent,
    width: inner,
    height: Math.max(height - pad * 2, 1),
    align,
  });

  return {
    nodes: layout.nodes.map((node, index) => {
      const kids = childCount.get(node.id) ?? 0;
      return {
        id: node.id,
        index,
        label: String(label(node.row, index)),
        row: node.row,
        parentId: node.parent ? node.parent.id : null,
        depth: node.depth,
        x: node.x + labelSpace,
        y: node.y + pad,
        branch: kids > 0,
        collapsed: kids > 0 && closed.has(node.id),
        childCount: kids,
      };
    }),
    links: layout.links.map((link) => ({
      id: `${link.source.id}/${link.target.id}`,
      path: shift(link.path, labelSpace, pad),
    })),
  };
}

/**
 * Move a path made of absolute `M` and `C` commands by an offset.
 * @param {string} path
 * @param {number} dx
 * @param {number} dy
 */
function shift(path, dx, dy) {
  let isX = true;
  return path.replace(/-?\d+(\.\d+)?/g, (match) => {
    const moved = Math.round((Number(match) + (isX ? dx : dy)) * 10) / 10;
    isX = !isX;
    return String(moved);
  });
}
