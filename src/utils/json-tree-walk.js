// @ts-check
// Walks over a `JsonTree`: the flat list of rows a viewer shows, and the
// resumable walks that expand a tree or search it.

import { searchKeyText, searchValueText } from "./json-format.js";
import {
  FLAG_AUTO,
  FLAG_EXPANDED,
  FLAG_MATCH_KEY,
  FLAG_MATCH_VALUE,
  LONG_STRING,
} from "./json-tree.js";

/** Default cap on the nodes a walk creates, so a shared reference cannot blow up. */
export const DEFAULT_NODE_LIMIT = 2_000_000;

/** Default cap on the matches a search keeps. */
export const DEFAULT_MAX_MATCHES = 5_000;

/**
 * The rows a collapsed or expanded node shows below itself: its expanded
 * descendants, in document order. Not `id` itself.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {number} id
 * @param {number[]} [out]
 * @returns {number[]}
 */
export function descendantRows(tree, id, out = []) {
  if (!tree.isExpanded(id)) return out;
  /** @type {number[]} */
  const stack = [];
  const push = (/** @type {number} */ parent) => {
    const first = tree.materialize(parent);
    for (let i = tree.childCount(parent) - 1; i >= 0; i--)
      stack.push(first + i);
  };
  push(id);
  while (stack.length > 0) {
    const next = /** @type {number} */ (stack.pop());
    out.push(next);
    if (tree.isExpanded(next)) push(next);
  }
  return out;
}

/**
 * Every visible row, in order: the root, then its expanded descendants.
 * @param {import("./json-tree.js").JsonTree} tree
 * @returns {number[]}
 */
export function buildRows(tree) {
  const rows = [0];
  return descendantRows(tree, 0, rows);
}

/**
 * Show or hide the rows below the node at `index`, without rebuilding the
 * rows before or after it.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {ReadonlyArray<number>} rows
 * @param {number} index Where `rows` holds the node.
 * @param {boolean} expanded
 * @returns {number[]} The new rows.
 */
export function toggleRows(tree, rows, index, expanded) {
  const id = rows[index];
  if (expanded) {
    if (!tree.canExpand(id)) return rows.slice();
    tree.setExpanded(id, true);
    const below = descendantRows(tree, id);
    return rows.slice(0, index + 1).concat(below, rows.slice(index + 1));
  }
  const next = rows.slice();
  const depth = tree.depths[id];
  let end = index + 1;
  while (end < next.length && tree.depths[next[end]] > depth) end++;
  tree.setExpanded(id, false);
  next.splice(index + 1, end - index - 1);
  return next;
}

/**
 * @typedef {object} WalkOptions
 * @property {number} [start] The node to start at. Defaults to the root.
 * @property {boolean} [expand] Expand every container the walk reaches.
 * @property {number} [maxDepth] With `expand`, stop expanding at this depth.
 * @property {string} [query] Collect the nodes whose key or value contains it.
 * @property {number} [limit] Stop creating nodes at this many.
 * @property {number} [maxMatches] Stop searching at this many matches.
 */

/**
 * A resumable depth-first walk. Each `step` works for a time budget and says
 * whether it finished, so a 1,000,000 node tree never holds the main thread.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {WalkOptions} [options]
 */
export function createWalk(tree, options = {}) {
  const {
    start = 0,
    expand = false,
    maxDepth = Number.POSITIVE_INFINITY,
    limit = DEFAULT_NODE_LIMIT,
    maxMatches = DEFAULT_MAX_MATCHES,
  } = options;
  const query = (options.query ?? "").toLowerCase();

  /** @type {number[]} */
  const stack = [start];
  /** Matches, in document order. */
  /** @type {number[]} */
  const matches = [];
  const state = {
    done: false,
    /** The walk stopped creating nodes at `limit`. */
    limited: false,
    /** The search stopped collecting at `maxMatches`. */
    truncated: false,
    matches,
    visited: 0,
    /** @param {number} budgetMs @returns {boolean} Whether the walk is done. */
    step(budgetMs) {
      if (state.done) return true;
      const deadline = now() + budgetMs;
      let count = 0;
      while (stack.length > 0) {
        const id = /** @type {number} */ (stack.pop());
        state.visited++;

        if (query) {
          let flags = 0;
          const key = searchKeyText(tree, id);
          if (key.length >= query.length && key.toLowerCase().includes(query))
            flags |= FLAG_MATCH_KEY;
          const text = searchValueText(tree, id);
          if (text.length >= query.length && text.toLowerCase().includes(query))
            flags |= FLAG_MATCH_VALUE;
          if (flags !== 0) {
            tree.flags[id] |= flags;
            matches.push(id);
            if (matches.length >= maxMatches) {
              state.truncated = true;
              stack.length = 0;
              break;
            }
          }
        }

        // A long string's children are display chunks. Searching reads the
        // string, so it never needs them.
        if (tree.kinds[id] > LONG_STRING && tree.canExpand(id)) {
          if (tree.length >= limit) {
            state.limited = true;
          } else {
            const first = tree.materialize(id);
            const size = tree.childCount(id);
            if (expand && tree.depths[id] < maxDepth) {
              tree.flags[id] |= FLAG_EXPANDED;
            }
            if (tree.depths[id] < maxDepth) {
              for (let i = size - 1; i >= 0; i--) stack.push(first + i);
            }
          }
        }

        if ((++count & 255) === 0 && now() > deadline) return false;
      }
      state.done = true;
      return true;
    },
  };
  return state;
}

/**
 * @returns {number}
 */
function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

/**
 * Clear the match flags a search left, and fold back the ancestors it opened.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {ReadonlyArray<number>} matches
 * @param {ReadonlyArray<number>} autoExpanded
 */
export function clearSearch(tree, matches, autoExpanded) {
  for (const id of matches)
    tree.flags[id] &= ~(FLAG_MATCH_KEY | FLAG_MATCH_VALUE);
  for (const id of autoExpanded) {
    // A node the user toggled since lost its claim, and stays as they left it.
    if ((tree.flags[id] & FLAG_AUTO) !== 0) tree.setExpanded(id, false);
  }
}

/**
 * Expand every ancestor of `ids`, marking the ones that were closed so
 * clearing the search can close them again.
 * @param {import("./json-tree.js").JsonTree} tree
 * @param {Iterable<number>} ids
 * @returns {number[]} The ancestors this opened.
 */
export function revealAncestors(tree, ids) {
  /** @type {number[]} */
  const opened = [];
  /** @type {Set<number>} */
  const seen = new Set();
  for (const id of ids) {
    for (
      let p = tree.parents[id];
      p >= 0 && !seen.has(p);
      p = tree.parents[p]
    ) {
      seen.add(p);
      if (!tree.isExpanded(p)) {
        tree.setExpanded(p, true, true);
        opened.push(p);
      }
    }
  }
  return opened;
}
