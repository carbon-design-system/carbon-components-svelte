// @vitest-environment node
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
  it("plain longhand", () => {
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

  it("skips disabled and unparsed entries", () => {
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

  it("skips implicit (text-less) entries", () => {
    expect(
      authoredDeclarations([
        { name: "padding-top", value: "0px", implicit: true },
      ]),
    ).toEqual([]);
  });

  it("expands a shorthand via CDP's own longhandProperties", () => {
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

  it("falls back to the SHORTHANDS table via sibling implicit entries", () => {
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

  it("unresolvable shorthand falls back to its own property name", () => {
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
  it("later declaration wins for the same property", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ];
    const winners = cascadeWinners(rules);
    expect(winners.get("color")).toEqual([1, 0]);
    expect(replayWins(rules)).toEqual([[false], [true]]);
  });

  it("!important wins regardless of order", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red", important: true }]),
      rule("", ".a.b", [{ property: "color", value: "blue" }]),
    ];
    expect(replayWins(rules)).toEqual([[true], [false]]);
  });

  it("later !important beats an earlier !important", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red", important: true }]),
      rule("", ".a.b", [{ property: "color", value: "blue", important: true }]),
    ];
    expect(replayWins(rules)).toEqual([[false], [true]]);
  });

  it("a shorthand wins if it wins any one of its longhands", () => {
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

  it("independent properties don't interact", () => {
    const rules = [
      rule("", ".a", [{ property: "color", value: "red" }]),
      rule("", ".a", [{ property: "top", value: "0" }]),
    ];
    expect(replayWins(rules)).toEqual([[true], [true]]);
  });
});

describe("recordObservation", () => {
  it("counts matches and wins across observations", () => {
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

  it("attributes a loss to the winning rule's label", () => {
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

  it("tracks rule identity for matched-rule lookups", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "color", value: "red" }]),
    ]);
    expect(agg.matchedRuleKeys.has("\0.a")).toBe(true);
  });
});

describe("deadInFixtures / foldCandidates", () => {
  it("losing only to a user-preference media rule is not dead", () => {
    const agg = createAggregate();
    recordObservation(agg, [
      rule("", ".a", [{ property: "transition", value: "opacity 70ms" }]),
      rule("@media (prefers-reduced-motion: reduce)", ".a", [
        { property: "transition", value: "none" },
      ]),
    ]);
    expect(deadInFixtures(agg)).toEqual([]);
  });

  it("a declaration that always loses is dead; one that sometimes wins is not", () => {
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

  it("not a fold candidate when it loses to more than one rule", () => {
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
  it("flags inventory rules that never matched, keeps bytes for sorting", () => {
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
  it("reports totals consistent with the aggregate and inventory", () => {
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
  it("collapses insignificant whitespace so differently-formatted selectors compare equal", () => {
    expect(normalizeSelector(".a   .b")).toBe(normalizeSelector(".a .b"));
    expect(normalizeSelector("  .a.b  ")).toBe(normalizeSelector(".a.b"));
  });

  it("falls back to a trimmed string when parsing throws", () => {
    // css-tree throws on this rather than parsing it leniently.
    expect(normalizeSelector("{{{")).toBe("{{{");
  });

  it("collapses whitespace in at-rule context text", () => {
    expect(normalizeContext("@media  (min-width:   42em)")).toBe(
      "@media (min-width: 42em)",
    );
  });
});
