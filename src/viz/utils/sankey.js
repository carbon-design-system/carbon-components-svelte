// @ts-check
// Sankey layout: nodes in columns, sized by flow, joined by ribbons.

/**
 * Lay out a flow network. Nodes go in columns by their longest path from a
 * source, heights follow the larger of what flows in and out, and a few
 * relaxation sweeps pull each node toward the nodes it connects to, which
 * untangles most crossings. A link that would close a cycle is dropped, as
 * are links with a value that is not positive.
 *
 * @param {ReadonlyArray<import("./sankey.d.ts").SankeyLinkInput>} links
 * @param {import("./sankey.d.ts").SankeyOptions} options
 * @returns {import("./sankey.d.ts").SankeyLayout}
 */
export function sankey(links, options) {
  const {
    width,
    height,
    nodeWidth = 8,
    nodePadding = 12,
    iterations = 6,
  } = options;

  /** @type {Map<string, import("./sankey.d.ts").SankeyNode>} */
  const byId = new Map();
  /** @param {string} id */
  function node(id) {
    let found = byId.get(id);
    if (!found) {
      found = {
        id,
        index: byId.size,
        column: 0,
        value: 0,
        x: 0,
        y: 0,
        width: nodeWidth,
        height: 0,
        sourceLinks: [],
        targetLinks: [],
      };
      byId.set(id, found);
    }
    return found;
  }

  /** @type {import("./sankey.d.ts").SankeyLink[]} */
  const kept = [];
  for (let i = 0; i < links.length; i++) {
    const { source, target, value } = links[i];
    if (!(value > 0) || !Number.isFinite(value) || source === target) continue;
    const from = node(String(source));
    const to = node(String(target));
    if (reaches(to, from)) continue;
    /** @type {import("./sankey.d.ts").SankeyLink} */
    const link = {
      index: i,
      source: from,
      target: to,
      value,
      width: 0,
      sourceY: 0,
      targetY: 0,
      path: "",
    };
    from.sourceLinks.push(link);
    to.targetLinks.push(link);
    kept.push(link);
  }
  const nodes = [...byId.values()];
  if (nodes.length === 0) return { nodes: [], links: [], columns: 0 };

  // Columns: the longest path from any source, by repeated relaxation. The
  // graph is acyclic by now, so this settles within `nodes.length` passes.
  for (let pass = 0; pass < nodes.length; pass++) {
    let moved = false;
    for (const link of kept) {
      if (link.target.column < link.source.column + 1) {
        link.target.column = link.source.column + 1;
        moved = true;
      }
    }
    if (!moved) break;
  }
  let last = 0;
  for (const entry of nodes) last = Math.max(last, entry.column);
  // A node nothing flows out of belongs at the far end, not mid chart.
  for (const entry of nodes) {
    if (entry.sourceLinks.length === 0 && entry.targetLinks.length > 0) {
      entry.column = last;
    }
  }

  /** @type {import("./sankey.d.ts").SankeyNode[][]} */
  const columns = Array.from({ length: last + 1 }, () => []);
  for (const entry of nodes) {
    let incoming = 0;
    let outgoing = 0;
    for (const link of entry.targetLinks) incoming += link.value;
    for (const link of entry.sourceLinks) outgoing += link.value;
    entry.value = Math.max(incoming, outgoing);
    entry.x = last > 0 ? (entry.column / last) * (width - nodeWidth) : 0;
    columns[entry.column].push(entry);
  }

  // One scale for every column, set by the fullest one.
  let scale = Number.POSITIVE_INFINITY;
  for (const column of columns) {
    let sum = 0;
    for (const entry of column) sum += entry.value;
    const room = height - (column.length - 1) * nodePadding;
    if (sum > 0) scale = Math.min(scale, Math.max(room, 1) / sum);
  }
  if (!Number.isFinite(scale)) scale = 0;

  for (const column of columns) {
    column.sort((a, b) => b.value - a.value);
    let y = 0;
    for (const entry of column) {
      entry.height = entry.value * scale;
      entry.y = y;
      y += entry.height + nodePadding;
    }
  }
  for (const link of kept) link.width = link.value * scale;

  /** @param {import("./sankey.d.ts").SankeyNode} entry */
  function center(entry) {
    return entry.y + entry.height / 2;
  }
  /** @param {import("./sankey.d.ts").SankeyNode[]} column */
  function settle(column) {
    column.sort((a, b) => a.y - b.y);
    let y = 0;
    for (const entry of column) {
      if (entry.y < y) entry.y = y;
      y = entry.y + entry.height + nodePadding;
    }
    // Pushed past the bottom: walk back up.
    let overflow = y - nodePadding - height;
    for (let i = column.length - 1; i >= 0 && overflow > 0; i--) {
      const entry = column[i];
      entry.y -= overflow;
      const above = i > 0 ? column[i - 1] : null;
      overflow = above
        ? above.y + above.height + nodePadding - entry.y
        : -entry.y;
    }
    if (column.length > 0 && column[0].y < 0) column[0].y = 0;
  }
  /**
   * @param {import("./sankey.d.ts").SankeyNode[]} column
   * @param {"targetLinks" | "sourceLinks"} side
   * @param {number} alpha
   */
  function pull(column, side, alpha) {
    for (const entry of column) {
      let weight = 0;
      let sum = 0;
      for (const link of entry[side]) {
        const other = side === "targetLinks" ? link.source : link.target;
        sum += center(other) * link.value;
        weight += link.value;
      }
      if (weight > 0) entry.y += (sum / weight - center(entry)) * alpha;
    }
    settle(column);
  }
  let alpha = 1;
  for (let i = 0; i < iterations; i++) {
    alpha *= 0.85;
    for (let c = columns.length - 1; c >= 0; c--) {
      pull(columns[c], "sourceLinks", alpha);
    }
    for (const column of columns) pull(column, "targetLinks", alpha);
  }

  // Ribbons leave and arrive in the order of what they connect to, so they
  // do not cross on their way out of a node.
  for (const entry of nodes) {
    entry.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    entry.targetLinks.sort((a, b) => a.source.y - b.source.y);
    let out = entry.y;
    for (const link of entry.sourceLinks) {
      link.sourceY = out;
      out += link.width;
    }
    let into = entry.y;
    for (const link of entry.targetLinks) {
      link.targetY = into;
      into += link.width;
    }
  }
  for (const link of kept) {
    const x0 = link.source.x + nodeWidth;
    const x1 = link.target.x;
    const mid = (x0 + x1) / 2;
    const r = (/** @type {number} */ n) => Math.round(n * 10) / 10;
    link.path =
      `M${r(x0)},${r(link.sourceY)}` +
      `C${r(mid)},${r(link.sourceY)},${r(mid)},${r(link.targetY)},${r(x1)},${r(link.targetY)}` +
      `L${r(x1)},${r(link.targetY + link.width)}` +
      `C${r(mid)},${r(link.targetY + link.width)},${r(mid)},${r(link.sourceY + link.width)},${r(x0)},${r(link.sourceY + link.width)}Z`;
  }

  return { nodes, links: kept, columns: last + 1 };

  /**
   * Whether `to` can already be reached from `from`.
   * @param {import("./sankey.d.ts").SankeyNode} from
   * @param {import("./sankey.d.ts").SankeyNode} to
   */
  function reaches(from, to) {
    const stack = [from];
    /** @type {Set<string>} */
    const seen = new Set();
    while (stack.length > 0) {
      const at = /** @type {import("./sankey.d.ts").SankeyNode} */ (
        stack.pop()
      );
      if (at === to) return true;
      if (seen.has(at.id)) continue;
      seen.add(at.id);
      for (const link of at.sourceLinks) stack.push(link.target);
    }
    return false;
  }
}
