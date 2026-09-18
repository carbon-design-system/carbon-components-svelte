import { covers, deadDeclarations } from "../../scripts/lib/css-overrides";

const dead = (css: string) =>
  deadDeclarations(css).map((d) => `${d.selector} ${d.property}:${d.value}`);

describe("deadDeclarations", () => {
  test("flags a declaration a later identical selector always overrides", () => {
    expect(dead(".a { color: red; top: 0 } .a { color: blue }")).toEqual([
      ".a color:red",
    ]);
  });

  test("needs every selector of the list to be overridden", () => {
    expect(dead(".a, .b { color: red } .a { color: blue }")).toEqual([]);
    expect(
      dead(".a, .b { color: red } .a { color: blue } .b { color: green }"),
    ).toEqual([".a,.b color:red"]);
  });

  test("keeps contexts apart", () => {
    const css =
      ".a { color: red } @media (min-width: 1px) { .a { color: blue } }";
    expect(dead(css)).toEqual([]);
  });

  test("respects importance", () => {
    expect(dead(".a { color: red !important } .a { color: blue }")).toEqual([]);
    expect(dead(".a { color: red } .a { color: blue !important }")).toEqual([
      ".a color:red",
    ]);
  });

  test("a later shorthand kills its longhands, not the reverse", () => {
    expect(dead(".a { padding-top: 1px } .a { padding: 0 }")).toEqual([
      ".a padding-top:1px",
    ]);
    expect(dead(".a { padding: 0 } .a { padding-top: 1px }")).toEqual([]);
    expect(covers("border", "border-radius")).toBe(false);
  });

  test("flags in-rule repeats except progressive-enhancement fallbacks", () => {
    expect(dead(".a { font-weight: 400; font-weight: var(--w, 400) }")).toEqual(
      [".a font-weight:400"],
    );
    expect(dead(".a { width: -moz-fit-content; width: fit-content }")).toEqual(
      [],
    );
  });

  test("ignores keyframe selectors", () => {
    const css =
      "@keyframes x { to { top: 0 } } @keyframes x { to { top: 1px } }";
    expect(dead(css)).toEqual([]);
  });
});
