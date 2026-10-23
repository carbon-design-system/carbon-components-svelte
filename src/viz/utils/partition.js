// @ts-check
// Partition layout: a tree where every node is a slice of its parent, so an
// icicle, a flame graph, or a sunburst can draw it. Shares of the root, not
// pixels, so any of them can scale it.

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNumber(value) {
  if (value === null || value === undefined) return Number.NaN;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

/**
 * Lay the tree out as nested slices. A node's value is its own, or the sum
 * of its children when it has none, and never less than its children add
 * up to. Children take their parent's span in input order, or largest
 * first with `sort`, and what the parent is worth beyond them stays empty. The layout is scoped to `root` when one is given: its
 * ancestors are kept at full width, as steps back up, and everything
 * outside its subtree is left out. Rows with no parent, or with a parent
 * not in the data, are roots; several roots share the top level.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./partition.d.ts").PartitionOptions<T>} options
 * @returns {import("./partition.d.ts").Partition<T>}
 */
export function partition(rows, options) {
  const { id, parent, value, label, sort = "none", root, maxDepth } = options;

  /** @type {Map<string, import("./partition.d.ts").PartitionNode<T>>} */
  const byId = new Map();
  /** @type {import("./partition.d.ts").PartitionNode<T>[]} */
  const all = [];
  for (let i = 0; i < rows.length; i++) {
    const key = String(id(rows[i], i));
    if (byId.has(key)) continue;
    const node = {
      id: key,
      parent: null,
      label: label ? String(label(rows[i], i) ?? key) : key,
      depth: 0,
      value: toNumber(value(rows[i], i)),
      own: 0,
      share: 0,
      x0: 0,
      x1: 0,
      datum: rows[i],
      index: i,
      children:
        /** @type {import("./partition.d.ts").PartitionNode<T>[]} */ ([]),
      leaf: true,
      ancestor: false,
    };
    byId.set(key, node);
    all.push(node);
  }
  /** @type {import("./partition.d.ts").PartitionNode<T>[]} */
  const roots = [];
  for (const node of all) {
    const raw = parent(node.datum, node.index);
    const up =
      raw === null || raw === undefined || raw === ""
        ? undefined
        : byId.get(String(raw));
    if (up && up !== node && !descends(up, node)) {
      node.parent = up.id;
      up.children.push(node);
      up.leaf = false;
    } else {
      roots.push(node);
    }
  }

  /**
   * Whether `node` is `candidate` or below it, which would make a cycle.
   * @param {import("./partition.d.ts").PartitionNode<T>} node
   * @param {import("./partition.d.ts").PartitionNode<T>} candidate
   */
  function descends(node, candidate) {
    let at =
      /** @type {import("./partition.d.ts").PartitionNode<T> | undefined} */ (
        node
      );
    while (at) {
      if (at === candidate) return true;
      at = at.parent === null ? undefined : byId.get(at.parent);
    }
    return false;
  }

  // Values roll up: a parent is worth what it says, or what its children
  // add up to, whichever is more.
  /** @param {import("./partition.d.ts").PartitionNode<T>} node */
  function total(node) {
    let sum = 0;
    for (const child of node.children) sum += total(child);
    const own = Number.isFinite(node.value) ? Math.max(node.value, 0) : 0;
    node.value = Math.max(own, sum);
    node.own = node.value - sum;
    return node.value;
  }
  for (const node of roots) total(node);

  const top = root === undefined ? undefined : byId.get(String(root));
  /** @type {import("./partition.d.ts").PartitionNode<T>[]} */
  const ancestors = [];
  if (top) {
    let at = top.parent === null ? undefined : byId.get(top.parent);
    while (at) {
      ancestors.unshift(at);
      at = at.parent === null ? undefined : byId.get(at.parent);
    }
  }
  const level = top ? [top] : roots;
  let whole = 0;
  for (const node of level) whole += node.value;

  /** @type {import("./partition.d.ts").PartitionNode<T>[]} */
  const out = [];
  let deepest = 0;
  ancestors.forEach((node, depth) => {
    node.depth = depth;
    node.share = 1;
    node.x0 = 0;
    node.x1 = 100;
    node.ancestor = true;
    out.push(node);
  });
  const base = ancestors.length;

  /**
   * Children share their parent's span in proportion to the parent's value,
   * so what the parent is worth on its own is left empty at the end.
   *
   * @param {ReadonlyArray<import("./partition.d.ts").PartitionNode<T>>} nodes
   * @param {number} from
   * @param {number} to
   * @param {number} depth
   * @param {number} of The value the span stands for.
   */
  function place(nodes, from, to, depth, of) {
    if (maxDepth !== undefined && depth - base >= maxDepth) return;
    const ordered =
      sort === "value" ? [...nodes].sort((a, b) => b.value - a.value) : nodes;
    let at = from;
    for (const node of ordered) {
      const width = of > 0 ? ((to - from) * node.value) / of : 0;
      node.depth = depth;
      node.share = whole > 0 ? node.value / whole : 0;
      node.x0 = at;
      node.x1 = at + width;
      node.ancestor = false;
      if (depth > deepest) deepest = depth;
      out.push(node);
      if (width > 0)
        place(node.children, at, at + width, depth + 1, node.value);
      at += width;
    }
  }
  place(level, 0, 100, base, whole);

  return { total: whole, depth: deepest, ancestors: base, nodes: out };
}
