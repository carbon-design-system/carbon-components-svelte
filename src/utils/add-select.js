// @ts-check

/**
 * @typedef {string | number} AddSelectKey
 */

/**
 * @typedef {Object} AddSelectCrumb
 * @property {AddSelectKey} id
 * @property {string} title
 */

/**
 * @typedef {Object} AddSelectItem
 * @property {AddSelectKey} id
 * @property {string} title
 * @property {string} [description]
 * @property {ReadonlyArray<string>} [meta]
 * @property {boolean} [hasChildren]
 * @property {number} [childCount]
 * @property {boolean} [disabled]
 * @property {AddSelectKey | null} [parentId]
 * @property {Record<string, string | ReadonlyArray<string>>} [attributes]
 * @property {ReadonlyArray<AddSelectCrumb>} [path]
 */

/**
 * @typedef {Object} AddSelectRequest
 * @property {string} query
 * @property {AddSelectKey | null} parentId
 * @property {Record<string, ReadonlyArray<string>>} filters
 * @property {"level" | "all"} scope
 */

/**
 * @typedef {Object} AddSelectPage
 * @property {ReadonlyArray<AddSelectItem>} items
 * @property {number | null} nextCursor
 * @property {number} total
 */

const ROOT = Symbol("root");
const WHITESPACE = /\s+/;

/**
 * @typedef {Object} ItemsIndex
 * @property {Map<AddSelectKey | symbol, AddSelectItem[]>} byParent
 * @property {Map<AddSelectKey, AddSelectItem>} byId
 */

/** @type {WeakMap<ReadonlyArray<AddSelectItem>, ItemsIndex>} */
const indexes = new WeakMap();

/**
 * Group a flat list by `parentId` once per array, so a level is a lookup
 * and a search across levels is one pass.
 * @param {ReadonlyArray<AddSelectItem>} items
 * @returns {ItemsIndex}
 */
function indexItems(items) {
  const known = indexes.get(items);
  if (known) return known;
  /** @type {ItemsIndex} */
  const index = { byParent: new Map(), byId: new Map() };
  for (const item of items) {
    index.byId.set(item.id, item);
    const parent = item.parentId ?? ROOT;
    const siblings = index.byParent.get(parent);
    if (siblings) siblings.push(item);
    else index.byParent.set(parent, [item]);
  }
  indexes.set(items, index);
  return index;
}

/**
 * The ancestors of `item`, root first.
 * @param {ItemsIndex} index
 * @param {AddSelectItem} item
 * @returns {AddSelectCrumb[]}
 */
function pathOf(index, item) {
  /** @type {AddSelectCrumb[]} */
  const path = [];
  let parent = item.parentId;
  for (let guard = 0; parent != null && guard < 100; guard++) {
    const node = index.byId.get(parent);
    if (!node) break;
    path.unshift({ id: node.id, title: node.title });
    parent = node.parentId;
  }
  return path;
}

/**
 * @param {AddSelectItem} item
 * @param {ReadonlyArray<string>} words
 */
function matchesQuery(item, words) {
  if (words.length === 0) return true;
  const text = `${item.title} ${item.description ?? ""}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

/**
 * An item passes a filter group when it carries one of the chosen values.
 * @param {AddSelectItem} item
 * @param {Record<string, ReadonlyArray<string>>} filters
 */
function matchesFilters(item, filters) {
  for (const id of Object.keys(filters)) {
    const chosen = filters[id];
    if (chosen.length === 0) continue;
    const has = item.attributes?.[id];
    if (has === undefined) return false;
    const values = typeof has === "string" ? [has] : has;
    if (!chosen.some((value) => values.includes(value))) return false;
  }
  return true;
}

/**
 * Whether any filter group has a chosen value.
 * @param {Record<string, ReadonlyArray<string>>} filters
 */
function hasFilters(filters) {
  return Object.keys(filters).some((id) => filters[id].length > 0);
}

/**
 * Answer an `AddSelect` request from a flat array of items, one page at a
 * time. The cursor is the offset of the next page.
 *
 * - A level is the children of `parentId` (`null` is the top level).
 * - `scope: "all"` searches every level and gives each result its `path`.
 * - A filter keeps items whose `attributes[filterId]` holds a chosen value.
 *   Items that can be opened (`hasChildren`) stay in a level whatever the
 *   filters, so the level can still be entered, and never match across
 *   levels, where a result is something to pick.
 * - A query matches when every word is in the title or description.
 *
 * @param {ReadonlyArray<AddSelectItem>} items
 * @param {{ pageSize?: number }} [options]
 * @returns {(request: AddSelectRequest, context?: { cursor?: number | null }) => AddSelectPage}
 */
export function createItemsFetcher(items, options = {}) {
  const pageSize = Math.max(1, options.pageSize ?? 40);
  return (request, context = {}) => {
    const index = indexItems(items);
    const words = request.query.toLowerCase().split(WHITESPACE).filter(Boolean);
    const filtering = hasFilters(request.filters);
    const global = request.scope === "all";
    const pool = global
      ? items
      : (index.byParent.get(request.parentId ?? ROOT) ?? []);
    const start = context.cursor ?? 0;

    /** @type {AddSelectItem[]} */
    const matched = [];
    for (const item of pool) {
      if (!matchesQuery(item, words)) continue;
      if (filtering) {
        if (item.hasChildren) {
          if (global) continue;
        } else if (!matchesFilters(item, request.filters)) continue;
      }
      matched.push(item);
    }
    const page = matched.slice(start, start + pageSize);
    return {
      items: global
        ? page.map((item) => ({ ...item, path: pathOf(index, item) }))
        : page,
      nextCursor: start + pageSize < matched.length ? start + pageSize : null,
      total: matched.length,
    };
  };
}

/**
 * The text of a breadcrumb path, for a result row that shows where it lives.
 * @param {ReadonlyArray<AddSelectCrumb> | undefined} path
 * @param {string} [separator]
 */
export function formatItemPath(path, separator = " / ") {
  return path && path.length > 0
    ? path.map((crumb) => crumb.title).join(separator)
    : "";
}

/**
 * Drop empty filter groups and sort the rest, so two requests that mean the
 * same cache as one.
 * @param {Record<string, ReadonlyArray<string>>} filterValue
 * @returns {Record<string, ReadonlyArray<string>>}
 */
export function activeFilters(filterValue) {
  /** @type {Record<string, ReadonlyArray<string>>} */
  const active = {};
  for (const id of Object.keys(filterValue).sort()) {
    const chosen = filterValue[id];
    if (chosen && chosen.length > 0) active[id] = [...chosen].sort();
  }
  return active;
}
