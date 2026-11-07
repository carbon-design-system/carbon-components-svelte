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
 * Items are grouped as `Dropdown` groups them: ungrouped first, then groups in
 * order of first appearance. With a query, only matches stay.
 *
 * @template {SwitcherItemLike} Item
 * @param {object} options
 * @param {ReadonlyArray<Item>} options.items
 * @param {string} options.query
 * @param {(item: Item, query: string) => boolean} [options.matches]
 * @returns {SwitcherSection<Item>[]}
 */
export function buildSwitcherSections({
  items,
  query,
  matches = matchesSwitcherQuery,
}) {
  const searching = query.trim() !== "";
  /** @type {SwitcherSection<Item>[]} */
  const sections = [];
  const rest = items.filter((item) => !searching || matches(item, query));
  for (const item of orderByGroup(rest, (entry) => entry.group)) {
    const heading = item.group || undefined;
    const last = sections[sections.length - 1];
    if (last && last.heading === heading) {
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
