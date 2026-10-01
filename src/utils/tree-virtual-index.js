// @ts-check
/**
 * Virtualization helpers for TreeView: iterative visible flatten (oracle /
 * small trees), and a size-cache index that avoids materializing a full
 * visible row array.
 *
 * Complexity (after build):
 * - build: O(n) time and one size entry per node
 * - getRowAt: O(siblings along the path) — flat/wide lists are O(index),
 *   not O(depth)
 * - findIndexById: O(n) worst case — a linear document-order search with no
 *   reverse id→index map, so unlike getRowAt/collectRows it can't use
 *   sizeById to skip a subtree before finding the id inside it
 * - collectRows: one cursor walk — O(path-to-start + window), not
 *   O(width × window) from independent getRowAt calls
 */

export { isExpandableNode } from "./is-expandable-node.js";

/**
 * @template {{ id: string | number; nodes?: T[]; hasChildren?: boolean }} T
 * @param {T} node
 * @returns {node is T & { nodes: T[] }}
 */
function hasLoadedChildren(node) {
  return Array.isArray(node.nodes) && node.nodes.length > 0;
}

/**
 * @typedef {object} TreeVirtualIndexOptions
 * @property {boolean} [placeholders] - Emit one placeholder row under each
 *   expanded `hasChildren` node whose children have not loaded, for the
 *   `childNodes` slot. Placeholder rows carry the parent `node` and
 *   `placeholder: true`.
 */

/**
 * Whether `node` gets a placeholder row: expanded, `hasChildren`, and no
 * loaded children yet (the same condition the recursive tree uses to render
 * the `childNodes` slot).
 * @template {{ id: string | number; nodes?: T[]; hasChildren?: boolean }} T
 * @param {T} node
 * @param {Set<string | number>} expandedIdsSet
 * @param {boolean} placeholders
 * @returns {boolean}
 */
function awaitsChildren(node, expandedIdsSet, placeholders) {
  return (
    placeholders &&
    node.hasChildren === true &&
    !hasLoadedChildren(node) &&
    expandedIdsSet.has(node.id)
  );
}

/**
 * @template {{ id: string | number }} T
 * @param {T} node
 * @param {number} depth
 * @returns {{ node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder: true }}
 */
function placeholderRow(node, depth) {
  return {
    node,
    depth: depth + 1,
    parentId: node.id,
    posInSet: 1,
    setSize: 1,
    hasChildren: false,
    placeholder: true,
  };
}

/**
 * Flatten visible (expanded-only) nodes into annotated rows.
 * Iterative walk — one output array, no recursive `push(...spread)`.
 *
 * @template {{ id: string | number; nodes?: T[]; disabled?: boolean; hasChildren?: boolean }} T
 * @param {ReadonlyArray<T>} nodes
 * @param {Set<string | number>} expandedIdsSet
 * @param {TreeVirtualIndexOptions} [options]
 * @returns {Array<{ node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder?: true }>}
 */
export function flattenVisibleRows(nodes, expandedIdsSet, options = {}) {
  const placeholders = options.placeholders === true;
  /** @type {Array<{ node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder?: true }>} */
  const out = [];
  /** @type {Array<{ list: ReadonlyArray<T>; depth: number; parentId: string | number | null; index: number }>} */
  const stack = [{ list: nodes, depth: 0, parentId: null, index: 0 }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.list.length) {
      stack.pop();
      continue;
    }

    const i = frame.index++;
    const node = frame.list[i];
    const loaded = hasLoadedChildren(node);
    const hasChildren = loaded || node.hasChildren === true;
    out.push({
      node,
      depth: frame.depth,
      parentId: frame.parentId,
      posInSet: i + 1,
      setSize: frame.list.length,
      hasChildren,
    });

    if (awaitsChildren(node, expandedIdsSet, placeholders)) {
      out.push(placeholderRow(node, frame.depth));
    }

    if (loaded && expandedIdsSet.has(node.id)) {
      stack.push({
        list: node.nodes,
        depth: frame.depth + 1,
        parentId: node.id,
        index: 0,
      });
    }
  }

  return out;
}

/**
 * Build a size cache and row lookup for virtualized trees.
 * Allocates one number per node (visible subtree size), not a row object
 * per visible line — so expand-all on 100k+ nodes stays cheap.
 *
 * @template {{ id: string | number; nodes?: T[]; disabled?: boolean; hasChildren?: boolean }} T
 * @param {ReadonlyArray<T>} nodes
 * @param {Set<string | number>} expandedIdsSet
 * @param {TreeVirtualIndexOptions} [options]
 * @returns {{
 *   totalCount: number,
 *   getRowAt: (index: number) => { node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder?: true } | null,
 *   collectRows: (startIndex: number, endIndex: number) => Array<{ node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder?: true }>,
 *   findIndexById: (id: string | number) => number,
 * }}
 */
export function createTreeVirtualIndex(nodes, expandedIdsSet, options = {}) {
  const placeholders = options.placeholders === true;

  /** @type {Map<string | number, number>} */
  const sizeById = new Map();

  /**
   * Visible row count for `node` including itself.
   * @param {T} node
   * @returns {number}
   */
  function visibleSize(node) {
    const cached = sizeById.get(node.id);
    if (cached != null) return cached;

    let size = 1;
    if (hasLoadedChildren(node) && expandedIdsSet.has(node.id)) {
      for (const child of node.nodes) {
        size += visibleSize(child);
      }
    } else if (awaitsChildren(node, expandedIdsSet, placeholders)) {
      size = 2;
    }
    sizeById.set(node.id, size);
    return size;
  }

  let totalCount = 0;
  for (const node of nodes) {
    totalCount += visibleSize(node);
  }

  /**
   * @param {ReadonlyArray<T>} list
   * @param {number} depth
   * @param {string | number | null} parentId
   * @param {number} targetIndex
   * @param {number} indexOffset
   * @returns {{ node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder?: true } | null}
   */
  function rowAtInList(list, depth, parentId, targetIndex, indexOffset) {
    let offset = indexOffset;
    const setSize = list.length;
    for (let i = 0; i < list.length; i++) {
      const node = list[i];
      const size = sizeById.get(node.id) ?? 1;
      if (targetIndex < offset + size) {
        const loaded = hasLoadedChildren(node);
        const hasChildren = loaded || node.hasChildren === true;
        if (targetIndex === offset) {
          return {
            node,
            depth,
            parentId,
            posInSet: i + 1,
            setSize,
            hasChildren,
          };
        }
        if (loaded && expandedIdsSet.has(node.id)) {
          return rowAtInList(
            node.nodes,
            depth + 1,
            node.id,
            targetIndex,
            offset + 1,
          );
        }
        if (size === 2 && targetIndex === offset + 1) {
          return placeholderRow(node, depth);
        }
        return null;
      }
      offset += size;
    }
    return null;
  }

  /**
   * @param {number} index
   */
  function getRowAt(index) {
    if (index < 0 || index >= totalCount) return null;
    return rowAtInList(nodes, 0, null, index, 0);
  }

  /**
   * Collect `[startIndex, endIndex)` in one cursor walk: skip whole
   * subtrees via `sizeById` until `start`, then emit until `end`.
   * @param {number} startIndex
   * @param {number} endIndex
   */
  function collectRows(startIndex, endIndex) {
    const start = Math.max(0, startIndex);
    const end = Math.min(totalCount, endIndex);
    /** @type {Array<{ node: T; depth: number; parentId: string | number | null; posInSet: number; setSize: number; hasChildren: boolean; placeholder?: true }>} */
    const rows = [];
    if (start >= end) return rows;

    /** @type {Array<{ list: ReadonlyArray<T>; depth: number; parentId: string | number | null; index: number; offset: number }>} */
    const stack = [
      { list: nodes, depth: 0, parentId: null, index: 0, offset: 0 },
    ];

    while (stack.length > 0 && rows.length < end - start) {
      const frame = stack[stack.length - 1];
      if (frame.index >= frame.list.length) {
        stack.pop();
        continue;
      }

      const i = frame.index;
      const node = frame.list[i];
      const size = sizeById.get(node.id) ?? 1;
      const nodeStart = frame.offset;
      const nodeEnd = nodeStart + size;

      if (nodeEnd <= start) {
        // Entire subtree is before the window — skip it.
        frame.index++;
        frame.offset = nodeEnd;
        continue;
      }

      if (nodeStart >= end) break;

      const loaded = hasLoadedChildren(node);
      const hasChildren = loaded || node.hasChildren === true;

      if (nodeStart >= start && nodeStart < end) {
        rows.push({
          node,
          depth: frame.depth,
          parentId: frame.parentId,
          posInSet: i + 1,
          setSize: frame.list.length,
          hasChildren,
        });
      }

      frame.index++;
      frame.offset = nodeEnd;

      if (
        !loaded &&
        size === 2 &&
        nodeStart + 1 >= start &&
        nodeStart + 1 < end
      ) {
        rows.push(placeholderRow(node, frame.depth));
      }

      // Descend when the window still needs rows inside this expanded subtree.
      if (
        loaded &&
        expandedIdsSet.has(node.id) &&
        nodeStart + 1 < end &&
        nodeEnd > start
      ) {
        stack.push({
          list: node.nodes,
          depth: frame.depth + 1,
          parentId: node.id,
          index: 0,
          offset: nodeStart + 1,
        });
      }
    }

    return rows;
  }

  /**
   * @param {string | number} id
   * @returns {number} visible index, or -1 if not currently visible
   */
  function findIndexById(id) {
    const needle = String(id);
    const idType = typeof id;
    /**
     * Same-type ids compare directly; only a mixed pair (a numeric id looked
     * up by its DOM string) pays for `String()` on every visited node.
     * @param {string | number} candidate
     */
    function matches(candidate) {
      if (typeof candidate === idType) return candidate === id;
      return String(candidate) === needle;
    }
    /**
     * @param {ReadonlyArray<T>} list
     * @param {number} indexOffset
     * @returns {number}
     */
    function findInList(list, indexOffset) {
      let offset = indexOffset;
      for (let i = 0; i < list.length; i++) {
        const node = list[i];
        if (matches(node.id)) return offset;
        const size = sizeById.get(node.id) ?? 1;
        if (
          hasLoadedChildren(node) &&
          expandedIdsSet.has(node.id) &&
          size > 1
        ) {
          const found = findInList(node.nodes, offset + 1);
          if (found >= 0) return found;
        }
        offset += size;
      }
      return -1;
    }
    return findInList(nodes, 0);
  }

  return { totalCount, getRowAt, collectRows, findIndexById };
}
