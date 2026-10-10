// @ts-check
// Cell geometry for `TreemapChart`, kept out of the component so a test can
// count how often it runs.

import { categoricalColors, vizColor } from "../utils/tokens.js";
import { squarify } from "../utils/treemap.js";

/**
 * Sum `rows` by label, tile the groups into a box of the given aspect ratio,
 * then tile each group's leaves inside it. Rectangles are percentages: a
 * group's of the whole, a leaf's of its group, which is how nested absolutely
 * positioned elements want them. Without a `group` accessor every leaf is its
 * own group. Groups and leaves come out largest first.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./treemap-geometry.d.ts").TreemapOptions<T>} options
 * @returns {import("./treemap-geometry.d.ts").Treemap<T>}
 */
export function buildTreemap(rows, options) {
  const { value, label, group, aspect = 2, palette = 1, colors = {} } = options;

  /** @type {Map<string, Map<string, { value: number; rows: T[] }>>} */
  const tree = new Map();
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const amount = Number(value(rows[i], i));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const leafKey = String(label(rows[i], i));
    const groupKey = group ? String(group(rows[i], i)) : leafKey;
    let leaves = tree.get(groupKey);
    if (!leaves) {
      leaves = new Map();
      tree.set(groupKey, leaves);
    }
    const leaf = leaves.get(leafKey);
    if (leaf) {
      leaf.value += amount;
      leaf.rows.push(rows[i]);
    } else {
      leaves.set(leafKey, { value: amount, rows: [rows[i]] });
    }
    total += amount;
  }

  const entries = [...tree].map(([key, leaves]) => {
    let sum = 0;
    for (const leaf of leaves.values()) sum += leaf.value;
    return { key, leaves, value: sum };
  });
  entries.sort((a, b) => b.value - a.value);

  const assigned = categoricalColors(entries.length, palette);
  // Lay out in a box of the real aspect ratio, so "square" means square on
  // screen, then express everything as percentages.
  const boxes = squarify(
    entries.map((entry) => entry.value),
    { x: 0, y: 0, width: aspect, height: 1 },
  );

  return {
    total,
    grouped: Boolean(group),
    groups: entries.map((entry, g) => {
      const box = boxes[g];
      const leaves = [...entry.leaves].map(([key, leaf]) => ({ key, ...leaf }));
      leaves.sort((a, b) => b.value - a.value);
      const cells = squarify(
        leaves.map((leaf) => leaf.value),
        box,
      );
      return {
        key: entry.key,
        value: entry.value,
        share: total > 0 ? entry.value / total : 0,
        color:
          colors[entry.key] === undefined
            ? assigned[g]
            : (vizColor(colors[entry.key]) ?? assigned[g]),
        rect: {
          x: (box.x / aspect) * 100,
          y: box.y * 100,
          width: (box.width / aspect) * 100,
          height: box.height * 100,
        },
        leaves: leaves.map((leaf, l) => {
          const cell = cells[l];
          return {
            id: `${entry.key}/${leaf.key}`,
            key: leaf.key,
            group: entry.key,
            value: leaf.value,
            share: total > 0 ? leaf.value / total : 0,
            rows: leaf.rows,
            span: { width: cell.width / aspect, height: cell.height },
            rect: {
              x: box.width > 0 ? ((cell.x - box.x) / box.width) * 100 : 0,
              y: box.height > 0 ? ((cell.y - box.y) / box.height) * 100 : 0,
              width: box.width > 0 ? (cell.width / box.width) * 100 : 0,
              height: box.height > 0 ? (cell.height / box.height) * 100 : 0,
            },
          };
        }),
      };
    }),
  };
}
