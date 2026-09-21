// @ts-check
// Tree layout from an adjacency list: depth across, leaves spread down.

/**
 * Build a tree from rows that each name their parent, and lay it out left to
 * right: a node's column is its depth, leaves take consecutive rows, and a
 * parent sits midway between its first and last child. With `align` set to
 * `"leaves"`, every leaf moves to the last column, as in a dendrogram.
 *
 * Rows with no parent, or with a parent that is not in the data, are roots.
 * Several roots are laid out one under the other. A row that would make a
 * cycle is treated as a root, and a repeated id keeps its first row.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./tree-layout.d.ts").TreeLayoutOptions<T>} options
 * @returns {import("./tree-layout.d.ts").TreeLayout<T>}
 */
export function treeLayout(rows, options) {
  const { id, parent, width, height, align = "depth" } = options;

  /** @type {Map<string, import("./tree-layout.d.ts").TreeNode<T>>} */
  const byId = new Map();
  /** @type {Map<string, string | null>} */
  const parentOf = new Map();
  for (let i = 0; i < rows.length; i++) {
    const key = String(id(rows[i], i));
    if (byId.has(key)) continue;
    const up = parent(rows[i], i);
    parentOf.set(
      key,
      up === null || up === undefined || up === "" ? null : String(up),
    );
    byId.set(key, {
      id: key,
      row: rows[i],
      parent: null,
      children: [],
      depth: 0,
      leaf: true,
      x: 0,
      y: 0,
    });
  }

  /** @type {Map<import("./tree-layout.d.ts").TreeNode<T>, import("./tree-layout.d.ts").TreeNode<T>>} */
  const shortcut = new Map();
  /** @type {import("./tree-layout.d.ts").TreeNode<T>[]} */
  const roots = [];
  for (const node of byId.values()) {
    const up = parentOf.get(node.id) ?? null;
    const above = up === null ? undefined : byId.get(up);
    // `node` has no parent yet, so it can only be above `above` by being the
    // top of its chain.
    if (!above || topOf(above) === node) {
      roots.push(node);
      continue;
    }
    node.parent = above;
    above.children.push(node);
    above.leaf = false;
  }

  // Depth first, without recursion, so a deep chain cannot overflow the stack.
  /** @type {import("./tree-layout.d.ts").TreeNode<T>[]} */
  const ordered = [];
  let maxDepth = 0;
  let leaves = 0;
  /** @type {Array<{ node: import("./tree-layout.d.ts").TreeNode<T>; next: number }>} */
  const stack = [];
  for (const root of roots) {
    stack.push({ node: root, next: 0 });
    ordered.push(root);
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top.next === 0 && top.node.leaf) top.node.y = leaves++;
      if (top.next < top.node.children.length) {
        const child = top.node.children[top.next++];
        child.depth = top.node.depth + 1;
        maxDepth = Math.max(maxDepth, child.depth);
        ordered.push(child);
        stack.push({ node: child, next: 0 });
      } else {
        // Every child has its row by now.
        if (!top.node.leaf) {
          const kids = top.node.children;
          top.node.y = (kids[0].y + kids[kids.length - 1].y) / 2;
        }
        stack.pop();
      }
    }
  }

  const stepX = maxDepth > 0 ? width / maxDepth : 0;
  const stepY = leaves > 1 ? height / (leaves - 1) : 0;
  for (const node of ordered) {
    const column = align === "leaves" && node.leaf ? maxDepth : node.depth;
    node.x = column * stepX;
    node.y = leaves > 1 ? node.y * stepY : height / 2;
  }

  /** @type {import("./tree-layout.d.ts").TreeLink<T>[]} */
  const links = [];
  for (const node of ordered) {
    if (!node.parent) continue;
    const from = node.parent;
    const mid = (from.x + node.x) / 2;
    links.push({
      source: from,
      target: node,
      path: `M${round(from.x)},${round(from.y)}C${round(mid)},${round(from.y)},${round(mid)},${round(node.y)},${round(node.x)},${round(node.y)}`,
    });
  }
  return { nodes: ordered, links, depth: maxDepth, leaves };

  /**
   * The top of a node's chain of parents so far. Chains are compressed as
   * they are walked, so a long path costs its length once, not per node.
   * @param {import("./tree-layout.d.ts").TreeNode<T>} from
   */
  function topOf(from) {
    let top = from;
    while (true) {
      const next = shortcut.get(top) ?? top.parent;
      if (!next) break;
      top = next;
    }
    let at = from;
    while (at !== top) {
      const next = shortcut.get(at) ?? at.parent;
      shortcut.set(at, top);
      if (!next) break;
      at = next;
    }
    return top;
  }
}

/** @param {number} n */
function round(n) {
  return Math.round(n * 10) / 10;
}
