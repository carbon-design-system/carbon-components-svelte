// @vitest-environment node
import { fuzzyMatch } from "../../src/utils/fuzzy-match.js";
import {
  createFuzzyTextMatcher,
  createTextMatcher,
  foldText,
  fuzzyMatchText,
  indicesToRanges,
  matchText,
  mergeRanges,
  normalizeRanges,
  splitByRanges,
  type TextMatchOptions,
} from "../../src/utils/text-match.js";

/** What a match highlights, as the text it covers. */
function matched(
  text: string,
  query: string | string[],
  options?: TextMatchOptions,
) {
  return matchText(text, query, options).map((r) => text.slice(r.start, r.end));
}

type Row = [
  name: string,
  text: string,
  query: string | string[],
  expected: string[],
  options?: TextMatchOptions,
];

const NFD_E_ACUTE = "é";

describe("matchText: what folds together", () => {
  const rows: Row[] = [
    // Case.
    ["case", "Hello World", "world", ["World"]],
    ["upper query", "hello world", "WORLD", ["world"]],
    // Diacritics.
    ["accent in text", "Café au lait", "cafe", ["Café"]],
    ["accent in query", "cafe", "café", ["cafe"]],
    ["all accented", "Ünïcödé", "unicode", ["Ünïcödé"]],
    [
      "decomposed text, plain query",
      `caf${NFD_E_ACUTE} x`,
      "cafe",
      [`caf${NFD_E_ACUTE}`],
    ],
    [
      "decomposed text, composed query",
      `caf${NFD_E_ACUTE}`,
      "café",
      [`caf${NFD_E_ACUTE}`],
    ],
    ["composed text, decomposed query", "café", `caf${NFD_E_ACUTE}`, ["café"]],
    ["stacked Vietnamese marks", "Việt Nam", "viet", ["Việt"]],
    ["Vietnamese đ", "Đà Nẵng", "da nang", ["Đà", "Nẵng"]],
    ["Polish ł", "Łódź", "lodz", ["Łódź"]],
    ["Danish ø and æ", "Ærø Ørsted", "aero orsted", ["Ærø", "Ørsted"]],
    ["German umlaut", "Müller", "muller", ["Müller"]],
    ["Spanish ñ", "Año", "ano", ["Año"]],
    ["cedilla", "Façade", "facade", ["Façade"]],
    // ß and friends.
    ["ß in text, ss query", "Straße", "strasse", ["Straße"]],
    ["ss in text, ß query", "Strasse", "ß", ["ss"]],
    ["upper STRASSE, ß query", "STRASSE", "straße", ["STRASSE"]],
    ["half of ß", "Maße", "mas", ["Maß"]],
    ["ligature æ", "Cæsar", "caesar", ["Cæsar"]],
    ["ligature œ", "cœur", "coeur", ["cœur"]],
    ["ligature ﬁ", "ﬁle", "fil", ["ﬁl"]],
    // Turkish.
    ["İ in text", "İstanbul", "istanbul", ["İstanbul"]],
    ["İ and a prefix after it", "İstanbul", "stan", ["stan"]],
    ["dotless ı in query", "ISTANBUL", "ıstanbul", ["ISTANBUL"]],
    ["ı in text", "Işık", "isik", ["Işık"]],
    ["I in text, ı query", "Iron", "ıron", ["Iron"]],
    // Greek.
    ["Greek tonos", "ΣΊΣΥΦΟΣ", "σισυφοσ", ["ΣΊΣΥΦΟΣ"]],
    ["final sigma", "ΟΔΥΣΣΕΥΣ", "οδυσσευς", ["ΟΔΥΣΣΕΥΣ"]],
    ["long s", "ſtreet", "street", ["ſtreet"]],
    // Width and compatibility forms.
    ["full-width text", "ＡＢＣ abc", "abc", ["ＡＢＣ", "abc"]],
    ["full-width query", "abc", "ＡＢＣ", ["abc"]],
    ["full-width digits", "Room １２", "12", ["１２"]],
    ["half-width katakana", "ｶﾀｶﾅ", "カタカナ", ["ｶﾀｶﾅ"]],
    ["ideographic space splits", "foo bar", "foo　bar", ["foo", "bar"]],
    ["superscript", "x² y", "x2", ["x²"]],
    ["circled digit", "Step ① done", "step 1", ["Step", "①"]],
    // Hebrew and Arabic.
    ["Hebrew points", "שָׁלוֹם", "שלום", ["שָׁלוֹם"]],
    ["Arabic harakat", "مَرْحَبًا", "مرحبا", ["مَرْحَبًا"]],
    ["Arabic hamza on alef", "أحمد", "احمد", ["أحمد"]],
    ["Arabic hamza below alef", "إسلام", "اسلام", ["إسلام"]],
    ["Arabic madda", "آمن", "امن", ["آمن"]],
    ["tatweel", "كتــاب", "كتاب", ["كتــاب"]],
    ["Latin term in Arabic", "نص عربي hello نص", "hel", ["hel"]],
    ["Latin term in Hebrew", "טקסט hello עברית", "HELLO", ["hello"]],
    ["Arabic term in Latin", "see مرحبا here", "مرحبا", ["مرحبا"]],
    // Marks that carry meaning stay.
    ["Devanagari vowel sign is kept", "कि", "की", []],
    ["Devanagari base matches its grapheme", "कि", "क", ["कि"]],
    ["Thai tone mark is kept", "ข่าว", "ข้าว", []],
    // CJK.
    ["CJK substring", "東京都渋谷区", "渋谷", ["渋谷"]],
    ["Hangul", "한국어 텍스트", "텍스트", ["텍스트"]],
    // Graphemes.
    ["emoji", "a😀b", "😀", ["😀"]],
    ["emoji with variation selector", "I ❤️ you", "❤", ["❤️"]],
    ["emoji with skin tone", "👍🏽 ok", "👍", ["👍🏽"]],
    ["ZWJ family from its first member", "x 👨‍👩‍👧 y", "👨", ["👨‍👩‍👧"]],
    ["flag from one indicator", "🇯🇵🇺🇸", "🇯", ["🇯🇵"]],
    // Terms.
    ["two terms, text order", "foo bar baz", "baz foo", ["foo", "baz"]],
    ["repeated term", "foo foo", "foo foo", ["foo", "foo"]],
    ["overlapping terms merge", "abcdef", "abc cde", ["abcde"]],
    ["touching terms merge", "abcd", "ab cd", ["abcd"]],
    ["overlapping occurrences merge", "aaaa", "aa", ["aaaa"]],
    ["term in every word", "a.b (c)", ".", ["."]],
    [
      "array query is not split",
      "in New York city",
      ["new york"],
      ["New York"],
    ],
    ["array of terms", "red green blue", ["blue", "red"], ["red", "blue"]],
    // Empties.
    ["empty query", "text", "", []],
    ["blank query", "text", "   ", []],
    ["empty array", "text", [], []],
    ["empty text", "", "a", []],
    ["query longer than text", "ab", "abc", []],
    ["no match", "abc", "z", []],
  ];

  it.each(rows)("%s", (_name, text, query, expected, options) => {
    expect(matched(text, query, options)).toEqual(expected);
  });
});

describe("matchText: options", () => {
  const rows: Row[] = [
    [
      "caseSensitive keeps case",
      "Foo foo",
      "foo",
      ["foo"],
      { caseSensitive: true },
    ],
    [
      "caseSensitive rejects other case",
      "Foo",
      "foo",
      [],
      { caseSensitive: true },
    ],
    [
      "caseSensitive still folds accents",
      "Café",
      "Cafe",
      ["Café"],
      { caseSensitive: true },
    ],
    [
      "strict diacritics rejects",
      "Café",
      "cafe",
      [],
      { ignoreDiacritics: false },
    ],
    [
      "strict diacritics accepts exact",
      "Café",
      "café",
      ["Café"],
      { ignoreDiacritics: false },
    ],
    [
      "strict diacritics, mixed forms",
      `caf${NFD_E_ACUTE}`,
      "café",
      [`caf${NFD_E_ACUTE}`],
      { ignoreDiacritics: false },
    ],
    [
      "strict diacritics still folds width",
      "ＡＢＣ",
      "abc",
      ["ＡＢＣ"],
      { ignoreDiacritics: false },
    ],
    [
      "strict diacritics keeps ø",
      "Ørsted",
      "orsted",
      [],
      { ignoreDiacritics: false },
    ],
    ["terms all, one missing", "foo bar", "foo zzz", [], { terms: "all" }],
    [
      "terms all, all present",
      "foo bar",
      "foo bar",
      ["foo", "bar"],
      { terms: "all" },
    ],
    ["terms any, one missing", "foo bar", "foo zzz", ["foo"], { terms: "any" }],
    [
      "split false keeps a phrase",
      "foo bar, foo",
      "foo bar",
      ["foo bar"],
      { split: false },
    ],
    ["split false misses a gap", "foo, bar", "foo bar", [], { split: false }],
    [
      "word-start skips mid-word",
      "foobar bar-baz Xbar",
      "bar",
      ["bar"],
      { mode: "word-start" },
    ],
    [
      "word-start after punctuation",
      "(foo) 'bar'",
      "bar",
      ["bar"],
      { mode: "word-start" },
    ],
    [
      "word-start accepts folded letters",
      "Éclair éclat",
      "ec",
      ["Éc", "éc"],
      { mode: "word-start" },
    ],
    [
      "word-start sees past an astral letter",
      "𝒜bar bar",
      "bar",
      ["bar"],
      { mode: "word-start" },
    ],
    ["prefix matches the start", "barfoo", "bar", ["bar"], { mode: "prefix" }],
    ["prefix rejects the middle", "foobar", "bar", [], { mode: "prefix" }],
    ["prefix after folding", "Écrin", "ecr", ["Écr"], { mode: "prefix" }],
    [
      "substring finds the middle",
      "foobar",
      "bar",
      ["bar"],
      { mode: "substring" },
    ],
  ];

  it.each(rows)("%s", (_name, text, query, expected, options) => {
    expect(matched(text, query, options)).toEqual(expected);
  });
});

describe("matchText: ranges", () => {
  it("returns UTF-16 offsets into the original string", () => {
    expect(matchText("İstanbul", "stan")).toEqual([{ start: 1, end: 5 }]);
    expect(matchText("a😀b😀", "b")).toEqual([{ start: 3, end: 4 }]);
  });

  it("returns sorted, disjoint ranges", () => {
    const ranges = matchText("one two one three one", "one three");
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].start).toBeGreaterThanOrEqual(ranges[i - 1].end);
    }
  });

  it("does not mutate a shared result between calls", () => {
    const a = matchText("foo bar", "foo");
    a[0].end = 99;
    expect(matchText("foo bar", "foo")).toEqual([{ start: 0, end: 3 }]);
  });

  it("treats regex characters literally", () => {
    expect(matched("a+b (c) [d] a.b", "a+b")).toEqual(["a+b"]);
    expect(matched("a+b (c) [d] a.b", "(c)")).toEqual(["(c)"]);
    expect(matched("x*y", ".*")).toEqual([]);
  });

  it("accepts null and undefined", () => {
    expect(matchText(undefined as unknown as string, "a")).toEqual([]);
    expect(matchText("a", null)).toEqual([]);
    expect(matchText("a", undefined)).toEqual([]);
  });

  it("gives the same ranges for a reused matcher", () => {
    const match = createTextMatcher("caf");
    expect(match("Café")).toEqual(matchText("Café", "caf"));
    expect(match("no")).toEqual([]);
    expect(match("CAFÉ cafe")).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 8 },
    ]);
  });

  it("returns the same ranges for repeated calls with one query", () => {
    const first = matchText("Café", "cafe");
    expect(matchText("Café", "cafe")).toEqual(first);
    expect(matchText("Café", "cafe", { ignoreDiacritics: false })).toEqual([]);
    expect(matchText("Café", "cafe")).toEqual(first);
  });
});

describe("matchText: invariants over random text", () => {
  // A small alphabet that hits every case above: ASCII, accents, a base letter
  // and a combining mark apart, ß, İ, ı, full-width, Arabic with a mark, an
  // emoji with a joiner and selector, and an astral letter.
  const alphabet = [
    "a",
    "b",
    "e",
    "é",
    "é",
    "i",
    "İ",
    "ı",
    "s",
    "ß",
    "ｓ",
    "ب",
    "بَ",
    "👍",
    "👍🏽",
    "❤️",
    "👨‍👩‍👧",
    "𝒜",
    " ",
    "-",
    "कि",
  ];

  function random(seed: number) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function pick(next: () => number, length: number) {
    let out = "";
    for (let i = 0; i < length; i++) {
      out += alphabet[Math.floor(next() * alphabet.length)];
    }
    return out;
  }

  it("keeps every range sorted, disjoint, in bounds and on a grapheme edge", () => {
    const next = random(7);
    const segmenter = new Intl.Segmenter();
    for (let n = 0; n < 400; n++) {
      const text = pick(next, 1 + Math.floor(next() * 14));
      const query = pick(next, 1 + Math.floor(next() * 3));
      const edges = new Set<number>([text.length]);
      for (const { index } of segmenter.segment(text)) edges.add(index);
      let previousEnd = 0;
      for (const { start, end } of matchText(text, query)) {
        expect(start).toBeGreaterThanOrEqual(previousEnd);
        expect(end).toBeGreaterThan(start);
        expect(end).toBeLessThanOrEqual(text.length);
        expect(
          edges.has(start),
          `start ${start} in ${JSON.stringify(text)}`,
        ).toBe(true);
        expect(edges.has(end), `end ${end} in ${JSON.stringify(text)}`).toBe(
          true,
        );
        previousEnd = end;
      }
    }
  });

  it("finds a slice of the text in the text", () => {
    const next = random(11);
    const segmenter = new Intl.Segmenter();
    for (let n = 0; n < 300; n++) {
      const text = pick(next, 2 + Math.floor(next() * 12));
      const edges = [...segmenter.segment(text)].map((s) => s.index);
      edges.push(text.length);
      const from = edges[Math.floor(next() * (edges.length - 1))];
      const to = edges.find((e) => e > from) as number;
      const slice = text.slice(from, to);
      if (!slice.trim()) continue;
      const ranges = matchText(text, slice.trim(), { split: false });
      expect(
        ranges.length,
        `${JSON.stringify(slice)} in ${JSON.stringify(text)}`,
      ).toBeGreaterThan(0);
    }
  });

  it("is stable under normalizeRanges", () => {
    const next = random(3);
    for (let n = 0; n < 200; n++) {
      const text = pick(next, 1 + Math.floor(next() * 12));
      const ranges = matchText(text, pick(next, 1));
      expect(normalizeRanges(text, ranges)).toEqual(ranges);
    }
  });
});

describe("foldText", () => {
  it.each([
    ["Café", "cafe"],
    ["İSTANBUL", "istanbul"],
    ["Straße", "strasse"],
    ["ＦＵＬＬ", "full"],
    ["ΣΊΣΥΦΟΣ", "σισυφοσ"],
    ["Ørsted", "orsted"],
  ])("folds %s to %s", (input, expected) => {
    expect(foldText(input)).toBe(expected);
  });

  it("keeps case and accents when asked", () => {
    expect(foldText("Café", { caseSensitive: true })).toBe("Cafe");
    expect(foldText("Café", { ignoreDiacritics: false })).toBe("café");
    expect(
      foldText("Café", { caseSensitive: true, ignoreDiacritics: false }),
    ).toBe("Café");
  });

  it("returns an empty string for nothing", () => {
    expect(foldText(undefined as unknown as string)).toBe("");
  });
});

describe("ranges helpers", () => {
  it("mergeRanges sorts, joins overlap and touch, and copies", () => {
    const input = [
      { start: 5, end: 8 },
      { start: 0, end: 2 },
      { start: 2, end: 3 },
      { start: 7, end: 10 },
    ];
    expect(mergeRanges(input)).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 10 },
    ]);
    expect(input[0]).toEqual({ start: 5, end: 8 });
    expect(mergeRanges([])).toEqual([]);
  });

  it("normalizeRanges clamps, drops empties and widens to graphemes", () => {
    expect(
      normalizeRanges("hello", [
        { start: -3, end: 2 },
        { start: 4, end: 99 },
        { start: 3, end: 3 },
        { start: 4, end: 2 },
      ]),
    ).toEqual([
      { start: 0, end: 2 },
      { start: 4, end: 5 },
    ]);
    // A cut through a surrogate pair, a base letter and a mark, a flag.
    expect(normalizeRanges("a😀b", [{ start: 2, end: 3 }])).toEqual([
      { start: 1, end: 3 },
    ]);
    expect(normalizeRanges(`${NFD_E_ACUTE}x`, [{ start: 1, end: 2 }])).toEqual([
      { start: 0, end: 2 },
    ]);
    expect(normalizeRanges("🇯🇵🇺🇸", [{ start: 2, end: 3 }])).toEqual([
      { start: 0, end: 4 },
    ]);
    expect(normalizeRanges("x", null)).toEqual([]);
    expect(normalizeRanges("x", undefined)).toEqual([]);
  });

  it("indicesToRanges joins runs and tolerates unsorted or repeated input", () => {
    expect(indicesToRanges([0, 1, 2, 5, 6, 9])).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 7 },
      { start: 9, end: 10 },
    ]);
    expect(indicesToRanges([5, 1, 2, 2, 0])).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 6 },
    ]);
    expect(indicesToRanges([])).toEqual([]);
    expect(indicesToRanges(undefined)).toEqual([]);
  });

  it("splitByRanges cuts the text into runs that join back to it", () => {
    const text = "one two three";
    const parts = splitByRanges(text, [
      { start: 4, end: 7 },
      { start: 8, end: 13 },
    ]);
    expect(parts).toEqual([
      { text: "one ", match: false },
      { text: "two", match: true },
      { text: " ", match: false },
      { text: "three", match: true },
    ]);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(splitByRanges("", [])).toEqual([]);
    expect(splitByRanges("abc", [])).toEqual([{ text: "abc", match: false }]);
  });
});

describe("fuzzyMatchText", () => {
  function slices(text: string, query: string) {
    return fuzzyMatchText(text, query).ranges.map((r) =>
      text.slice(r.start, r.end),
    );
  }

  it("gives an empty query a free match", () => {
    expect(fuzzyMatchText("anything", "")).toEqual({
      matched: true,
      score: 0,
      ranges: [],
    });
    expect(fuzzyMatchText("anything", "   ").matched).toBe(true);
  });

  it("scores the same tiers as fuzzyMatch for a contiguous match", () => {
    const cases: Array<[string, string]> = [
      ["Databases for TestSQL", "Data"],
      ["data", "data"],
      ["Metadata Data Plans", "Data"],
      ["Metadata", "data"],
      ["Store-data", "data"],
      ["My app", "app"],
    ];
    for (const [text, query] of cases) {
      const old = fuzzyMatch(text, query);
      const next = fuzzyMatchText(text, query);
      expect(next.score, `${text} / ${query}`).toBe(old.score);
      expect(next.matched).toBe(old.matched);
      expect(
        next.ranges.flatMap((r) =>
          Array.from({ length: r.end - r.start }, (_, i) => r.start + i),
        ),
      ).toEqual(old.indices);
    }
  });

  it("falls back to a subsequence, tightened to the closest window", () => {
    expect(slices("Data Store for Memcache", "dsm")).toEqual(["D", "S", "M"]);
    // Greedy forward would take the first "a" and "c" far apart; the backward
    // pass finds "ac" together at the end.
    expect(slices("a x x ac", "ac")).toEqual(["ac"]);
  });

  it("returns no match when the letters are out of order or missing", () => {
    expect(fuzzyMatchText("abc", "cba")).toEqual({
      matched: false,
      score: 0,
      ranges: [],
    });
    expect(fuzzyMatchText("abc", "z").matched).toBe(false);
  });

  it("ranks a prefix over a word start over mid-word over a subsequence", () => {
    const score = (text: string) => fuzzyMatchText(text, "bar").score;
    expect(score("bar")).toBe(1);
    expect(score("bart")).toBe(0.9);
    expect(score("a bar")).toBe(0.7);
    expect(score("abar")).toBe(0.5);
    expect(score("b-a-r")).toBeGreaterThan(0.2 - 1e-9);
    expect(score("b-a-r")).toBeLessThan(0.5);
  });

  it("applies the threshold", () => {
    expect(fuzzyMatchText("abar", "bar", { threshold: 0.7 }).matched).toBe(
      false,
    );
    expect(fuzzyMatchText("a bar", "bar", { threshold: 0.7 }).matched).toBe(
      true,
    );
    expect(fuzzyMatchText("b-a-r", "bar", { threshold: 0.5 }).matched).toBe(
      false,
    );
  });

  it("returns ranges in the original text where lowercasing changes length", () => {
    // `toLowerCase` makes "İ" two units, which shifts every later index.
    const result = fuzzyMatchText("İstanbul", "stan");
    expect(result.ranges).toEqual([{ start: 1, end: 5 }]);
  });

  it("matches an astral character as a subsequence", () => {
    expect(fuzzyMatchText("a😀b😀c", "😀😀").ranges).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 6 },
    ]);
  });

  it("folds diacritics and width", () => {
    expect(slices("Crème Brûlée", "cb")).toEqual(["C", "B"]);
    expect(fuzzyMatchText("ＦＵＬＬ", "ful").ranges).toEqual([
      { start: 0, end: 3 },
    ]);
    expect(
      fuzzyMatchText("Café", "cafe", { ignoreDiacritics: false }).matched,
    ).toBe(false);
  });

  it("reuses one compiled query across texts", () => {
    const match = createFuzzyTextMatcher("ds");
    expect(match("Data Store").matched).toBe(true);
    expect(match("zzz").matched).toBe(false);
    expect(match("Data Store").ranges.length).toBeGreaterThan(0);
  });
});
