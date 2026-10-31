// @vitest-environment node
import {
  createMatcher,
  createSearchIndex,
  lineParts,
  type LogMatcher,
  MAX_LINKIFY_LENGTH,
  MAX_MATCHES_PER_LINE,
} from "../../src/utils/log-search.js";

const ESC = "\u001b";

function matcher(options: Parameters<typeof createMatcher>[0]): LogMatcher {
  const result = createMatcher(options);
  assert(result !== null && result !== "invalid");
  return result;
}

describe("createMatcher", () => {
  it("is null for an empty query", () => {
    expect(createMatcher({ query: "" })).toBeNull();
  });

  it("matches literally and ignores case by default", () => {
    expect(matcher({ query: "a.b" }).ranges("A.B axb a.b")).toEqual([
      [0, 3],
      [8, 11],
    ]);
  });

  it("can match case", () => {
    expect(
      matcher({ query: "Err", caseSensitive: true }).ranges("err Err"),
    ).toEqual([[4, 7]]);
  });

  it("reads a regular expression", () => {
    expect(
      matcher({ query: "\\d+ms", regex: true }).ranges("took 12ms, then 7ms"),
    ).toEqual([
      [5, 9],
      [16, 19],
    ]);
  });

  it("reports a regular expression that does not parse", () => {
    expect(createMatcher({ query: "(", regex: true })).toBe("invalid");
  });

  it("skips empty matches", () => {
    expect(matcher({ query: "x*", regex: true }).ranges("axxb")).toEqual([
      [1, 3],
    ]);
  });

  it("caps the matches kept in one line", () => {
    const ranges = matcher({ query: "a" }).ranges("a".repeat(5000));
    expect(ranges).toHaveLength(MAX_MATCHES_PER_LINE);
  });
});

describe("createSearchIndex", () => {
  const rows = [
    { id: 10, plain: "boom" },
    { id: 11, plain: "fine" },
    { id: 12, plain: "boom boom" },
    { id: 14, plain: "boom" },
  ];

  function index() {
    const search = createSearchIndex();
    search.reset(matcher({ query: "boom" }), rows);
    return search;
  }

  it("counts every occurrence", () => {
    expect(index().total).toBe(4);
  });

  it("finds the line and occurrence a match number points at", () => {
    const search = index();

    expect([0, 1, 2, 3].map((n) => search.locate(n))).toEqual([
      { id: 10, occurrence: 0 },
      { id: 12, occurrence: 0 },
      { id: 12, occurrence: 1 },
      { id: 14, occurrence: 0 },
    ]);
    expect(search.locate(4)).toBeNull();
    expect(search.locate(-1)).toBeNull();
  });

  it("numbers a match from its line and occurrence", () => {
    const search = index();

    expect(search.position(12, 1)).toBe(2);
    expect(search.position(14, 0)).toBe(3);
  });

  it("starts from the first match at or after a line", () => {
    const search = index();

    expect(search.firstFrom(11)).toBe(1);
    expect(search.firstFrom(13)).toBe(3);
    expect(search.firstFrom(99)).toBe(3);
  });

  it("adds the matches of new lines", () => {
    const search = index();
    search.append([
      { id: 15, plain: "nothing" },
      { id: 16, plain: "BOOM" },
    ]);

    expect(search.total).toBe(5);
    expect(search.locate(4)).toEqual({ id: 16, occurrence: 0 });
  });

  it("forgets the matches of lines that were dropped", () => {
    const search = index();
    search.trim(12);

    expect(search.total).toBe(3);
    expect(search.locate(0)).toEqual({ id: 12, occurrence: 0 });
  });

  it("matches nothing without a query", () => {
    const search = createSearchIndex();
    search.reset(null, rows);

    expect(search.total).toBe(0);
    expect(search.locate(0)).toBeNull();
  });
});

describe("lineParts", () => {
  it("returns a plain line as one part", () => {
    expect(lineParts({ text: "hello" })).toEqual([
      { text: "hello", style: null, mark: 0 },
    ]);
  });

  it("splits at color changes", () => {
    expect(lineParts({ text: `a${ESC}[31mb${ESC}[0mc` })).toEqual([
      { text: "a", style: null, mark: 0 },
      { text: "b", style: { fg: 1 }, mark: 0 },
      { text: "c", style: null, mark: 0 },
    ]);
  });

  it("links a URL and leaves the rest as text", () => {
    expect(
      lineParts({ text: "see https://example.com/a, ok" }).map(
        ({ text, href }) => [text, href],
      ),
    ).toEqual([
      ["see ", undefined],
      ["https://example.com/a", "https://example.com/a"],
      [", ok", undefined],
    ]);
  });

  it("leaves a URL as text when links are off, or the line is too long to search", () => {
    const text = "https://example.com";
    expect(lineParts({ text }, { links: false })).toHaveLength(1);
    expect(lineParts({ text }, { links: false })[0].href).toBeUndefined();

    const long = `${"x".repeat(MAX_LINKIFY_LENGTH)} ${text}`;
    expect(lineParts({ text: long }).some((part) => part.href)).toBe(false);
  });

  it("marks matches, and the current one apart", () => {
    expect(
      lineParts(
        { text: "ab ab" },
        {
          ranges: [
            [0, 2],
            [3, 5],
          ],
          current: 1,
        },
      ),
    ).toEqual([
      { text: "ab", style: null, mark: 1 },
      { text: " ", style: null, mark: 0 },
      { text: "ab", style: null, mark: 2 },
    ]);
  });

  it("measures matches in the text without escape sequences", () => {
    const parts = lineParts(
      { text: `a${ESC}[31mbc${ESC}[0mdef` },
      { ranges: [[1, 4]] },
    );

    expect(
      parts.map(({ text, mark, style }) => [text, mark, style?.fg]),
    ).toEqual([
      ["a", 0, undefined],
      ["bc", 1, 1],
      ["d", 1, undefined],
      ["ef", 0, undefined],
    ]);
  });

  it("carries a match across a link and the text around it", () => {
    const parts = lineParts(
      { text: "go https://x.io now" },
      { ranges: [[1, 17]] },
    );

    expect(
      parts.map(({ text, mark, href }) => [text, mark, Boolean(href)]),
    ).toEqual([
      ["g", 0, false],
      ["o ", 1, false],
      ["https://x.io", 1, true],
      [" n", 1, false],
      ["ow", 0, false],
    ]);
  });
});
