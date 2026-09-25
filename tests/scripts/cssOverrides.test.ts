// @vitest-environment node
import { covers, deadDeclarations } from "../../scripts/lib/css-overrides";

const dead = (css: string) =>
  deadDeclarations(css).map((d) => `${d.selector} ${d.property}:${d.value}`);

describe("deadDeclarations", () => {
  it("flags a declaration a later identical selector always overrides", () => {
    expect(dead(".a { color: red; top: 0 } .a { color: blue }")).toEqual([
      ".a color:red",
    ]);
  });

  it("needs every selector of the list to be overridden", () => {
    expect(dead(".a, .b { color: red } .a { color: blue }")).toEqual([]);
    expect(
      dead(".a, .b { color: red } .a { color: blue } .b { color: green }"),
    ).toEqual([".a,.b color:red"]);
  });

  it("keeps contexts apart", () => {
    const css =
      ".a { color: red } @media (min-width: 1px) { .a { color: blue } }";
    expect(dead(css)).toEqual([]);
  });

  it("respects importance", () => {
    expect(dead(".a { color: red !important } .a { color: blue }")).toEqual([]);
    expect(dead(".a { color: red } .a { color: blue !important }")).toEqual([
      ".a color:red",
    ]);
  });

  it("a later shorthand kills its longhands, not the reverse", () => {
    expect(dead(".a { padding-top: 1px } .a { padding: 0 }")).toEqual([
      ".a padding-top:1px",
    ]);
    expect(dead(".a { padding: 0 } .a { padding-top: 1px }")).toEqual([]);
    expect(covers("border", "border-radius")).toBe(false);
  });

  it("flags in-rule repeats except progressive-enhancement fallbacks", () => {
    expect(dead(".a { font-weight: 400; font-weight: var(--w, 400) }")).toEqual(
      [".a font-weight:400"],
    );
    expect(dead(".a { width: -moz-fit-content; width: fit-content }")).toEqual(
      [],
    );
  });

  it("ignores keyframe selectors", () => {
    const css =
      "@keyframes x { to { top: 0 } } @keyframes x { to { top: 1px } }";
    expect(dead(css)).toEqual([]);
  });

  it("block-axis logical properties share a slot with their physical twin", () => {
    expect(dead(".a { inset-block-start: 0; top: 1px }")).toEqual([
      ".a inset-block-start:0",
    ]);
    expect(dead(".a { height: 1px } .a { block-size: 2px }")).toEqual([
      ".a height:1px",
    ]);
    expect(dead(".a { margin-top: 1px } .a { margin-block: 0 }")).toEqual([
      ".a margin-top:1px",
    ]);
    expect(covers("border-block-end-color", "border-bottom-color")).toBe(true);
  });

  it("leaves the inline axis alone, since it maps by dir", () => {
    expect(dead(".a { margin-inline-start: 0; margin-left: 1px }")).toEqual([]);
    expect(covers("inset-inline-end", "right")).toBe(false);
  });

  it("keeps overflow: hidden as the fallback for overflow: clip", () => {
    expect(dead(".a { overflow: hidden; overflow: clip }")).toEqual([]);
    expect(dead(".a { overflow: hidden; overflow: auto }")).toEqual([
      ".a overflow:hidden",
    ]);
  });
});
