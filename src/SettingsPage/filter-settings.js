// @ts-check

import { fuzzyMatch } from "../utils/fuzzy-match.js";

/**
 * @typedef {import("./filter-settings.js").SettingsSearchSection} SettingsSearchSection
 * @typedef {import("./filter-settings.js").SettingsSearchResult} SettingsSearchResult
 * @typedef {import("./filter-settings.js").FilterSettingsOptions} FilterSettingsOptions
 */

const WHITESPACE = /\s+/;

/**
 * Match one term against some text. Returns the indices to highlight, or
 * `null` when the term is absent.
 *
 * @param {string | undefined} text
 * @param {string} term
 * @param {number} threshold
 * @returns {number[] | null}
 */
function matchText(text, term, threshold) {
  if (!text) return null;
  const match = fuzzyMatch(text, term, { threshold });
  return match.matched ? match.indices : null;
}

/**
 * @param {ReadonlyArray<string> | undefined} keywords
 * @param {string} term
 * @param {number} threshold
 */
function matchKeywords(keywords, term, threshold) {
  return (keywords ?? []).some((keyword) =>
    matchText(keyword, term, threshold),
  );
}

/**
 * The indices a term matched in each field of a block, or `null` for a
 * field it missed. `other` is true when a hidden field, keywords, matched.
 *
 * @param {string} term
 * @param {{ text?: string, description?: string, keywords?: ReadonlyArray<string> }} fields
 * @param {number} threshold
 */
function matchFields(term, fields, threshold) {
  const text = matchText(fields.text, term, threshold);
  const description = matchText(fields.description, term, threshold);
  const keywords = matchKeywords(fields.keywords, term, threshold);
  return {
    text,
    description,
    matched: text !== null || description !== null || keywords,
  };
}

/**
 * @param {number[]} into
 * @param {number[] | null} indices
 */
function addIndices(into, indices) {
  if (indices) into.push(...indices);
}

/**
 * @param {number[]} indices
 * @returns {number[]}
 */
function uniqueSorted(indices) {
  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * Filter settings by label, description and keywords. Every word of the
 * query must match somewhere in an item or its section. A section shows
 * when one of its items does.
 *
 * @param {ReadonlyArray<SettingsSearchSection>} sections
 * @param {string} query
 * @param {FilterSettingsOptions} [options]
 * @returns {SettingsSearchResult}
 */
export function filterSettings(sections, query, options = {}) {
  const { threshold = 0.5 } = options;
  const terms = (query ?? "").trim().split(WHITESPACE).filter(Boolean);
  const trimmed = terms.join(" ");
  let count = 0;

  const results = sections.map((section) => {
    /** @type {number[]} */
    const titleIndices = [];
    const sectionTerms = terms.map((term) => {
      const match = matchFields(
        term,
        {
          text: section.title,
          description: section.description,
          keywords: section.keywords,
        },
        threshold,
      );
      addIndices(titleIndices, match.text);
      return match.matched;
    });

    const items = section.items.map((item) => {
      /** @type {number[]} */
      const labelIndices = [];
      /** @type {number[]} */
      const descriptionIndices = [];
      let matched = true;
      for (let index = 0; index < terms.length; index++) {
        const match = matchFields(
          terms[index],
          {
            text: item.label,
            description: item.description,
            keywords: item.keywords,
          },
          threshold,
        );
        addIndices(labelIndices, match.text);
        addIndices(descriptionIndices, match.description);
        if (!match.matched && !sectionTerms[index]) matched = false;
      }
      if (matched) count++;
      return {
        id: item.id,
        matched,
        labelIndices: matched ? uniqueSorted(labelIndices) : [],
        descriptionIndices: matched ? uniqueSorted(descriptionIndices) : [],
      };
    });

    const matched =
      terms.length === 0 ||
      items.some((item) => item.matched) ||
      (items.length === 0 && sectionTerms.every(Boolean));
    return {
      id: section.id,
      matched,
      titleIndices: matched ? uniqueSorted(titleIndices) : [],
      items,
    };
  });

  return { query: trimmed, count, sections: results };
}
