// @ts-check
import {
  getListFormatter,
  getNumberFormatter,
} from "../utils/intl-formatter-cache.js";

/** @typedef {import("./format-list-parts.d.ts").TruncatedListItem} TruncatedListItem */
/** @typedef {import("./format-list-parts.d.ts").ListPart} ListPart */
/** @typedef {import("./format-list-parts.d.ts").FormatListPartsOptions} FormatListPartsOptions */

/**
 * The text of an item.
 * @param {TruncatedListItem} item
 * @returns {string}
 */
export function itemLabel(item) {
  return typeof item === "string" ? item : item.label;
}

/**
 * The default text of the "more" element, `3 more`, with the count in the
 * locale's digits.
 * @param {number} count
 * @param {string} locale
 * @returns {string}
 */
function defaultFormatMore(count, locale) {
  return `${getNumberFormatter(locale).format(count)} more`;
}

/**
 * Run `fn` with `locale`, or with `"en"` when the tag is not a valid
 * locale (`"en_US"`): `Intl` throws a `RangeError` for it, and a list
 * should still render.
 * @template T
 * @param {string} locale
 * @param {(locale: string) => T} fn
 * @returns {T}
 */
function withLocale(locale, fn) {
  try {
    return fn(locale);
  } catch (error) {
    if (error instanceof RangeError && locale !== "en") return fn("en");
    throw error;
  }
}

/**
 * Join items into a locale-correct sentence, as parts, so each item can
 * render as a link or a highlight. Past `max` items, the rest collapse into
 * one trailing "more" element that the locale joins like any other item:
 * `Ada, Grace, and 3 more` in English, `Ada, Grace und 3 weitere` in German.
 * The conjunction, separators and their order come from `Intl.ListFormat`;
 * only the text of the "more" element is supplied (`formatMore`).
 *
 * An item part carries its `item` and its `index` in `items`. The "more"
 * part carries the number of items it stands for. Text between them is a
 * `literal` part. Join `value` of every part to get the sentence.
 *
 * @param {ReadonlyArray<TruncatedListItem>} items
 * @param {FormatListPartsOptions} [options]
 * @returns {ListPart[]}
 * @example
 * formatListParts(["Ada", "Grace", "Alan", "Edsger"], { max: 2 });
 * // Ada, Grace, and 2 more
 */
export function formatListParts(items, options = {}) {
  const {
    max,
    locale = "en",
    type = "conjunction",
    style = "long",
    formatMore = defaultFormatMore,
  } = options;
  const limit =
    typeof max === "number" && max >= 0
      ? Math.floor(max)
      : Number.POSITIVE_INFINITY;
  const shown = Math.min(items.length, limit);
  const hidden = items.length - shown;

  const elements = items.slice(0, shown).map(itemLabel);
  if (hidden > 0) {
    elements.push(withLocale(locale, (tag) => formatMore(hidden, tag)));
  }
  if (elements.length === 0) return [];

  const parts = withLocale(locale, (tag) =>
    getListFormatter(tag, { type, style }).formatToParts(elements),
  );

  /** @type {ListPart[]} */
  const result = [];
  let position = 0;
  for (const part of parts) {
    if (part.type !== "element") {
      result.push({ type: "literal", value: part.value });
      continue;
    }
    const index = position++;
    result.push(
      index < shown
        ? { type: "item", value: part.value, item: items[index], index }
        : { type: "more", value: part.value, count: hidden },
    );
  }
  return result;
}

/**
 * The sentence the parts spell.
 * @param {ReadonlyArray<ListPart>} parts
 * @returns {string}
 */
export function listPartsText(parts) {
  let text = "";
  for (const part of parts) text += part.value;
  return text;
}
