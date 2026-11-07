// @ts-check
import { orderByGroup } from "../ListBox/menu-groups.js";

/**
 * @typedef {object} SwitcherItemLike
 * @property {string | number} id
 * @property {string} text
 * @property {string} [description]
 * @property {string} [group]
 */

/**
 * @template {SwitcherItemLike} Item
 * @typedef {object} SwitcherSection
 * @property {string} key Stable key for a keyed `{#each}`.
 * @property {string | undefined} heading `undefined` for items that have no group.
 * @property {Item[]} items
 */

const MARKS = /\p{M}/gu;
const WHITESPACE = /\s+/;

/**
 * Lowercase and drop accents, so "zoe" finds "Zoë".
 * @param {string} value
 * @returns {string}
 */
function fold(value) {
  return value.normalize("NFD").replace(MARKS, "").toLowerCase();
}

/**
 * Whether every word of `query` appears in the item's text or description.
 * An empty query matches everything.
 *
 * @param {SwitcherItemLike} item
 * @param {string} query
 * @returns {boolean}
 */
export function matchesSwitcherQuery(item, query) {
  const words = fold(query).split(WHITESPACE).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fold(`${item.text} ${item.description ?? ""}`);
  return words.every((word) => haystack.includes(word));
}

/**
 * Split items into the sections a switcher renders.
 *
 * With no query: a "recent" section first (the items named by `recentIds`
 * that exist, in that order, without the current one), then the rest by
 * group, ungrouped first and groups in order of first appearance, as
 * `Dropdown` groups them. An item is in one section only, so a screen reader
 * never reads it twice.
 *
 * With a query: matches only, by group, with no recent section.
 *
 * @template {SwitcherItemLike} Item
 * @param {object} options
 * @param {ReadonlyArray<Item>} options.items
 * @param {string} options.query
 * @param {ReadonlyArray<string | number> | undefined} [options.recentIds] `undefined` turns the recent section off.
 * @param {number} [options.recentLimit]
 * @param {string | number | undefined} [options.selectedId]
 * @param {string} [options.recentHeading]
 * @param {(item: Item, query: string) => boolean} [options.matches]
 * @returns {SwitcherSection<Item>[]}
 */
export function buildSwitcherSections({
  items,
  query,
  recentIds,
  recentLimit = 3,
  selectedId,
  recentHeading = "Recent",
  matches = matchesSwitcherQuery,
}) {
  const searching = query.trim() !== "";
  /** @type {SwitcherSection<Item>[]} */
  const sections = [];
  /** @type {Set<string | number>} */
  const taken = new Set();

  if (!searching && recentIds && recentLimit > 0) {
    /** @type {Map<string | number, Item>} */
    const byId = new Map(items.map((item) => [item.id, item]));
    /** @type {Item[]} */
    const recent = [];
    for (const id of recentIds) {
      const item = byId.get(id);
      if (item && id !== selectedId && !taken.has(id)) {
        recent.push(item);
        taken.add(id);
        if (recent.length === recentLimit) break;
      }
    }
    if (recent.length > 0) {
      sections.push({ key: "recent", heading: recentHeading, items: recent });
    }
  }

  const rest = items.filter(
    (item) => !taken.has(item.id) && (!searching || matches(item, query)),
  );
  for (const item of orderByGroup(rest, (entry) => entry.group)) {
    const heading = item.group || undefined;
    const last = sections[sections.length - 1];
    if (last && last.key !== "recent" && last.heading === heading) {
      last.items.push(item);
    } else {
      sections.push({
        key: `group-${heading ?? ""}`,
        heading,
        items: [item],
      });
    }
  }
  return sections;
}

/**
 * The recent list after switching from `previousId` to `nextId`: the account
 * that was left goes first, the one chosen is dropped (it is current), and
 * the list stays within `limit`.
 *
 * @param {ReadonlyArray<string | number>} recentIds
 * @param {string | number | undefined} previousId
 * @param {string | number} nextId
 * @param {number} limit
 * @returns {Array<string | number>}
 */
export function pushRecentId(recentIds, previousId, nextId, limit) {
  if (previousId === undefined || previousId === nextId) {
    return recentIds.filter((id) => id !== nextId).slice(0, limit);
  }
  return [
    previousId,
    ...recentIds.filter((id) => id !== previousId && id !== nextId),
  ].slice(0, limit);
}
