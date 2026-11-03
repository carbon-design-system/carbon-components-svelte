// @ts-check
// Group the items of a picker into sections: the recently used items, then
// one section per category. Pure, so the order and the counts are decided
// once and read by the layout, the category bar and the keyboard.

/**
 * @template Item
 * @typedef {Object} PickerSections
 * @property {Item[]} list - Every cell in display order. An item that is recent and in a category appears in both sections.
 * @property {number[]} counts - Cells in each section.
 * @property {string[]} ids - Section ids: `"recent"`, a category id, `"uncategorized"`, or `"results"`.
 * @property {string[]} labels - Section labels, `""` for a section with no header.
 * @property {boolean[]} headers - Whether each section has a header row.
 */

/**
 * @template {{ id: string, category?: string }} Item
 * @param {Object} options
 * @param {ReadonlyArray<Item>} options.items
 * @param {ReadonlyArray<{ id: string, label?: string }>} [options.categories] - The order and labels of the categories. A category not listed follows, in order of first appearance.
 * @param {ReadonlyArray<Item>} [options.recent] - The recently used items, newest first.
 * @param {string} [options.recentText] - Header of the recent section.
 * @param {string} [options.otherText] - Header of the items with no category, when others have one or there is a recent section.
 * @param {boolean} [options.grouped] - `false` lays every item out in one section with no header, for search results.
 * @returns {PickerSections<Item>}
 */
export function buildPickerSections({
  items,
  categories = [],
  recent = [],
  recentText = "Recent",
  otherText = "All",
  grouped = true,
}) {
  if (!grouped) {
    return {
      list: [...items],
      counts: [items.length],
      ids: ["results"],
      labels: [""],
      headers: [false],
    };
  }

  /** @type {Map<string, Item[]>} */
  const byCategory = new Map();
  for (const { id } of categories) byCategory.set(id, []);
  /** @type {Item[]} */
  const uncategorized = [];
  for (const item of items) {
    if (item.category === undefined || item.category === "") {
      uncategorized.push(item);
      continue;
    }
    const bucket = byCategory.get(item.category);
    if (bucket) bucket.push(item);
    else byCategory.set(item.category, [item]);
  }

  /** @type {Item[]} */
  const list = [];
  /** @type {number[]} */
  const counts = [];
  /** @type {string[]} */
  const ids = [];
  /** @type {string[]} */
  const labels = [];

  /**
   * @param {string} id
   * @param {string} label
   * @param {ReadonlyArray<Item>} cells
   */
  const add = (id, label, cells) => {
    if (cells.length === 0) return;
    list.push(...cells);
    counts.push(cells.length);
    ids.push(id);
    labels.push(label);
  };

  add("recent", recentText, recent);
  const named = new Map(categories.map(({ id, label }) => [id, label ?? id]));
  for (const [id, cells] of byCategory) add(id, named.get(id) ?? id, cells);
  const categorized = ids.length > (recent.length > 0 ? 1 : 0);
  add(
    "uncategorized",
    categorized || recent.length > 0 ? otherText : "",
    uncategorized,
  );

  // A lone section with no label needs no header.
  return {
    list,
    counts,
    ids,
    labels,
    headers: labels.map((label) => label !== ""),
  };
}
