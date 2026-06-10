import { fuzzyMatch, highlightSegments } from "../../src/utils/fuzzyMatch.js";

describe("fuzzyMatch", () => {
  test("empty query matches with no highlighted indices", () => {
    expect(fuzzyMatch("Databases for TestSQL", "")).toEqual({
      matched: true,
      score: 0,
      indices: [],
    });
  });

  test("highlights a contiguous prefix substring", () => {
    const { matched, indices } = fuzzyMatch("Databases for TestSQL", "Data");
    expect(matched).toBe(true);
    expect(indices).toEqual([0, 1, 2, 3]);
  });

  test("is case-insensitive", () => {
    const { matched, indices } = fuzzyMatch("Data Store for Memcache", "data");
    expect(matched).toBe(true);
    expect(indices).toEqual([0, 1, 2, 3]);
  });

  test("highlights a mid-string substring as one contiguous run", () => {
    // The 'd' in "Hazard" must not steal the highlight from the word "Data".
    const { matched, indices } = fuzzyMatch(
      "HazardHub Property Risk Data API",
      "Data",
    );
    expect(matched).toBe(true);
    expect(indices).toEqual([24, 25, 26, 27]);
    expect(
      indices.map((i) => "HazardHub Property Risk Data API"[i]).join(""),
    ).toBe("Data");
  });

  test("prefers a word-boundary occurrence over an earlier mid-word one", () => {
    const text = "Metadata Data Plans";
    const { indices } = fuzzyMatch(text, "Data");
    expect(indices.map((i) => text[i]).join("")).toBe("Data");
    expect(indices[0]).toBe(text.indexOf("Data ", 1));
  });

  test("falls back to subsequence matching", () => {
    const { matched, indices } = fuzzyMatch("Data Store for Memcache", "dsm");
    expect(matched).toBe(true);
    expect(indices.map((i) => "Data Store for Memcache"[i]).join("")).toBe(
      "DSM",
    );
  });

  test("returns no match when characters are out of order", () => {
    expect(fuzzyMatch("Data", "tad").matched).toBe(false);
  });

  test("returns no match when query is longer than the text", () => {
    expect(fuzzyMatch("Data", "Database").matched).toBe(false);
  });

  test("ranks a prefix match above a mid-word match", () => {
    const prefix = fuzzyMatch("Data Plans", "Data").score;
    const midWord = fuzzyMatch("My Big Database", "Data").score;
    expect(prefix).toBeGreaterThan(midWord);
  });

  test("ranks a contiguous substring above a scattered subsequence", () => {
    const substring = fuzzyMatch("Data Plans", "Data").score;
    const scattered = fuzzyMatch("Drag And Tap Application", "Data").score;
    expect(substring).toBeGreaterThan(scattered);
  });

  describe("options", () => {
    test("score is normalized between 0 and 1", () => {
      for (const [text, query] of [
        ["Data Plans", "Data"],
        ["My Data", "Data"],
        ["Drag And Tap Application", "Data"],
      ] as const) {
        const { score } = fuzzyMatch(text, query);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    test("threshold filters out weaker matches", () => {
      // "dt" is a subsequence of "Data Table" but not a substring.
      expect(fuzzyMatch("Data Table", "dt").matched).toBe(true);
      // 0.5 requires a contiguous substring, so the subsequence is dropped.
      expect(fuzzyMatch("Data Table", "dt", { threshold: 0.5 }).matched).toBe(
        false,
      );
      expect(fuzzyMatch("Data Table", "Data", { threshold: 0.5 }).matched).toBe(
        true,
      );
    });

    test("a high threshold requires a prefix", () => {
      // Word-boundary match scores below 0.9.
      expect(fuzzyMatch("My Data", "Data", { threshold: 0.9 }).matched).toBe(
        false,
      );
      // Prefix match scores at/above 0.9.
      expect(fuzzyMatch("Data Plans", "Data", { threshold: 0.9 }).matched).toBe(
        true,
      );
    });

    test("caseSensitive only matches the exact case", () => {
      expect(fuzzyMatch("Data Store", "data").matched).toBe(true);
      expect(
        fuzzyMatch("Data Store", "data", { caseSensitive: true }).matched,
      ).toBe(false);
      expect(
        fuzzyMatch("Data Store", "Data", { caseSensitive: true }).indices,
      ).toEqual([0, 1, 2, 3]);
    });
  });
});

describe("highlightSegments", () => {
  test("returns a single unmatched segment when there are no indices", () => {
    expect(highlightSegments("Databases", [])).toEqual([
      { text: "Databases", match: false },
    ]);
  });

  test("returns an empty array for empty text", () => {
    expect(highlightSegments("", [])).toEqual([]);
  });

  test("splits a prefix match into matched then unmatched runs", () => {
    expect(highlightSegments("Databases", [0, 1, 2, 3])).toEqual([
      { text: "Data", match: true },
      { text: "bases", match: false },
    ]);
  });

  test("splits a mid-string match into three runs", () => {
    expect(highlightSegments("AT&T IoT Data Plans", [9, 10, 11, 12])).toEqual([
      { text: "AT&T IoT ", match: false },
      { text: "Data", match: true },
      { text: " Plans", match: false },
    ]);
  });

  test("recombines to the original text", () => {
    const text = "Data Store for Memcache";
    const { indices } = fuzzyMatch(text, "store");
    expect(
      highlightSegments(text, indices)
        .map((segment) => segment.text)
        .join(""),
    ).toBe(text);
  });
});
