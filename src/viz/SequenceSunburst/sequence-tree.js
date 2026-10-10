// @ts-check
// Turn sequences of steps into a tree of prefixes, for a sunburst whose
// rings are ordered steps rather than containment.

/**
 * A node per distinct prefix, in depth-first order under one root. A
 * node's value is what passes through it, so a parent is worth at least
 * its children and the difference is what stops there.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./sequence-tree.d.ts").SequenceTreeOptions<T>} options
 * @returns {import("./sequence-tree.d.ts").SequenceTree<T>}
 */
export function sequenceTree(rows, options) {
  const {
    steps,
    value,
    separator = "/",
    rootLabel = "All",
    // Never empty: an empty parent id reads as no parent downstream.
    rootId = "\u0000",
  } = options;
  const SEP = "\u0000";
  /** @type {Map<string, import("./sequence-tree.d.ts").SequenceNode<T>>} */
  const nodes = new Map();
  /** @type {Map<string, string[]>} */
  const childrenOf = new Map();
  /** @type {import("./sequence-tree.d.ts").SequenceNode<T>} */
  const root = {
    id: rootId,
    parent: null,
    step: rootLabel,
    path: [],
    depth: 0,
    value: 0,
    rows: [],
  };
  nodes.set(rootId, root);
  childrenOf.set(rootId, []);

  rows.forEach((row, i) => {
    const raw = steps(row, i);
    const path = (
      Array.isArray(raw)
        ? raw.map(String)
        : String(raw ?? "")
            .split(separator)
            .map((step) => step.trim())
    ).filter((step) => step !== "");
    const amount = value ? Number(value(row, i)) : 1;
    if (!Number.isFinite(amount) || amount <= 0 || path.length === 0) return;
    root.value += amount;
    root.rows.push(row);
    let parentId = rootId;
    for (let depth = 1; depth <= path.length; depth++) {
      const prefix = path.slice(0, depth);
      const id = prefix.join(SEP);
      let node = nodes.get(id);
      if (!node) {
        node = {
          id,
          parent: parentId,
          step: prefix[depth - 1],
          path: prefix,
          depth,
          value: 0,
          rows: [],
        };
        nodes.set(id, node);
        childrenOf.set(id, []);
        /** @type {string[]} */ (childrenOf.get(parentId)).push(id);
      }
      node.value += amount;
      node.rows.push(row);
      parentId = id;
    }
  });

  // Depth-first from the root, siblings in first-seen order.
  /** @type {import("./sequence-tree.d.ts").SequenceNode<T>[]} */
  const ordered = [];
  const visit = (/** @type {string} */ id) => {
    const node = nodes.get(id);
    if (!node) return;
    ordered.push(node);
    for (const child of childrenOf.get(id) ?? []) visit(child);
  };
  visit(rootId);
  return { nodes: ordered, total: root.value };
}
