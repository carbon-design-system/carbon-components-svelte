// @ts-check
// The tree behind `Cascader`: pure functions over the consumer's nodes and the
// children a lazy parent loaded. A node is addressed by its path of ids, and a
// path's key (`pathKey`) names it everywhere, so two branches may reuse an id.

import { createTextMatcher } from "../utils/text-match.js";

/**
 * @typedef {string | number} CascaderId
 */

/**
 * @typedef {object} CascaderNode
 * @property {CascaderId} id
 * @property {string} text
 * @property {boolean} [disabled]
 * @property {boolean} [hasChildren] - Children not loaded yet.
 * @property {CascaderNode[]} [nodes]
 */

/** @typedef {ReadonlyMap<string, ReadonlyArray<CascaderNode>>} LoadedChildren */

/** Joins the ids of a path. A unit separator is not typed into an id. */
const SEPARATOR = "\u001f";

/**
 * @param {ReadonlyArray<CascaderId>} ids
 * @returns {string}
 */
export function pathKey(ids) {
  return ids.join(SEPARATOR);
}

/**
 * @param {string} key
 * @param {CascaderId} id
 * @returns {string}
 */
export function childKey(key, id) {
  return key === "" ? String(id) : key + SEPARATOR + id;
}

/**
 * The children of a node: its own `nodes`, else what a lazy load returned,
 * else `null` when they are not known yet.
 * @param {CascaderNode} node
 * @param {string} key
 * @param {LoadedChildren} loaded
 * @returns {ReadonlyArray<CascaderNode> | null}
 */
export function childrenOf(node, key, loaded) {
  if (Array.isArray(node.nodes)) return node.nodes;
  return loaded.get(key) ?? null;
}

/**
 * Whether the node opens a column: it has children, or may have some to load.
 * @param {CascaderNode} node
 * @param {string} key
 * @param {LoadedChildren} loaded
 * @returns {boolean}
 */
export function isBranch(node, key, loaded) {
  const children = childrenOf(node, key, loaded);
  return children ? children.length > 0 : node.hasChildren === true;
}

/**
 * Whether opening the node needs `loadChildren`.
 * @param {CascaderNode} node
 * @param {string} key
 * @param {LoadedChildren} loaded
 * @returns {boolean}
 */
export function needsLoad(node, key, loaded) {
  return (
    !Array.isArray(node.nodes) && node.hasChildren === true && !loaded.has(key)
  );
}

/**
 * Follow `ids` down from the roots. Stops at the first id it cannot find, or
 * the first lazy parent that has not loaded.
 * @param {ReadonlyArray<CascaderNode>} nodes
 * @param {LoadedChildren} loaded
 * @param {ReadonlyArray<CascaderId>} ids
 * @returns {{ nodes: CascaderNode[], complete: boolean }}
 */
export function resolvePath(nodes, loaded, ids) {
  /** @type {CascaderNode[]} */
  const found = [];
  /** @type {ReadonlyArray<CascaderNode> | null} */
  let level = nodes;
  let key = "";
  for (const id of ids) {
    const node = level?.find((candidate) => candidate.id === id);
    if (!node) return { nodes: found, complete: false };
    found.push(node);
    key = childKey(key, id);
    level = childrenOf(node, key, loaded);
  }
  return { nodes: found, complete: found.length === ids.length };
}

/**
 * @typedef {object} CascaderSearchResult
 * @property {CascaderId[]} ids
 * @property {CascaderNode[]} nodes
 * @property {string} key
 * @property {string} text - The labels joined, the text a query matches.
 * @property {Array<{ start: number; end: number }>} ranges
 */

/**
 * Find paths whose joined labels contain every term of `query`. A query
 * matches across levels: `fra par` finds `Europe / France / Paris`.
 * @param {ReadonlyArray<CascaderNode>} nodes
 * @param {LoadedChildren} loaded
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.separator]
 * @param {number} [options.limit] - Stop after this many matches.
 * @param {boolean} [options.leafOnly] - Match only nodes with no children.
 * @returns {{ results: CascaderSearchResult[], truncated: boolean }}
 */
export function searchPaths(nodes, loaded, query, options = {}) {
  const { separator = " / ", limit = 100, leafOnly = true } = options;
  const match = createTextMatcher(query, { terms: "all" });
  /** @type {CascaderSearchResult[]} */
  const results = [];
  let truncated = false;
  /** @type {CascaderId[]} */
  const ids = [];
  /** @type {CascaderNode[]} */
  const trail = [];

  /**
   * @param {ReadonlyArray<CascaderNode>} level
   * @param {string} parentKey
   * @param {string} prefix
   * @returns {boolean} Whether to stop.
   */
  function walk(level, parentKey, prefix) {
    for (const node of level) {
      const key = childKey(parentKey, node.id);
      const text = prefix === "" ? node.text : prefix + separator + node.text;
      ids.push(node.id);
      trail.push(node);
      const children = childrenOf(node, key, loaded);
      const leaf = !children || children.length === 0;
      if (leaf || !leafOnly) {
        const ranges = match(text);
        if (ranges.length > 0) {
          if (results.length === limit) {
            truncated = true;
            return true;
          }
          results.push({ ids: [...ids], nodes: [...trail], key, text, ranges });
        }
      }
      if (children && children.length > 0 && walk(children, key, text)) {
        return true;
      }
      ids.pop();
      trail.pop();
    }
    return false;
  }

  if (query.trim() !== "") walk(nodes, "", "");
  return { results, truncated };
}

/**
 * The tree `createSelection` rolls checks up in: every node keyed by its path.
 * @param {ReadonlyArray<CascaderNode>} nodes
 * @param {LoadedChildren} loaded
 * @param {string} [parentKey]
 * @returns {Array<{ id: string, disabled?: boolean, nodes?: unknown[] }>}
 */
export function toSelectionTree(nodes, loaded, parentKey = "") {
  return nodes.map((node) => {
    const key = childKey(parentKey, node.id);
    const children = childrenOf(node, key, loaded);
    /** @type {{ id: string, disabled?: boolean, nodes?: unknown[] }} */
    const entry = { id: key };
    if (node.disabled) entry.disabled = true;
    if (children) entry.nodes = toSelectionTree(children, loaded, key);
    return entry;
  });
}

/**
 * The paths a set of checked keys reports, in document order. With `"parent"`
 * a fully checked branch is one path (its own); with `"leaf"` it is the
 * paths of its leaves. A checked branch whose children are not loaded is
 * reported as itself either way: there is nothing below it to list.
 * @param {ReadonlyArray<CascaderNode>} nodes
 * @param {LoadedChildren} loaded
 * @param {ReadonlySet<string>} checked
 * @param {"parent" | "leaf"} [mode]
 * @returns {CascaderId[][]}
 */
export function checkedPaths(nodes, loaded, checked, mode = "parent") {
  /** @type {CascaderId[][]} */
  const paths = [];
  /** @type {CascaderId[]} */
  const ids = [];

  /**
   * @param {ReadonlyArray<CascaderNode>} level
   * @param {string} parentKey
   */
  function walk(level, parentKey) {
    for (const node of level) {
      const key = childKey(parentKey, node.id);
      ids.push(node.id);
      const children = childrenOf(node, key, loaded);
      const hasKids = !!children && children.length > 0;
      if (checked.has(key) && (mode === "parent" || !hasKids)) {
        paths.push([...ids]);
      } else if (hasKids) {
        walk(/** @type {ReadonlyArray<CascaderNode>} */ (children), key);
      }
      ids.pop();
    }
  }

  walk(nodes, "");
  return paths;
}

/**
 * @param {ReadonlyArray<CascaderNode>} path
 * @param {string} separator
 * @returns {string}
 */
export function joinLabels(path, separator) {
  return path.map((node) => node.text).join(separator);
}

/**
 * @param {ReadonlyArray<CascaderId>} a
 * @param {ReadonlyArray<CascaderId>} b
 * @returns {boolean}
 */
export function samePath(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * @param {ReadonlyArray<ReadonlyArray<CascaderId>>} a
 * @param {ReadonlyArray<ReadonlyArray<CascaderId>>} b
 * @returns {boolean}
 */
export function samePaths(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!samePath(a[i], b[i])) return false;
  return true;
}

/**
 * @typedef {object} CascaderEntry
 * @property {string} key
 * @property {CascaderId} id
 * @property {CascaderNode} node
 * @property {CascaderId[]} ids - The path from the root to this node.
 * @property {number} col
 * @property {number} index
 * @property {number} size - Siblings in the column.
 * @property {boolean} branch
 * @property {boolean} disabled
 */

/**
 * @typedef {object} CascaderColumn
 * @property {string} key - The key of the parent, `""` for the roots.
 * @property {CascaderNode | null} parent
 * @property {CascaderEntry[]} entries
 * @property {"loading" | "error" | undefined} status
 */

/**
 * The columns the open path shows: the roots, then the children of each node
 * in `trail`. A lazy node that is loading or failed shows an empty column
 * with its status.
 * @param {ReadonlyArray<CascaderNode>} nodes
 * @param {LoadedChildren} loaded
 * @param {ReadonlyArray<CascaderId>} trail
 * @param {ReadonlyMap<string, "loading" | "error">} loadStates
 * @returns {{ columns: CascaderColumn[], entryByKey: Map<string, CascaderEntry> }}
 */
export function buildColumns(nodes, loaded, trail, loadStates) {
  /** @type {CascaderColumn[]} */
  const columns = [];
  /** @type {Map<string, CascaderEntry>} */
  const entryByKey = new Map();

  /**
   * @param {ReadonlyArray<CascaderNode>} level
   * @param {string} parentKey
   * @param {CascaderId[]} parentIds
   * @param {number} col
   * @param {CascaderNode | null} parent
   * @returns {CascaderColumn}
   */
  function column(level, parentKey, parentIds, col, parent) {
    const entries = level.map((node, index) => {
      const key = childKey(parentKey, node.id);
      /** @type {CascaderEntry} */
      const entry = {
        key,
        id: node.id,
        node,
        ids: [...parentIds, node.id],
        col,
        index,
        size: level.length,
        branch: isBranch(node, key, loaded),
        disabled: node.disabled === true,
      };
      entryByKey.set(key, entry);
      return entry;
    });
    return { key: parentKey, parent, entries, status: undefined };
  }

  /** @type {ReadonlyArray<CascaderNode>} */
  let level = nodes;
  let key = "";
  /** @type {CascaderId[]} */
  const ids = [];
  columns.push(column(level, key, ids, 0, null));
  for (let depth = 0; depth < trail.length; depth++) {
    const node = level.find((candidate) => candidate.id === trail[depth]);
    if (!node) break;
    key = childKey(key, node.id);
    ids.push(node.id);
    const children = childrenOf(node, key, loaded);
    const state = loadStates.get(key);
    if (children && children.length > 0) {
      columns.push(column(children, key, ids, depth + 1, node));
      level = children;
    } else if (state || (!children && node.hasChildren)) {
      const pending = column([], key, ids, depth + 1, node);
      pending.status = state ?? "loading";
      columns.push(pending);
      break;
    } else {
      break;
    }
  }
  return { columns, entryByKey };
}
