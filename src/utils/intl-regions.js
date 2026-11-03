// @ts-check
import {
  listRegions,
  localeRegion,
  regionFlag,
  regionName,
  regionNativeName,
} from "./intl-display-names.js";
import { searchText } from "./intl-search.js";

/**
 * @typedef {object} RegionItem
 * @property {string} id The region code, such as "US" or "150".
 * @property {string} text The name in the UI locale.
 * @property {string} search Folded text the query is matched against.
 */

/**
 * @typedef {object} RegionDetail
 * @property {string} value The region code.
 * @property {string} name The name in the UI locale.
 * @property {string} nativeName The name in the region's main language, or
 * `""` when that is the UI language or the engine has no data.
 * @property {string} flag The flag emoji, or `""` for a code that is not two
 * letters.
 */

/**
 * The list of regions for one picker, and the names and flags behind its rows
 * and its search. Native names are found in slices while the browser is idle,
 * or at once when a query arrives first.
 *
 * @param {{ locale: string; values?: ReadonlyArray<string> }} options
 */
export function createRegionSource({ locale, values }) {
  const codes = values ? [...new Set(values)] : listRegions();
  const collator = new Intl.Collator(locale);

  /** @type {RegionItem[]} */
  const items = codes.map((code) => {
    const name = regionName(locale, code) ?? code;
    return { id: code, text: name, search: searchText([name, code]) };
  });
  if (!values) items.sort((a, b) => collator.compare(a.text, b.text));

  const itemsById = new Map(items.map((item) => [item.id, item]));
  /** @type {Map<string, string>} */
  const nativeNames = new Map();
  let built = 0;

  /**
   * @param {string} code
   * @returns {string}
   */
  function nativeName(code) {
    let name = nativeNames.get(code);
    if (name === undefined) {
      const own = regionNativeName(code) ?? "";
      name = own && own !== itemsById.get(code)?.text ? own : "";
      nativeNames.set(code, name);
    }
    return name;
  }

  /**
   * @param {number} deadline
   * @returns {boolean}
   */
  function warm(deadline) {
    while (built < items.length) {
      const item = items[built];
      const english = locale.startsWith("en")
        ? ""
        : (regionName("en", item.id) ?? "");
      item.search = searchText([
        item.text,
        item.id,
        nativeName(item.id),
        english,
      ]);
      built++;
      if (built < items.length && performance.now() >= deadline) return false;
    }
    return true;
  }

  return {
    items,
    ensure() {
      if (built < items.length) warm(Number.POSITIVE_INFINITY);
    },
    warm,
    /**
     * @param {string} code
     * @returns {RegionDetail}
     */
    detail(code) {
      return {
        value: code,
        name: itemsById.get(code)?.text ?? regionName(locale, code) ?? code,
        nativeName: nativeName(code),
        flag: regionFlag(code),
      };
    },
    /**
     * @param {string} value
     * @returns {string}
     */
    resolve(value) {
      const upper = value.toUpperCase();
      return itemsById.has(upper) ? upper : value;
    },
    /** The region the UI locale is most likely used in, if listed. */
    detect() {
      const region = localeRegion(locale);
      return itemsById.has(region) ? region : "";
    },
  };
}
