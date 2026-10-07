// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// Floating surfaces are separated from the page only by a box-shadow, which
// forced-colors mode drops. A transparent outline is repainted as a visible
// system colour there (the vendored `high-contrast-mode("outline")` idiom).
describe("floating surfaces in forced colors", () => {
  it.each([".bx--popover-contents", ".bx--overflow-menu-options", ".bx--menu"])(
    "outlines %s",
    async (selector) => {
      const css = await compileEntry("white.scss");
      const rules = parseRules(css).filter(
        (r) => r.context.includes("forced-colors") && r.selector === selector,
      );
      expect(rules.some((r) => r.decls.has("outline"))).toBe(true);
    },
    30_000,
  );

  // The caret paints Canvas in forced colors; its outward-facing sides get a
  // CanvasText edge so it reads as part of the outlined surface.
  it.each([
    ["bottom", ["border-top-width", "border-left-width"]],
    ["top-right", ["border-bottom-width", "border-right-width"]],
    ["right-top", ["border-bottom-width", "border-left-width"]],
    ["left", ["border-top-width", "border-right-width"]],
  ])(
    "edges the %s popover caret",
    async (direction, edges) => {
      const css = await compileEntry("white.scss");
      const selector = `.bx--popover--caret.bx--popover--${direction} .bx--popover-contents::after`;
      const rules = parseRules(css).filter(
        (r) => r.context.includes("forced-colors") && r.selector === selector,
      );
      expect(rules.length).toBeGreaterThan(0);
      for (const edge of edges) {
        expect(rules.some((r) => r.decls.get(edge) === "1px")).toBe(true);
      }
      expect(
        rules.some((r) => r.decls.get("border") === "0 solid CanvasText"),
      ).toBe(true);
    },
    30_000,
  );
});
