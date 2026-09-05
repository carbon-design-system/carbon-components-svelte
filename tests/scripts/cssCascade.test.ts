import {
  coMatchable,
  conflictingProps,
  parseRules,
  wins,
} from "../../scripts/lib/css-cascade";

const rules = (css: string) => parseRules(css);
const one = (css: string) => rules(css)[0];

describe("parseRules", () => {
  test("computes specificity per selector in a list", () => {
    const [a, b, c, d] = rules(
      ".x, .x.y:hover, button.x::before, .x:not(.y):not(.z)  { color: red }",
    );
    expect(a.specificity).toEqual([0, 1, 0]);
    expect(b.specificity).toEqual([0, 3, 0]);
    expect(c.specificity).toEqual([0, 1, 2]);
    expect(d.specificity).toEqual([0, 3, 0]);
  });

  test(":where adds nothing, :is/:not take the heaviest argument", () => {
    expect(one(":where(.a.b) .c { color: red }").specificity).toEqual([
      0, 1, 0,
    ]);
    expect(one(":is(.a, .b.c) { color: red }").specificity).toEqual([0, 2, 0]);
    expect(one("#id { color: red }").specificity).toEqual([1, 0, 0]);
  });

  test("records media context, order, and important declarations", () => {
    const [plain, inMedia] = rules(
      ".x { color: red } @media (any-hover: hover) { .x:hover { color: blue !important; padding: 0 } }",
    );
    expect(plain.context).toBe("");
    expect(inMedia.context).toBe("@media (any-hover:hover)");
    expect(inMedia.order).toBeGreaterThan(plain.order);
    expect(inMedia.decls.get("color")).toBe("blue !important");
    expect(inMedia.declBlock).toBe("color:blue !important;padding:0");
  });

  test("subject is the last compound only", () => {
    const r = one(".a .b:not(.c)::after { color: red }");
    expect([...r.subject.classes]).toEqual(["b"]);
    expect([...r.subject.negated]).toEqual(["c"]);
    expect(r.subject.pseudoElement).toBe("after");
  });
});

describe("coMatchable", () => {
  const r = (sel: string) => one(`${sel} { color: red }`);

  test("shares a subject class", () => {
    expect(coMatchable(r(".a .x"), r(".x.y"))).toBe(true);
    expect(coMatchable(r(".x"), r(".y"))).toBe(false);
  });

  test("a negated class excludes the other's required class", () => {
    expect(coMatchable(r(".x:not(.y)"), r(".x.y"))).toBe(false);
    expect(coMatchable(r(".x:not(.d) ~ .y"), r(".x.d ~ .y"))).toBe(false);
    expect(coMatchable(r(".x:not(.d) ~ .y"), r(".x ~ .y"))).toBe(true);
  });

  test("pseudo-elements and media contexts must agree", () => {
    expect(coMatchable(r(".x::before"), r(".x"))).toBe(false);
    const [a, b] = rules(
      ".x { color: red } @media print { .x { color: blue } }",
    );
    expect(coMatchable(a, b)).toBe(false);
  });

  test("type-only subjects pair only on same type and a shared class", () => {
    expect(coMatchable(r("tr"), r(".x"))).toBe(false);
    expect(coMatchable(r("tr"), r("tbody tr"))).toBe(true);
    expect(coMatchable(r(".a svg"), r(".a:hover > svg"))).toBe(true);
    expect(coMatchable(r(".a svg"), r(".b svg"))).toBe(false);
    expect(coMatchable(r(".a svg"), r(".a path"))).toBe(false);
  });
});

describe("wins", () => {
  test("important beats specificity beats order", () => {
    const [low, high, later, imp] = rules(
      ".a { color: red } .a.b { color: red } .a { color: red } .c { color: red !important }",
    );
    expect(wins(high, low, "color")).toBe(true);
    expect(wins(later, low, "color")).toBe(true);
    expect(wins(low, later, "color")).toBe(false);
    expect(wins(imp, high, "color")).toBe(true);
  });

  test("conflicting properties include shorthand/longhand pairs", () => {
    const [a, b] = rules(
      ".a { border: 0; padding-left: 1px } .b { border-color: red; margin: 0 }",
    );
    expect(conflictingProps(a, b)).toEqual(["border~border-color"]);
  });
});
