// @vitest-environment node
import type { TokenKey } from "../../src/TokenSearch/token-query.js";
import {
  buildInsertion,
  filterSuggestions,
  keyItems,
  recentItems,
  sourceItems,
  suggestContext,
  valueItems,
} from "../../src/TokenSearch/token-suggest.js";

const keys: TokenKey[] = [
  { key: "is", label: "State", type: "enum", values: ["open", "closed"] },
  {
    key: "label",
    type: "enum",
    values: [
      { value: "bug", description: "Something is broken" },
      { value: "ui" },
      { value: "good first issue" },
    ],
  },
  { key: "author", type: "user" },
  { key: "created", type: "date" },
  { key: "comments", type: "number" },
];

/** `|` marks the caret. */
function at(marked: string) {
  const caret = marked.indexOf("|");
  const text = marked.slice(0, caret) + marked.slice(caret + 1);
  return { text, caret, context: suggestContext(text, caret, keys) };
}

describe("suggestContext", () => {
  it("is on a key in an empty word", () => {
    for (const marked of ["|", "is:open |", "|is:open", "a:b | c"]) {
      const { context } = at(marked);
      expect(context?.kind).toBe("key");
      expect(context?.prefix).toBe("");
    }
  });

  it("is on a key in the start of a word, and replaces the whole word", () => {
    const { context } = at("is:open la|bel");
    expect(context).toMatchObject({
      kind: "key",
      prefix: "la",
      start: 8,
      end: 13,
      colon: false,
    });
  });

  it("is on a key before the colon of a qualifier", () => {
    const { context } = at("la|bel:bug");
    expect(context).toMatchObject({
      kind: "key",
      prefix: "la",
      colon: true,
      start: 0,
      end: 5,
    });
  });

  it("leaves the minus out of the key", () => {
    const { context } = at("-la|");
    expect(context).toMatchObject({
      kind: "key",
      prefix: "la",
      negated: true,
      start: 1,
    });
  });

  it("is on a value after the colon", () => {
    const { context } = at("label:b|");
    expect(context).toMatchObject({
      kind: "value",
      key: "label",
      prefix: "b",
      start: 6,
      end: 7,
    });
    expect(context?.def?.key).toBe("label");
  });

  it("is on the next value after a comma, and knows what is taken", () => {
    const { context } = at("label:bug,|");
    expect(context).toMatchObject({
      kind: "value",
      prefix: "",
      taken: ["bug"],
    });
    const mid = at("label:bug,u|i,x").context;
    expect(mid).toMatchObject({ prefix: "u", taken: ["bug", "x"] });
  });

  it("reads the operand after a comparison or a range", () => {
    expect(at("created:>=@to|").context).toMatchObject({
      prefix: "@to",
      operator: true,
      start: 10,
      pieceStart: 8,
    });
    expect(at("created:2026-01-01..@t|").context).toMatchObject({
      prefix: "@t",
      start: 20,
    });
    expect(at("created:2026|..@today").context).toMatchObject({
      prefix: "2026",
      end: 12,
    });
  });

  it("reads inside quotes without the quote", () => {
    expect(at('label:"good f|irst').context).toMatchObject({
      kind: "value",
      prefix: "good f",
    });
  });

  it("offers nothing inside a phrase or before a minus", () => {
    expect(at('"some te|xt"').context).toBeNull();
    expect(at("|-label:bug").context).toBeNull();
  });
});

describe("rows", () => {
  it("ranks keys by key and label, prefix first", () => {
    expect(keyItems(keys, "").map((row) => row.value)).toEqual(
      keys.map((def) => def.key),
    );
    expect(keyItems(keys, "st").map((row) => row.value)).toEqual(["is"]);
    expect(keyItems(keys, "c").map((row) => row.value)).toEqual([
      "created",
      "comments",
    ]);
    expect(keyItems(keys, "zz")).toEqual([]);
    expect(keyItems(keys, "is")[0]).toMatchObject({
      kind: "key",
      text: "State",
      value: "is",
    });
  });

  it("offers a key's values, minus those already in the list, and matches the description", () => {
    const label = keys[1];
    expect(valueItems(label, "").map((row) => row.value)).toEqual([
      "bug",
      "ui",
      "good first issue",
    ]);
    expect(
      valueItems(label, "", { taken: ["BUG"] }).map((row) => row.value),
    ).toEqual(["ui", "good first issue"]);
    expect(valueItems(label, "broken").map((row) => row.value)).toEqual([
      "bug",
    ]);
  });

  it("offers date shortcuts for a date key, and only operands after an operator", () => {
    const created = keys[3];
    expect(valueItems(created, "").map((row) => row.text)).toContain(
      "Last 7 days",
    );
    expect(
      valueItems(created, "", { operator: true }).map((row) => row.text),
    ).toEqual(["Today", "Yesterday"]);
    expect(valueItems(created, "yes").map((row) => row.text)).toEqual([
      "Yesterday",
    ]);
  });

  it("offers nothing for a number", () => {
    expect(valueItems(keys[4], "")).toEqual([]);
  });

  it("folds accents and keeps the order of ties", () => {
    const people = [{ text: "Álvaro" }, { text: "José" }, { text: "Joe" }];
    expect(filterSuggestions(people, "jose").map((p) => p.text)).toEqual([
      "José",
    ]);
    expect(filterSuggestions(people, "jo").map((p) => p.text)).toEqual([
      "José",
      "Joe",
    ]);
  });

  it("shapes a source's answer", () => {
    expect(
      sourceItems(["a", { value: "b", label: "B" }], { taken: ["a"] }),
    ).toEqual([{ kind: "value", text: "B", value: "b", secondary: undefined }]);
  });

  it("filters recent queries by what is typed", () => {
    const recent = ["is:open label:bug", "author:@me", "is:closed"];
    expect(recentItems(recent, "").map((row) => row.text)).toEqual(recent);
    expect(recentItems(recent, "IS:").map((row) => row.text)).toEqual([
      "is:open label:bug",
      "is:closed",
    ]);
  });
});

describe("buildInsertion", () => {
  function choose(
    marked: string,
    pick: (rows: ReturnType<typeof keyItems>) => number | string,
  ) {
    const { text, context } = at(marked);
    if (!context) throw new Error("no context");
    const rows =
      context.kind === "key"
        ? keyItems(keys, context.prefix)
        : valueItems(context.def as TokenKey, context.prefix, context);
    const wanted = pick(rows);
    const item =
      typeof wanted === "number"
        ? rows[wanted]
        : rows.find((row) => row.value === wanted);
    if (!item) throw new Error("no row");
    const { start, end, insert, caret, reopen } = buildInsertion(
      text,
      context,
      item,
    );
    return {
      text: text.slice(0, start) + insert + text.slice(end),
      caret,
      reopen,
    };
  }

  it("writes a key and its colon, and asks for the values", () => {
    expect(choose("is:open la|", () => "label")).toEqual({
      text: "is:open label:",
      caret: 14,
      reopen: true,
    });
  });

  it("does not write a second colon", () => {
    expect(choose("la|bel:bug", () => "label").text).toBe("label:bug");
  });

  it("writes a value and a space, quoting when needed", () => {
    expect(choose("label:b|", () => "bug")).toMatchObject({
      text: "label:bug ",
      caret: 10,
      reopen: false,
    });
    expect(choose("label:good|", () => "good first issue").text).toBe(
      'label:"good first issue" ',
    );
  });

  it("does not add a space before a comma or a space", () => {
    expect(choose("label:b|,ui", () => "bug").text).toBe("label:bug,ui");
    expect(choose("label:b| x", () => "bug").text).toBe("label:bug x");
  });

  it("writes a date shortcut over the whole piece, operator included", () => {
    expect(choose("created:>|", () => "@today").text).toBe("created:>@today ");
    expect(choose("created:|", () => ">=@today-7d").text).toBe(
      "created:>=@today-7d ",
    );
  });

  it("replaces the whole text for a recent query", () => {
    const { text } = at("ab|");
    expect(
      buildInsertion(
        text,
        { kind: "key", start: 0, end: 2, prefix: "ab", negated: false },
        { kind: "recent", text: "x", value: "is:open" },
      ),
    ).toMatchObject({ start: 0, end: 2, insert: "is:open", caret: 7 });
  });
});
