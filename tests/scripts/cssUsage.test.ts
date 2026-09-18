import {
  authoredDeclarations,
  bytesOf,
  cascadeWinners,
  createAggregate,
  deadInFixtures,
  foldCandidates,
  inventoryFromRules,
  type MatchedRule,
  neverMatchedRules,
  normalizeContext,
  normalizeSelector,
  recordObservation,
  replayWins,
  summarize,
} from "../../scripts/lib/css-usage";

const rule = (
  context: string,
  selector: string,
  decls: {
    property: string;
    value: string;
    important?: boolean;
    longhands?: string[];
  }[],
): MatchedRule => ({
  context,
  selector,
  declarations: decls.map((d) => ({
    property: d.property,
    value: d.value,
    important: Boolean(d.important),
    longhands: d.longhands ?? [d.property],
  })),
});

describe("authoredDeclarations", () => {
  test("plain longhand", () => {
    expect(
      authoredDeclarations([
        { name: "color", value: "red", text: "color: red" },
      ]),
    ).toEqual([
      {
        property: "color",
        value: "red",
        important: false,
        longhands: ["color"],
      },
    ]);
  });

  test("skips disabled and unparsed entries", () => {
    expect(
      authoredDeclarations([
        { name: "color", value: "red", text: "color: red", disabled: true },
        {
          name: "color",
          value: "bogus",
          text: "color: bogus",
          parsedOk: false,
        },
      ]),
    ).toEqual([]);
  });

  test("skips implicit (text-less) entries", () => {
    expect(
      authoredDeclarations([
        { name: "padding-top", value: "0px", implicit: true },
      ]),
    ).toEqual([]);
  });

  test("expands a shorthand via CDP's own longhandProperties", () => {
    const out = authoredDeclarations([
      {
        name: "padding",
        value: "0",
        text: "padding: 0",
        longhandProperties: [
          { name: "padding-top", value: "0px" },
          { name: "padding-right", value: "0px" },
          { name: "padding-bottom", value: "0px" },
          { name: "padding-left", value: "0px" },
        ],
      },
    ]);
    expect(out).toEqual([
      {
        property: "padding",
        value: "0",
        important: false,
        longhands: [
          "padding-top",
          "padding-right",
          "padding-bottom",
          "padding-left",
        ],
      },
    ]);
  });

  test("falls back to the SHORTHANDS table via sibling implicit entries", () => {
    const out = authoredDeclarations([
      { name: "padding", value: "0", text: "padding: 0" },
      { name: "padding-top", value: "0px", implicit: true },
      { name: "padding-right", value: "0px", implicit: true },
      { name: "padding-bottom", value: "0px", implicit: true },
      { name: "padding-left", value: "0px", implicit: true },
    ]);
    expect(out[0].longhands.sort()).toEqual(
      ["padding-bottom", "padding-left", "padding-right", "padding-top"].sort(),
    );
  });

  test("unresolvable shorthand falls back to its own property name", () => {
    expect(
      authoredDeclarations([
        { name: "padding", value: "0", text: "padding: 0" },
      ]),
    ).toEqual([
      {
        property: "padding",
        value: "0",
        important: false,
        longhands: ["padding"],
      },
    ]);
  });
});

describe("cascadeWinners / replayWins", () => {
  test("later declaration wins for the same property", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ];
    const winners = cascadeWinners(rules);
    expect(winners.get("color")).toEqual([1, 0]);
    expect(replayWins(rules)).toEqual([[false], [true]]);
  });

  test("!important wins regardless of order", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red", important: true }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ];
    expect(replayWins(rules)).toEqual([[true], [false]]);
  });

  test("later !important beats an earlier !important", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red", important: true }]),
      rule("", ".a.b", [{ property: "color", value: "blue", important: true }]),
    ];
    expect(replayWins(rules)).toEqual([[false], [true]]);
  });

  test("a shorthand wins if it wins any one of its longhands", () => {
    const rules = [
      rule("", ".a", [
        {
          property: "padding",
          value: "0",
          longhands: ["padding-top", "padding-left"],
        },
      ]),
      rule("", ".a.b", [
        { property: "padding-top", value: "4px", longhands: ["padding-top"] },
      ]),
    ];
    // padding-left is never overridden, so the shorthand still "wins" it.
    expect(replayWins(rules)).toEqual([[true], [true]]);
  });

  test("independent properties don't interact", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a", [{ property: "top", value: "0" }]),
    ];
    expect(replayWins(rules)).toEqual([[true], [true]]);
  });
});

describe("recordObservation", () => {
  test("counts matches and wins across observations", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
    ]);
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ]);
    const stats = [...agg.declarations.values()];
    const red = stats.find((s) => s.value === "red");
    const blue = stats.find((s) => s.value === "blue");
    expect(agg.observations).toBe(2);
    expect(red).toMatchObject({ matched: 2, won: 1 });
    expect(blue).toMatchObject({ matched: 1, won: 1 });
  });

  test("attributes a loss to the winning rule's label", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("@media (min-width: 42em)", ".a.b", [
        { property: "color", value: "blue" },
      ]),
    ]);
    const red = [...agg.declarations.values()].find((s) => s.value === "red");
    expect(red?.lostTo).toEqual({ "@media (min-width: 42em) .a.b": 1 });
  });

  test("tracks rule identity for matched-rule lookups", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
    ]);
    expect(agg.matchedRuleKeys.has("\0.a")).toBe(true);
  });
});

describe("deadInFixtures / foldCandidates", () => {
  test("losing only to a user-preference media rule is not dead", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "transition", value: "opacity 70ms" }]),
      rule("@media (prefers-reduced-motion: reduce)", ".a", [
        { property: "transition", value: "none" },
      ]),
    ]);
    expect(deadInFixtures(agg)).toEqual([]);
  });

  test("a declaration that always loses is dead; one that sometimes wins is not", () => {
    const agg = createAggregate();
    // .a color:red always loses to .a.b color:blue.
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ]);
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ]);
    // .c top:0 wins on its own elsewhere.
    recordObservation(agg, [rule("", ".c", [{ property: "top", value: "0" }])]);

    const dead = deadInFixtures(agg);
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({
      selector: ".a",
      property: "color",
      value: "red",
    });

    const fold = foldCandidates(agg);
    expect(fold).toHaveLength(1);
    expect(fold[0].lostTo).toEqual({ ".a.b": 2 });
  });

  test("not a fold candidate when it loses to more than one rule", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ]);
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.c", [{ property: "color", value: "green" }]),
    ]);
    expect(deadInFixtures(agg)).toHaveLength(1);
    expect(foldCandidates(agg)).toHaveLength(0);
  });
});

describe("inventoryFromRules / neverMatchedRules", () => {
  test("flags inventory rules that never matched, keeps bytes for sorting", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
    ]);

    const inventory = inventoryFromRules([
      { context: "", selector: ".a", decls: new Map([["color", "red"]]) },
      { context: "", selector: ".unused", decls: new Map([["top", "0"]]) },
    ]);
    const unmatched = neverMatchedRules(agg, inventory);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0].selector).toBe(".unused");
    expect(unmatched[0].bytes).toBe(bytesOf({ property: "top", value: "0" }));
  });
});

describe("summarize", () => {
  test("reports totals consistent with the aggregate and inventory", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ]);
    const inventory = inventoryFromRules([
      { context: "", selector: ".a", decls: new Map([["color", "red"]]) },
      { context: "", selector: ".a.b", decls: new Map([["color", "blue"]]) },
      { context: "", selector: ".unused", decls: new Map([["top", "0"]]) },
    ]);
    const summary = summarize(agg, inventory, 1, 2);
    expect(summary).toMatchObject({
      fixtures: 1,
      themes: 2,
      observations: 1,
      rulesTotal: 3,
      rulesMatched: 2,
      declarationsTotal: 2,
      declarationsEverWon: 1,
      declarationsNeverWon: 1,
    });
    expect(summary.bytesNeverWon).toBe(
      bytesOf({ property: "color", value: "red" }),
    );
    expect(summary.bytesUnmatchedRules).toBe(
      bytesOf({ property: "top", value: "0" }),
    );
  });
});

describe("normalizeSelector / normalizeContext", () => {
  test("collapses insignificant whitespace so differently-formatted selectors compare equal", () => {
    expect(normalizeSelector(".a   .b")).toBe(normalizeSelector(".a .b"));
    expect(normalizeSelector("  .a.b  ")).toBe(normalizeSelector(".a.b"));
  });

  test("falls back to a trimmed string when parsing throws", () => {
    // css-tree throws on this rather than parsing it leniently.
    expect(normalizeSelector("{{{")).toBe("{{{");
  });

  test("collapses whitespace in at-rule context text", () => {
    expect(normalizeContext("@media  (min-width:   42em)")).toBe(
      "@media (min-width: 42em)",
    );
  });
});
