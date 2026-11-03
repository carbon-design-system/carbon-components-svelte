// @vitest-environment node
import {
  canonicalOffsetQuery,
  createSearchFilter,
  foldText,
  matchesTokens,
  parseQuery,
  searchText,
} from "../../src/utils/intl-search.js";

describe("canonicalOffsetQuery", () => {
  it.each([
    ["+5:30", "+05:30"],
    ["+05:30", "+05:30"],
    ["+0530", "+05:30"],
    ["utc-8", "-08:"],
    ["gmt+10", "+10:"],
    ["+5:", "+05:"],
    ["+5:3", "+05:3"],
    ["-", "-"],
  ])("reads %s as %s", (query, expected) => {
    expect(canonicalOffsetQuery(query)).toBe(expected);
  });

  it.each(["pst", "8", "kolkata", "+x"])("leaves %s alone", (query) => {
    expect(canonicalOffsetQuery(query)).toBeNull();
  });
});

describe("parseQuery", () => {
  it("folds case and accents and splits on whitespace", () => {
    expect(parseQuery("  São   Paulo ")).toEqual(["sao", "paulo"]);
  });

  it("reads the true minus sign as a hyphen", () => {
    expect(parseQuery("UTC−8")).toEqual(["-08:"]);
  });
});

describe("matchesTokens", () => {
  const haystack = searchText([
    "Port-au-Prince",
    "America/Port-au-Prince",
    "-05:00",
  ]);

  it("matches the start of any word", () => {
    expect(matchesTokens(haystack, ["prince"])).toBe(true);
    expect(matchesTokens(haystack, ["port", "au"])).toBe(true);
  });

  it("does not match the middle of a word", () => {
    expect(matchesTokens(haystack, ["ince"])).toBe(false);
    expect(matchesTokens(searchText(["Boa Vista"]), ["ist"])).toBe(false);
  });

  it("matches an offset by its sign", () => {
    expect(matchesTokens(haystack, parseQuery("-5"))).toBe(true);
    expect(matchesTokens(haystack, parseQuery("+5"))).toBe(false);
  });

  it("needs every token", () => {
    expect(matchesTokens(haystack, ["port", "tokyo"])).toBe(false);
  });
});

describe("foldText", () => {
  it("drops accents, which Arabic and Hebrew marks are too", () => {
    expect(foldText("Curaçao")).toBe("curacao");
    expect(foldText("שָׁלוֹם")).toBe("שלום");
  });
});

describe("createSearchFilter", () => {
  it("keeps everything for an empty query without preparing", () => {
    const prepare = vi.fn();
    const filter = createSearchFilter(prepare);

    expect(filter({ search: searchText(["a"]) }, "")).toBe(true);
    expect(filter({ search: searchText(["a"]) }, "   ")).toBe(true);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("prepares once per query, not once per item", () => {
    const prepare = vi.fn();
    const filter = createSearchFilter(prepare);
    const items = [searchText(["Paris"]), searchText(["Tokyo"])].map(
      (search) => ({ search }),
    );

    expect(items.filter((item) => filter(item, "par"))).toHaveLength(1);
    expect(prepare).toHaveBeenCalledTimes(1);
    filter(items[0], "tok");
    expect(prepare).toHaveBeenCalledTimes(2);
  });
});
