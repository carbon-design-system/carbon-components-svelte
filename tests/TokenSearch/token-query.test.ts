// @vitest-environment node
import {
  formatQuery,
  formatValue,
  parseQuery,
  resolveDate,
  tokenize,
  type TokenKey,
  withoutPositions,
} from "../../src/TokenSearch/token-query.js";

const keys: TokenKey[] = [
  { key: "is", type: "enum", values: ["open", "closed", "draft"] },
  {
    key: "label",
    type: "enum",
    values: [{ value: "bug" }, { value: "ui" }, { value: "wontfix" }],
  },
  { key: "author", type: "user" },
  { key: "created", type: "date" },
  { key: "comments", type: "number" },
  { key: "title", type: "text" },
];

/** A repeatable stream of numbers in [0, 1). */
function lcg(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Tuesday, 3 November 2026.
const now = new Date(2026, 10, 3);
const parse = (text: string) => parseQuery(text, { keys, now });

describe("parseQuery", () => {
  it("reads the example query", () => {
    const query = parse(
      'is:open label:bug author:@me -label:wontfix created:>2026-01-01 "exact phrase" ship',
    );
    expect(
      query.filters.map(({ key, op, values, negated }) => ({
        key,
        op,
        values,
        negated,
      })),
    ).toEqual([
      { key: "is", op: "eq", values: ["open"], negated: false },
      { key: "label", op: "eq", values: ["bug"], negated: false },
      { key: "author", op: "eq", values: ["@me"], negated: false },
      { key: "label", op: "eq", values: ["wontfix"], negated: true },
      { key: "created", op: "gt", values: ["2026-01-01"], negated: false },
    ]);
    expect(query.terms.map((t) => [t.text, t.phrase])).toEqual([
      ["exact phrase", true],
      ["ship", false],
    ]);
    expect(query.text).toBe("exact phrase ship");
    expect(query.errors).toEqual([]);
  });

  it("splits a comma list and keeps quoted items whole", () => {
    const [filter] = parse('label:bug,"good first issue",ui').filters;
    expect(filter.values).toEqual(["bug", "good first issue", "ui"]);
  });

  it("unescapes quotes and backslashes", () => {
    const [filter] = parse('title:"say \\"hi\\" \\\\ now"').filters;
    expect(filter.values).toEqual(['say "hi" \\ now']);
  });

  it("reads comparisons and ranges, open ended too", () => {
    const op = (text: string) => {
      const [f] = parse(text).filters;
      return [f.op, f.values];
    };
    expect(op("comments:>=5")).toEqual(["gte", ["5"]]);
    expect(op("comments:<5")).toEqual(["lt", ["5"]]);
    expect(op("comments:<=5")).toEqual(["lte", ["5"]]);
    expect(op("comments:3..10")).toEqual(["between", ["3", "10"]]);
    expect(op("comments:3..")).toEqual(["between", ["3", ""]]);
    expect(op("comments:..10")).toEqual(["between", ["", "10"]]);
    expect(op("created:2026-01-01..2026-02-01")).toEqual([
      "between",
      ["2026-01-01", "2026-02-01"],
    ]);
  });

  it("resolves date shortcuts against now", () => {
    expect(parse("created:@today").filters[0].values).toEqual(["2026-11-03"]);
    expect(parse("created:>=@today-7d").filters[0].values).toEqual([
      "2026-10-27",
    ]);
    expect(parse("created:@yesterday..@today").filters[0].values).toEqual([
      "2026-11-02",
      "2026-11-03",
    ]);
    expect(resolveDate("@today-1m", now)).toBe("2026-10-03");
    expect(resolveDate("@today+2w", now)).toBe("2026-11-17");
    expect(resolveDate("2026-02-30", now)).toBeNull();
  });

  it("does not read a comparison from a quoted value", () => {
    const [filter] = parse('title:">x"').filters;
    expect(filter.op).toBe("eq");
    expect(filter.values).toEqual([">x"]);
    expect(parse('title:">x"').errors).toEqual([]);
  });

  it("takes .. as part of a text value but flags a comparison on text", () => {
    expect(parse("title:v1..v2").errors).toEqual([]);
    expect(parse("title:v1..v2").filters[0].values).toEqual(["v1..v2"]);
    expect(parse("title:>x").errors.map((e) => e.code)).toEqual([
      "invalid-operator",
    ]);
  });

  it("marks problems instead of throwing", () => {
    const codes = (text: string) => parse(text).errors.map((e) => e.code);
    expect(codes("nope:1")).toEqual(["unknown-key"]);
    expect(codes("is:merged")).toEqual(["invalid-value"]);
    expect(codes("comments:abc")).toEqual(["invalid-value"]);
    expect(codes("created:2026-13-01")).toEqual(["invalid-value"]);
    expect(codes("label:")).toEqual(["missing-value"]);
    expect(codes("comments:>")).toEqual(["missing-value"]);
    expect(codes('title:"open')).toEqual(["unterminated-quote"]);
    expect(codes('"open')).toEqual(["unterminated-quote"]);
  });

  it("gives the position of an error", () => {
    const [error] = parse("is:open nope:1").errors;
    expect([error.start, error.end]).toEqual([8, 12]);
  });

  it("matches keys and enum values in any case, and writes the schema's", () => {
    const [filter] = parse("IS:Open").filters;
    expect([filter.key, filter.values]).toEqual(["is", ["open"]]);
  });

  it("accepts any key without a schema", () => {
    const query = parseQuery("whatever:1 x", { now });
    expect(query.errors).toEqual([]);
    expect(query.filters[0].key).toBe("whatever");
  });

  it("leaves URLs, times and prose with colons as text", () => {
    const query = parse("see http://example.com at 10:30 now");
    expect(query.filters).toEqual([]);
    expect(query.text).toBe("see http://example.com at 10:30 now");
  });

  it("reads a negated word and keeps a lone minus as text", () => {
    const query = parse("-draft - -1");
    expect(query.terms.map((t) => [t.text, t.negated])).toEqual([
      ["draft", true],
      ["-", false],
      ["1", true],
    ]);
    expect(query.text).toBe("-");
  });

  it("reads Hebrew free text beside a qualifier", () => {
    const query = parse("שלום עולם is:open");
    expect(query.text).toBe("שלום עולם");
    expect(query.filters).toHaveLength(1);
  });
});

describe("tokenize", () => {
  it("covers every non-space character once, for any input", () => {
    const random = lcg(7);
    const alphabet = [
      '"',
      "\\",
      ":",
      ",",
      "-",
      ".",
      "<",
      ">",
      "=",
      " ",
      "a",
      "b",
      "é",
      "ש",
      "1",
    ];
    for (let run = 0; run < 3000; run++) {
      let text = "";
      for (let i = 0, n = Math.floor(random() * 24); i < n; i++) {
        text += alphabet[Math.floor(random() * alphabet.length)];
      }
      const tokens = tokenize(text);
      const covered = new Array(text.length).fill(false);
      let last = 0;
      for (const token of tokens) {
        expect(token.start).toBeGreaterThanOrEqual(last);
        expect(token.end).toBeGreaterThan(token.start);
        for (let i = token.start; i < token.end; i++) covered[i] = true;
        last = token.end;
      }
      for (let i = 0; i < text.length; i++) {
        expect(covered[i] || /\s/.test(text[i])).toBe(true);
      }
      expect(() => parseQuery(text, { keys, now })).not.toThrow();
    }
  });
});

describe("formatQuery", () => {
  it("writes the canonical form of a query", () => {
    expect(
      formatQuery(
        parse(
          '  Is:Open   -label:wontfix\tlabel:bug,ui "a  b" created:>=@today-7d',
        ),
      ),
    ).toBe('is:open -label:wontfix label:bug,ui "a  b" created:>=2026-10-27');
  });

  it("quotes what would otherwise read as syntax", () => {
    expect(formatValue("two words")).toBe('"two words"');
    expect(formatValue("a,b")).toBe('"a,b"');
    expect(formatValue('say "x"')).toBe('"say \\"x\\""');
    expect(formatValue(">5")).toBe('">5"');
    expect(formatValue("a..b")).toBe('"a..b"');
    expect(formatValue("")).toBe('""');
    expect(formatValue("plain")).toBe("plain");
  });

  it("writes a hand-built query, filters first", () => {
    expect(
      formatQuery({
        filters: [
          {
            key: "label",
            op: "eq",
            values: ["good first issue", "ui"],
            negated: true,
          },
        ],
        terms: [{ text: "key:value", phrase: false, negated: false }],
      }),
    ).toBe('-label:"good first issue",ui "key:value"');
  });

  it("parses back to the same query", () => {
    const sources = [
      'is:open label:bug author:@me -label:wontfix created:>2026-01-01 "exact phrase"',
      "label:bug,ui comments:3..10 created:..@today-7d",
      'title:"a, b" -title:">x" שלום',
      "comments:>=5 -comments:..2 -is:draft,closed",
      "plain words only -excluded",
      "",
    ];
    for (const source of sources) {
      const query = parse(source);
      const again = parse(formatQuery(query));
      expect(withoutPositions(again)).toEqual(withoutPositions(query));
      expect(formatQuery(again)).toBe(formatQuery(query));
    }
  });

  it("is stable for any text: writing a parse and parsing it again changes nothing", () => {
    const random = lcg(11);
    const words = [
      "is:open",
      "-is:closed",
      "label:bug,ui",
      'label:"x y"',
      "created:>=@today-7d",
      "comments:3..9",
      "comments:..4",
      "author:@me",
      '"a phrase"',
      "word",
      "-no",
      "title:a..b",
      'title:">x"',
      "http://x.y",
      "10:30",
      "nope:1",
      "is:",
      '"open',
      "label:bug,",
      "שלום",
    ];
    for (let run = 0; run < 1500; run++) {
      const text = Array.from(
        { length: Math.floor(random() * 6) },
        () => words[Math.floor(random() * words.length)],
      ).join(" ");
      const once = formatQuery(parse(text));
      const twice = formatQuery(parse(once));
      expect(twice).toBe(once);
      const first = parse(text);
      if (first.errors.length === 0) {
        expect(withoutPositions(parse(once))).toEqual(withoutPositions(first));
      }
    }
  });
});
