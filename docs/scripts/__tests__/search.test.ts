import { describe, expect, test } from "bun:test";
import MiniSearch from "minisearch";
import SEARCH_INDEX from "../__fixtures__/search-index.json";

/**
 * Baseline for the docs header search. `search-index.json` is a frozen
 * subset of a real generated SEARCH_INDEX.json, kept small but including
 * the components (Button/ButtonSet, Select/SelectableTile, Tag/TagSet, ...)
 * whose overlapping names make ranking easy to get subtly wrong.
 *
 * This locks in the current (MiniSearch) engine's behavior. If the search
 * engine or its config ever changes, re-run this suite against the new
 * engine to see exactly which queries changed rank before merging.
 */

type SearchIndexDocument = {
  id: string;
  text: string;
  description: string;
  href: string;
  isComponent: boolean;
};

function createIndex() {
  const miniSearch = new MiniSearch<SearchIndexDocument>({
    fields: ["text", "description"],
    storeFields: ["text", "description", "href", "isComponent"],
    searchOptions: {
      prefix: true,
      boost: { description: 2 },
      fuzzy: 0.1,
    },
  });
  miniSearch.addAll(SEARCH_INDEX as SearchIndexDocument[]);
  return miniSearch;
}

function topHrefs(
  miniSearch: MiniSearch<SearchIndexDocument>,
  query: string,
  n = 10,
) {
  return miniSearch
    .search(query)
    .slice(0, n)
    .map((r) => String(r.href));
}

describe("docs search baseline", () => {
  const miniSearch = createIndex();

  test.each([
    ["Button", "/components/Button"],
    ["Text", "/components/Text"],
    ["Select", "/components/Select"],
    ["Tag", "/components/Tag"],
    ["Pagination", "/components/Pagination"],
    ["Menu", "/components/Menu"],
    ["Search", "/components/Search"],
    ["Tooltip", "/components/Tooltip"],
    ["Toggle", "/components/Toggle"],
    ["MultiSelect", "/components/MultiSelect"],
  ])(
    "exact component name %s ranks its own page first",
    (query, expectedTop) => {
      expect(topHrefs(miniSearch, query)[0]).toBe(expectedTop);
    },
  );

  test("typo tolerance matches a close misspelling", () => {
    expect(topHrefs(miniSearch, "buton")[0]).toBe("/components/Button");
  });

  test("short query does not fuzzy-match an unrelated word", () => {
    // "tile" (4 chars) must not fuzzy-match "title"-shaped tokens.
    expect(topHrefs(miniSearch, "tile")[0]).toBe("/components/Tile");
  });

  test("multi-term query matches across the text and description fields", () => {
    // "multiselect" hits the `text` field, "bas" (prefix of "Basic") hits `description`.
    expect(topHrefs(miniSearch, "multiselect bas")[0]).toBe(
      "/components/MultiSelect",
    );
  });

  test("a section heading query ranks the matching heading first", () => {
    expect(topHrefs(miniSearch, "close button")[0]).toBe(
      "/components/InlineNotification#close-button",
    );
  });

  test("empty query returns no results", () => {
    expect(topHrefs(miniSearch, "")).toEqual([]);
  });
});
