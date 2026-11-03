// @ts-check
import {
  languageEndonym,
  languageName,
  listLanguages,
  listLanguageVariants,
  matchLanguage,
} from "./intl-display-names.js";
import { searchText } from "./intl-search.js";
import { localeDirection } from "./locale-direction.js";

/**
 * @typedef {object} LanguageItem
 * @property {string} id The BCP 47 tag, such as "pt-BR" or "zh-Hant".
 * @property {string} text The name in the UI locale.
 * @property {string} search Folded text the query is matched against.
 */

/**
 * @typedef {object} LanguageDetail
 * @property {string} value The BCP 47 tag.
 * @property {string} name The name in the UI locale.
 * @property {string} endonym The name in the language itself, or `""` when it
 * is the same as `name`.
 * @property {"ltr" | "rtl"} dir The direction the endonym is written in.
 */

/**
 * The list of languages for one picker, with each one's name in the UI locale
 * and in itself. Endonyms are found in slices while the browser is idle, or at
 * once when a query arrives first.
 *
 * @param {{
 *   locale: string;
 *   values?: ReadonlyArray<string>;
 *   variants?: boolean;
 *   languageDisplay?: "dialect" | "standard";
 * }} options
 */
export function createLanguageSource({
  locale,
  values,
  variants = false,
  languageDisplay,
}) {
  const tags = values
    ? [...new Set(values)]
    : [...listLanguages(), ...(variants ? listLanguageVariants() : [])];
  const collator = new Intl.Collator(locale);

  /** @type {LanguageItem[]} */
  const items = tags.map((tag) => {
    const name = languageName(locale, tag, languageDisplay) ?? tag;
    return { id: tag, text: name, search: searchText([name, tag]) };
  });
  if (!values) items.sort((a, b) => collator.compare(a.text, b.text));

  const itemsById = new Map(items.map((item) => [item.id, item]));
  /** @type {Map<string, string>} */
  const endonyms = new Map();
  let built = 0;

  /**
   * @param {string} tag
   * @returns {string}
   */
  function endonym(tag) {
    let name = endonyms.get(tag);
    if (name === undefined) {
      const own = languageEndonym(tag, languageDisplay) ?? "";
      name = own && own !== itemsById.get(tag)?.text ? own : "";
      endonyms.set(tag, name);
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
        : (languageName("en", item.id, languageDisplay) ?? "");
      item.search = searchText([item.text, item.id, endonym(item.id), english]);
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
     * @param {string} tag
     * @returns {LanguageDetail}
     */
    detail(tag) {
      return {
        value: tag,
        name: itemsById.get(tag)?.text ?? languageName(locale, tag) ?? tag,
        endonym: endonym(tag),
        dir: localeDirection(tag),
      };
    },
    /**
     * @param {string} value
     * @returns {string}
     */
    resolve(value) {
      if (itemsById.has(value)) return value;
      try {
        const canonical = Intl.getCanonicalLocales(value)[0];
        return itemsById.has(canonical) ? canonical : value;
      } catch {
        return value;
      }
    },
    /** The browser's best language that the list has. */
    detect() {
      if (typeof navigator === "undefined") return "";
      return matchLanguage(
        navigator.languages ?? [navigator.language],
        items.map((item) => item.id),
      );
    },
  };
}
