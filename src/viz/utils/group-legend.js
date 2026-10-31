// @ts-check
// A toggleable group legend: the group keys of a dataset in first-seen
// order, a stable color per key, the rows left once some groups are hidden,
// and the hidden list after a toggle. Shared by the charts that color by
// group rather than by series.
import { categoricalColors, vizColor } from "./tokens.js";

/**
 * Group keys in first-seen order, as strings. Rows with no group, or an
 * empty one, are left out, so a chart with no `group` accessor has no legend.
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {((row: T, index: number) => unknown) | undefined} groupOf
 * @returns {string[]}
 */
export function listGroups(rows, groupOf) {
  if (!groupOf) return [];
  /** @type {string[]} */
  const keys = [];
  const seen = new Set();
  rows.forEach((row, i) => {
    const key = groupOf(row, i);
    if (key === undefined || key === null) return;
    const text = String(key);
    // An empty group is the neutral, ungrouped case: not a legend entry.
    if (text === "") return;
    if (seen.has(text)) return;
    seen.add(text);
    keys.push(text);
  });
  return keys;
}

/**
 * A color per key from the palette, overridden by `fixed`. Computed from
 * every key, hidden ones included, so hiding a group never recolors the rest.
 * @param {ReadonlyArray<string>} keys
 * @param {number} palette
 * @param {Record<string, import("./tokens.d.ts").VizColor>} fixed
 * @returns {Record<string, string>}
 */
export function colorGroups(keys, palette, fixed) {
  const assigned = categoricalColors(keys.length, palette);
  /** @type {Record<string, string>} */
  const out = {};
  keys.forEach((key, i) => {
    out[key] =
      fixed[key] === undefined
        ? assigned[i]
        : (vizColor(fixed[key]) ?? assigned[i]);
  });
  return out;
}

/**
 * The rows whose group is not hidden.
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {((row: T, index: number) => unknown) | undefined} groupOf
 * @param {ReadonlySet<string>} hidden
 * @returns {ReadonlyArray<T>}
 */
export function dropGroups(rows, groupOf, hidden) {
  if (!groupOf || hidden.size === 0) return rows;
  return rows.filter((row, i) => !hidden.has(String(groupOf(row, i))));
}

/**
 * The rows left in a hierarchy once hidden groups are pruned: a row goes
 * when its own group or any ancestor's is hidden, so no subtree is orphaned.
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {(row: T, index: number) => unknown} idOf
 * @param {(row: T, index: number) => unknown} parentOf
 * @param {((row: T, index: number) => unknown) | undefined} groupOf
 * @param {ReadonlySet<string>} hidden
 * @returns {ReadonlyArray<T>}
 */
export function pruneGroups(rows, idOf, parentOf, groupOf, hidden) {
  if (!groupOf || hidden.size === 0) return rows;
  /** @type {Map<string, number>} */
  const indexOf = new Map();
  rows.forEach((row, i) => {
    indexOf.set(String(idOf(row, i)), i);
  });
  const readGroup = groupOf;
  /** @type {Map<number, boolean>} */
  const gone = new Map();
  /**
   * @param {number} i
   * @returns {boolean}
   */
  function isGone(i) {
    const known = gone.get(i);
    if (known !== undefined) return known;
    // Mark first so a cycle terminates.
    gone.set(i, false);
    const row = rows[i];
    let result = hidden.has(String(readGroup(row, i)));
    if (!result) {
      const parent = parentOf(row, i);
      const up =
        parent === undefined || parent === null
          ? undefined
          : indexOf.get(String(parent));
      if (up !== undefined && up !== i) result = isGone(up);
    }
    gone.set(i, result);
    return result;
  }
  return rows.filter((_, i) => !isGone(i));
}

/**
 * The hidden list after toggling `key`, or `null` when the toggle would hide
 * the last visible group.
 * @param {ReadonlyArray<string | number>} hidden
 * @param {string} key
 * @param {number} total Number of groups.
 * @returns {Array<string | number> | null}
 */
export function nextHidden(hidden, key, total) {
  const index = hidden.findIndex((entry) => String(entry) === key);
  if (index >= 0) return hidden.filter((_, i) => i !== index);
  if (hidden.length + 1 >= total) return null;
  return [...hidden, key];
}

/**
 * For a hierarchy colored by branch rather than by a group field: an
 * accessor from a row to its branch key, the id of its ancestor just under
 * the center. The center is `root` when given, else the lone top node; with
 * several top nodes each is its own branch. The center itself, and rows
 * outside it, read as the empty key.
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {(row: T, index: number) => unknown} idOf
 * @param {(row: T, index: number) => unknown} parentOf
 * @param {string | number | null | undefined} root
 * @returns {(row: T, index: number) => string}
 */
export function branchAccessor(rows, idOf, parentOf, root) {
  /** @type {Map<string, string | null>} */
  const parentById = new Map();
  rows.forEach((row, i) => {
    const parent = parentOf(row, i);
    parentById.set(
      String(idOf(row, i)),
      parent === undefined || parent === null || !hasId(parent)
        ? null
        : String(parent),
    );
  });
  /** @param {unknown} id */
  function hasId(id) {
    return rows.some((row, i) => String(idOf(row, i)) === String(id));
  }
  const tops = [...parentById]
    .filter(([, up]) => up === null)
    .map(([id]) => id);
  const center =
    root === undefined || root === null
      ? tops.length === 1
        ? tops[0]
        : null
      : String(root);
  /** @type {Map<string, string>} */
  const branchById = new Map();
  /** @param {string} id */
  function branchOf(id) {
    const known = branchById.get(id);
    if (known !== undefined) return known;
    branchById.set(id, "");
    const up = parentById.get(id);
    let branch = "";
    if (id === center) branch = "";
    else if (up === null || up === undefined)
      branch = center === null ? id : "";
    else if (up === center) branch = id;
    else branch = branchOf(up);
    branchById.set(id, branch);
    return branch;
  }
  return (row, i) => branchOf(String(idOf(row, i)));
}
