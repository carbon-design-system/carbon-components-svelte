// @ts-check

/**
 * @typedef {import("../utils/icon-component.js").IconComponent} IconComponent
 * @typedef {() => Promise<IconComponent | { default: IconComponent }>} IconLoader
 */

/**
 * @typedef {object} IconPickerItem
 * @property {string} id - The icon's name. It is the `value` of the picker.
 * @property {string} label - What search matches and assistive technology reads, such as "Add alt".
 * @property {string} [category] - The `id` of the category the icon belongs to.
 * @property {ReadonlyArray<string>} [keywords] - More words search matches.
 * @property {IconComponent} [icon] - The icon, when it is already imported.
 * @property {IconLoader} [load] - Imports the icon on demand, as the picker needs it on screen. Not called when `icon` is set.
 */

const SEPARATORS = /[_-]+/g;
const ACRONYM_END = /([A-Z]+)([A-Z][a-z])/g;
const WORD_START = /([a-z])([A-Z0-9])/g;
const DIGIT_END = /([0-9])([A-Za-z])/g;
const DIRECTORY = /^.*\//;
const EXTENSION = /\.[a-z]+$/i;

/**
 * "AddAlt" to "Add alt", "UIShell" to "UI shell": words split at a capital
 * letter or a digit, the first one capitalized, acronyms kept.
 * @param {string} name
 * @returns {string}
 */
export function iconLabel(name) {
  const words = name
    .replace(SEPARATORS, " ")
    .replace(ACRONYM_END, "$1 $2")
    .replace(WORD_START, "$1 $2")
    .replace(DIGIT_END, "$1 $2")
    .split(" ")
    .filter(Boolean);
  return words
    .map((word, index) => {
      if (word.length > 1 && word === word.toUpperCase()) return word;
      const lower = word.toLowerCase();
      return index === 0 ? lower[0].toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

/**
 * A loader is an arrow function with no prototype, which is what
 * `import.meta.glob` gives. A component is a class (Svelte 3 and 4) or a
 * function declaration (Svelte 5), and both have one.
 * @param {unknown} value
 * @returns {value is IconLoader}
 */
function isLoader(value) {
  return typeof value === "function" && !("prototype" in value);
}

/**
 * Turn the icons a bundler hands over into `IconPickerItem`s, named by the
 * file or the key. The keys can be paths: `/lib/AddAlt.svelte` is `AddAlt`.
 *
 * A value can be an imported icon, a module (`import.meta.glob` with
 * `{ eager: true }`), or a loader (`import.meta.glob` on its own), which keeps
 * the icon out of the bundle until the picker shows it.
 *
 * @param {Record<string, unknown>} source
 * @param {Object} [options]
 * @param {(id: string, label: string) => string | undefined} [options.category] - Sort an icon into a category.
 * @returns {IconPickerItem[]}
 */
export function toIconItems(source, options = {}) {
  return Object.entries(source).map(([key, value]) => {
    const id = key.replace(DIRECTORY, "").replace(EXTENSION, "");
    const label = iconLabel(id);
    /** @type {IconPickerItem} */
    const item = { id, label };
    // The name as written finds an icon too: "addalt".
    if (label.toLowerCase() !== id.toLowerCase()) item.keywords = [id];
    const category = options.category?.(id, label);
    if (category !== undefined) item.category = category;
    if (isLoader(value)) item.load = value;
    else if (value && typeof value === "object" && "default" in value) {
      item.icon = /** @type {IconComponent} */ (value.default);
    } else item.icon = /** @type {IconComponent} */ (value);
    return item;
  });
}
