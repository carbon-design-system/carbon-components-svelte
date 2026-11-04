// @ts-check

/**
 * The dock layout model: a tree of splits whose leaves are groups of tabs.
 *
 * Every function here is pure. A layout is never changed in place: an
 * operation returns a new tree that shares every subtree it did not touch,
 * or the same tree when nothing changed. Positions along a row run from the
 * inline start, so a layout means the same in left-to-right and
 * right-to-left pages.
 *
 * @typedef {import("./dock-layout.js").DockGroup} DockGroup
 * @typedef {import("./dock-layout.js").DockSplit} DockSplit
 * @typedef {import("./dock-layout.js").DockNode} DockNode
 * @typedef {import("./dock-layout.js").DockEdge} DockEdge
 * @typedef {import("./dock-layout.js").DockPosition} DockPosition
 * @typedef {import("./dock-layout.js").DockDirection} DockDirection
 * @typedef {import("./dock-layout.js").DockRect} DockRect
 */

const EPSILON = 1e-6;

/** The ids `nextGroupId` hands out. */
const GENERATED_ID = /^group-(\d+)$/;

/** @param {number} value */
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * @template T
 * @param {ReadonlyArray<T>} a
 * @param {ReadonlyArray<T> | undefined} b
 */
function sameArray(a, b) {
  return (
    Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
  );
}

/**
 * Sizes that add up to exactly 100, to two decimals.
 *
 * @param {number} count
 * @returns {number[]}
 */
export function equalSizes(count) {
  if (count <= 0) return [];
  const each = round2(100 / count);
  const sizes = Array.from({ length: count }, () => each);
  sizes[count - 1] = round2(100 - each * (count - 1));
  return sizes;
}

/**
 * Scale positive `sizes` to add up to 100, rounded to two decimals. Sizes
 * that are missing, the wrong length, or not positive become equal shares.
 * The same array comes back when it already fits.
 *
 * @param {ReadonlyArray<number> | undefined} sizes
 * @param {number} count
 * @returns {number[]}
 */
export function fitSizes(sizes, count) {
  if (count <= 0) return [];
  if (
    !Array.isArray(sizes) ||
    sizes.length !== count ||
    !sizes.every((size) => Number.isFinite(size) && size > 0)
  ) {
    return equalSizes(count);
  }
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const scaled = sizes.map((size) => round2((size / total) * 100));
  scaled[count - 1] = round2(
    100 - scaled.slice(0, -1).reduce((sum, size) => sum + size, 0),
  );
  if (scaled[count - 1] <= 0) return equalSizes(count);
  return sameArray(scaled, sizes) ? /** @type {number[]} */ (sizes) : scaled;
}

/**
 * Every group, in reading order (inline start to end, top to bottom).
 *
 * @param {DockNode} layout
 * @returns {DockGroup[]}
 */
export function groups(layout) {
  /** @type {DockGroup[]} */
  const found = [];
  /** @param {DockNode} node */
  const visit = (node) => {
    if (node.type === "group") found.push(node);
    else for (const child of node.children) visit(child);
  };
  visit(layout);
  return found;
}

/**
 * @param {DockNode} layout
 * @param {string} groupId
 * @returns {DockGroup | undefined}
 */
export function findGroup(layout, groupId) {
  return groups(layout).find((group) => group.id === groupId);
}

/**
 * The group that holds a tab.
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @returns {DockGroup | undefined}
 */
export function findTab(layout, tabId) {
  return groups(layout).find((group) => group.tabs.includes(tabId));
}

/**
 * Every tab id in the layout, in reading order.
 *
 * @param {DockNode} layout
 * @returns {string[]}
 */
export function tabIds(layout) {
  return groups(layout).flatMap((group) => group.tabs);
}

/**
 * Every group's rectangle as percentages of the whole layout, worked out
 * from the sizes: `x` and `y` count from the inline start and the top.
 *
 * @param {DockNode} layout
 * @returns {Map<string, DockRect>}
 */
export function layoutRects(layout) {
  /** @type {Map<string, DockRect>} */
  const rects = new Map();
  /**
   * @param {DockNode} node
   * @param {DockRect} rect
   */
  const visit = (node, rect) => {
    if (node.type === "group") {
      rects.set(node.id, rect);
      return;
    }
    let offset = 0;
    node.children.forEach((child, i) => {
      const share = node.sizes[i] / 100;
      visit(
        child,
        node.type === "row"
          ? {
              x: rect.x + offset * rect.w,
              y: rect.y,
              w: rect.w * share,
              h: rect.h,
            }
          : {
              x: rect.x,
              y: rect.y + offset * rect.h,
              w: rect.w,
              h: rect.h * share,
            },
      );
      offset += share;
    });
  };
  visit(layout, { x: 0, y: 0, w: 100, h: 100 });
  return rects;
}

/**
 * The id the next new group takes: `group-N`, one past the largest N used.
 *
 * @param {DockNode} layout
 * @returns {string}
 */
export function nextGroupId(layout) {
  let max = 0;
  for (const group of groups(layout)) {
    const match = GENERATED_ID.exec(group.id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `group-${max + 1}`;
}

/**
 * @param {unknown} node
 * @param {Set<string>} ids
 */
function reserveIds(node, ids) {
  if (!node || typeof node !== "object") return;
  const { id, children } = /** @type {any} */ (node);
  if (typeof id === "string") ids.add(id);
  if (Array.isArray(children))
    for (const child of children) reserveIds(child, ids);
}

/**
 * @typedef {object} NormalizeContext
 * @property {Set<string> | null} known
 * @property {Set<string>} seen - Tabs placed so far.
 * @property {Set<string>} reserved - Ids a group asked for.
 * @property {Set<string>} used - Ids handed out so far.
 * @property {number} counter
 */

/** @param {NormalizeContext} context */
function freshId(context) {
  let id;
  do {
    id = `group-${++context.counter}`;
  } while (context.reserved.has(id) || context.used.has(id));
  return id;
}

/**
 * @param {any} node
 * @param {NormalizeContext} context
 * @returns {DockNode | null}
 */
function normalizeNode(node, context) {
  if (!node || typeof node !== "object") return null;
  if (node.type === "group") return normalizeGroup(node, context);
  if (node.type === "row" || node.type === "column") {
    return normalizeSplit(node, context);
  }
  return null;
}

/**
 * @param {any} node
 * @param {NormalizeContext} context
 * @returns {DockGroup | null}
 */
function normalizeGroup(node, context) {
  /** @type {string[]} */
  const tabs = [];
  if (Array.isArray(node.tabs)) {
    for (const id of node.tabs) {
      if (
        typeof id !== "string" ||
        context.seen.has(id) ||
        (context.known && !context.known.has(id))
      ) {
        continue;
      }
      context.seen.add(id);
      tabs.push(id);
    }
  }
  // An empty group collapses; the root alone may stay empty.
  if (tabs.length === 0) return null;
  let id = node.id;
  if (typeof id !== "string" || id === "" || context.used.has(id)) {
    id = freshId(context);
  }
  context.used.add(id);
  const activeId = tabs.includes(node.activeId) ? node.activeId : tabs[0];
  if (
    id === node.id &&
    activeId === node.activeId &&
    sameArray(tabs, node.tabs)
  ) {
    return node;
  }
  return { type: "group", id, tabs, activeId };
}

/**
 * @param {any} node
 * @param {NormalizeContext} context
 * @returns {DockNode | null}
 */
function normalizeSplit(node, context) {
  const kids = Array.isArray(node.children) ? node.children : [];
  const given =
    Array.isArray(node.sizes) &&
    node.sizes.length === kids.length &&
    node.sizes.every(
      (/** @type {unknown} */ size) =>
        typeof size === "number" && Number.isFinite(size) && size > 0,
    )
      ? /** @type {number[]} */ (node.sizes)
      : null;
  /** @type {DockNode[]} */
  const children = [];
  /** @type {number[]} */
  const weights = [];
  kids.forEach((/** @type {unknown} */ kid, /** @type {number} */ i) => {
    const child = normalizeNode(kid, context);
    if (!child) return;
    const weight = given ? given[i] : 1;
    if (child.type !== "group" && child.type === node.type) {
      // A row inside a row is one row.
      child.children.forEach((grandchild, /** @type {number} */ j) => {
        children.push(grandchild);
        weights.push((weight * child.sizes[j]) / 100);
      });
    } else {
      children.push(child);
      weights.push(weight);
    }
  });
  if (children.length === 0) return null;
  if (children.length === 1) return children[0];
  const sizes = fitSizes(weights, children.length);
  if (sameArray(children, node.children) && sameArray(sizes, node.sizes)) {
    return node;
  }
  return { type: node.type, children, sizes };
}

/**
 * Repair a layout, whatever it came from. A layout read back from storage
 * can name tabs that no longer exist, repeat one, or hold a group nobody
 * is left in.
 *
 * - Tabs that are not in `known` (when given), and repeats, are dropped.
 * - A group with no tabs collapses; its space goes to its siblings.
 * - A split with one child becomes that child, and a split inside a split of
 *   the same direction merges into it.
 * - Sizes add up to 100.
 * - An active tab that is missing becomes the first, and a group with no
 *   (or a repeated) id gets one.
 * - A layout with no tab left is one empty group.
 *
 * Returns the same layout when it needs no repair.
 *
 * @param {unknown} layout
 * @param {{ known?: Iterable<string> }} [options]
 * @returns {DockNode}
 */
export function normalizeDockLayout(layout, options = {}) {
  /** @type {Set<string>} */
  const reserved = new Set();
  reserveIds(layout, reserved);
  /** @type {NormalizeContext} */
  const context = {
    known: options.known ? new Set(options.known) : null,
    seen: new Set(),
    reserved,
    used: new Set(),
    counter: 0,
  };
  const result = normalizeNode(layout, context);
  if (result) return result;
  // Nothing is left: keep the first group's id, so a focused group stays valid.
  let id = "group-1";
  const first = firstGroupId(layout);
  if (first) id = first;
  return { type: "group", id, tabs: [] };
}

/**
 * @param {any} node
 * @returns {string | undefined}
 */
function firstGroupId(node) {
  if (!node || typeof node !== "object") return undefined;
  if (node.type === "group") {
    return typeof node.id === "string" && node.id ? node.id : undefined;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const id = firstGroupId(child);
      if (id) return id;
    }
  }
  return undefined;
}

/**
 * Replace one group; the rest of the tree is shared.
 *
 * @param {DockNode} node
 * @param {string} groupId
 * @param {(group: DockGroup) => DockGroup} change
 * @returns {DockNode}
 */
function mapGroup(node, groupId, change) {
  if (node.type === "group") return node.id === groupId ? change(node) : node;
  const children = node.children.map((child) =>
    mapGroup(child, groupId, change),
  );
  return sameArray(children, node.children) ? node : { ...node, children };
}

/**
 * The group without a tab. When it was the active one, the tab that slid
 * into its place takes over, or the one before it at the end.
 *
 * @param {DockGroup} group
 * @param {string} tabId
 * @returns {DockGroup}
 */
function withoutTab(group, tabId) {
  const index = group.tabs.indexOf(tabId);
  if (index < 0) return group;
  const tabs = group.tabs.filter((id) => id !== tabId);
  const activeId =
    group.activeId === tabId
      ? (tabs[index] ?? tabs[index - 1])
      : group.activeId;
  return { ...group, tabs, activeId };
}

/**
 * Close a tab: it leaves its group, a neighbor becomes active, and a group
 * left empty collapses so its siblings take its space.
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @returns {DockNode}
 */
export function closeDockTab(layout, tabId) {
  const group = findTab(layout, tabId);
  if (!group) return layout;
  return normalizeDockLayout(
    mapGroup(layout, group.id, (g) => withoutTab(g, tabId)),
  );
}

/**
 * Make a tab the active one in its group.
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @returns {DockNode}
 */
export function activate(layout, tabId) {
  const group = findTab(layout, tabId);
  if (!group || group.activeId === tabId) return layout;
  return mapGroup(layout, group.id, (g) => ({ ...g, activeId: tabId }));
}

/**
 * Join a tab to a group, at `index` among its tabs (counted with the tab
 * already out of its old place, as `reorder` reports it) or at the end. The
 * tab becomes active. Its old group collapses when it was the last tab.
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @param {string} groupId
 * @param {number} [index]
 * @returns {DockNode}
 */
export function moveDockTab(layout, tabId, groupId, index) {
  const from = findTab(layout, tabId);
  const to = findGroup(layout, groupId);
  if (!from || !to) return layout;
  const rest = to.tabs.filter((id) => id !== tabId);
  const at = Math.min(Math.max(index ?? rest.length, 0), rest.length);
  const tabs = [...rest.slice(0, at), tabId, ...rest.slice(at)];
  if (from.id === to.id) {
    if (sameArray(tabs, to.tabs) && to.activeId === tabId) return layout;
    return mapGroup(layout, to.id, (g) => ({ ...g, tabs, activeId: tabId }));
  }
  const without = mapGroup(layout, from.id, (g) => withoutTab(g, tabId));
  return normalizeDockLayout(
    mapGroup(without, to.id, (g) => ({ ...g, tabs, activeId: tabId })),
  );
}

/**
 * @param {DockNode} node
 * @param {string} targetId
 * @param {DockGroup} added
 * @param {"row" | "column"} orientation
 * @param {boolean} before
 * @returns {DockNode}
 */
function insertBeside(node, targetId, added, orientation, before) {
  if (node.type === "group") {
    if (node.id !== targetId) return node;
    return {
      type: orientation,
      children: before ? [added, node] : [node, added],
      sizes: [50, 50],
    };
  }
  const index = node.children.findIndex(
    (child) => child.type === "group" && child.id === targetId,
  );
  if (index >= 0 && node.type === orientation) {
    const half = node.sizes[index] / 2;
    const target = node.children[index];
    return {
      type: node.type,
      children: [
        ...node.children.slice(0, index),
        ...(before ? [added, target] : [target, added]),
        ...node.children.slice(index + 1),
      ],
      sizes: [
        ...node.sizes.slice(0, index),
        half,
        half,
        ...node.sizes.slice(index + 1),
      ],
    };
  }
  const children = node.children.map((child) =>
    insertBeside(child, targetId, added, orientation, before),
  );
  return sameArray(children, node.children) ? node : { ...node, children };
}

/**
 * Split a group: the tab leaves its group for a new one beside `groupId`,
 * on `edge`. When the group already runs in that direction the new group
 * takes half of the group's share; otherwise the group becomes a split of
 * the two. A group's only tab cannot split from its own group, so that
 * returns the layout as it was.
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @param {string} groupId
 * @param {DockEdge} edge
 * @returns {DockNode}
 */
export function splitDockTab(layout, tabId, groupId, edge) {
  const from = findTab(layout, tabId);
  const target = findGroup(layout, groupId);
  if (!from || !target) return layout;
  if (from.id === target.id && target.tabs.length === 1) return layout;
  const added = {
    type: /** @type {const} */ ("group"),
    id: nextGroupId(layout),
    tabs: [tabId],
    activeId: tabId,
  };
  const without = mapGroup(layout, from.id, (g) => withoutTab(g, tabId));
  return normalizeDockLayout(
    insertBeside(
      without,
      groupId,
      added,
      edge === "start" || edge === "end" ? "row" : "column",
      edge === "start" || edge === "top",
    ),
  );
}

/**
 * Dock a tab onto a group: `"center"` joins it (see {@link moveDockTab}), an edge
 * splits it (see {@link splitDockTab}).
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @param {string} groupId
 * @param {DockPosition} position
 * @param {number} [index] - Where among the group's tabs, for `"center"`.
 * @returns {DockNode}
 */
export function dockTab(layout, tabId, groupId, position, index) {
  return position === "center"
    ? moveDockTab(layout, tabId, groupId, index)
    : splitDockTab(layout, tabId, groupId, position);
}

/**
 * Open a tab: it joins a group (the first, unless `groupId` names one) and
 * becomes active. A tab the layout already holds is activated where it is.
 *
 * @param {DockNode} layout
 * @param {string} tabId
 * @param {string} [groupId]
 * @returns {DockNode}
 */
export function addDockTab(layout, tabId, groupId) {
  if (findTab(layout, tabId)) return activate(layout, tabId);
  const all = groups(layout);
  const target = all.find((group) => group.id === groupId) ?? all[0];
  return mapGroup(layout, target.id, (group) => ({
    ...group,
    tabs: [...group.tabs, tabId],
    activeId: tabId,
  }));
}

/**
 * Set the sizes of the split at `path`, a list of child indexes from the
 * root. The sizes are scaled to add up to 100.
 *
 * @param {DockNode} layout
 * @param {ReadonlyArray<number>} path
 * @param {ReadonlyArray<number>} sizes
 * @returns {DockNode}
 */
export function resize(layout, path, sizes) {
  if (layout.type === "group") return layout;
  const [head, ...rest] = path;
  if (head === undefined) {
    if (sizes.length !== layout.children.length) return layout;
    const next = fitSizes(sizes, layout.children.length);
    return sameArray(next, layout.sizes) ? layout : { ...layout, sizes: next };
  }
  const child = layout.children[head];
  if (!child) return layout;
  const resized = resize(child, rest, sizes);
  if (resized === child) return layout;
  return {
    ...layout,
    children: layout.children.map((c, i) => (i === head ? resized : c)),
  };
}

/**
 * The group beside `groupId` in a direction, found from the sizes: the
 * nearest group beyond its edge that shares the most of its other axis.
 * `"start"` and `"end"` run along a row from the inline start; `"up"` and
 * `"down"` along a column.
 *
 * @param {DockNode} layout
 * @param {string} groupId
 * @param {DockDirection} direction
 * @returns {string | undefined}
 */
export function neighbor(layout, groupId, direction) {
  const rects = layoutRects(layout);
  const from = rects.get(groupId);
  if (!from) return undefined;
  const horizontal = direction === "start" || direction === "end";
  const forward = direction === "end" || direction === "down";
  /** @param {DockRect} r */
  const main = (r) => (horizontal ? [r.x, r.x + r.w] : [r.y, r.y + r.h]);
  /** @param {DockRect} r */
  const cross = (r) => (horizontal ? [r.y, r.y + r.h] : [r.x, r.x + r.w]);
  const [from0, from1] = main(from);
  const [fromCross0, fromCross1] = cross(from);
  /** @type {string | undefined} */
  let best;
  let bestGap = Number.POSITIVE_INFINITY;
  let bestOverlap = 0;
  for (const [id, rect] of rects) {
    if (id === groupId) continue;
    const [m0, m1] = main(rect);
    const gap = forward ? m0 - from1 : from0 - m1;
    if (gap < -EPSILON) continue;
    const [c0, c1] = cross(rect);
    const overlap = Math.min(c1, fromCross1) - Math.max(c0, fromCross0);
    if (overlap <= EPSILON) continue;
    if (
      gap < bestGap - EPSILON ||
      (Math.abs(gap - bestGap) <= EPSILON && overlap > bestOverlap)
    ) {
      best = id;
      bestGap = gap;
      bestOverlap = overlap;
    }
  }
  return best;
}

/**
 * Fit a layout to the tabs that exist now: tabs that are gone leave, and
 * tabs the layout does not hold join the first group (or `groupId`).
 *
 * @param {unknown} layout
 * @param {ReadonlyArray<string>} ids
 * @param {{ groupId?: string }} [options]
 * @returns {DockNode}
 */
export function reconcileDockLayout(layout, ids, options = {}) {
  const fitted = normalizeDockLayout(layout, { known: ids });
  const placed = new Set(tabIds(fitted));
  const missing = ids.filter((id) => !placed.has(id));
  if (missing.length === 0) return fitted;
  const all = groups(fitted);
  const target = all.find((group) => group.id === options.groupId) ?? all[0];
  return mapGroup(fitted, target.id, (group) => ({
    ...group,
    tabs: [...group.tabs, ...missing],
    activeId: group.activeId ?? missing[0],
  }));
}

/**
 * Read a layout back from text, for example from storage. Text that is not
 * JSON gives `undefined`; anything else is repaired by {@link normalizeDockLayout}.
 *
 * @param {string | null | undefined} text
 * @param {{ known?: Iterable<string> }} [options]
 * @returns {DockNode | undefined}
 */
export function parseDockLayout(text, options) {
  if (typeof text !== "string") return undefined;
  try {
    return normalizeDockLayout(JSON.parse(text), options);
  } catch {
    return undefined;
  }
}
