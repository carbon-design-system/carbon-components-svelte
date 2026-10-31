// @ts-check
// Flow geometry for `AlluvialChart`, kept out of the component so a test can
// count how often it runs.

import { sankey } from "../utils/sankey.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/**
 * Sum rows that share a source and a target, lay the network out, and color
 * each node. A ribbon takes the color of the node it leaves.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./alluvial-geometry.d.ts").AlluvialOptions<T>} options
 * @returns {import("./alluvial-geometry.d.ts").Alluvial<T>}
 */
export function buildAlluvial(rows, options) {
  const {
    source,
    target,
    value,
    palette = 1,
    colors = {},
    ...layout
  } = options;

  /** @type {Map<string, { source: string; target: string; value: number; rows: T[] }>} */
  const merged = new Map();
  for (let i = 0; i < rows.length; i++) {
    const amount = Number(value(rows[i], i));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const from = String(source(rows[i], i));
    const to = String(target(rows[i], i));
    // A key no pair of names can forge, whatever characters they hold.
    const key = JSON.stringify([from, to]);
    const entry = merged.get(key);
    if (entry) {
      entry.value += amount;
      entry.rows.push(rows[i]);
    } else {
      merged.set(key, {
        source: from,
        target: to,
        value: amount,
        rows: [rows[i]],
      });
    }
  }
  const inputs = [...merged.values()];
  const result = sankey(inputs, layout);
  const assigned = categoricalColors(result.nodes.length, palette);

  /** @type {Map<string, string>} */
  const colorOf = new Map();
  for (const node of result.nodes) {
    colorOf.set(
      node.id,
      colors[node.id] === undefined
        ? assigned[node.index]
        : (vizColor(colors[node.id]) ?? assigned[node.index]),
    );
  }

  return {
    columns: result.columns,
    nodes: result.nodes.map((node) => {
      let incoming = 0;
      let outgoing = 0;
      for (const link of node.targetLinks) incoming += link.value;
      for (const link of node.sourceLinks) outgoing += link.value;
      return {
        id: node.id,
        column: node.column,
        last: node.column === result.columns - 1,
        value: node.value,
        incoming,
        outgoing,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        color: /** @type {string} */ (colorOf.get(node.id)),
      };
    }),
    links: result.links.map((link) => ({
      id: JSON.stringify([link.source.id, link.target.id]),
      source: link.source.id,
      target: link.target.id,
      value: link.value,
      path: link.path,
      color: /** @type {string} */ (colorOf.get(link.source.id)),
      rows: inputs[link.index].rows,
    })),
  };
}
