// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// The low-contrast resting `border-color` outranked Carbon's selected
// `border-color: transparent`, so the selected card showed that border plus
// its own `::after` ring 1px inside it: a double outline.
describe("low contrast content switcher selected card", () => {
  it("draws one ring at the edge instead of the border and an inset ring", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css).filter((r) => r.context.length === 0);
    const selected =
      ".bx--content-switcher--low-contrast .bx--content-switcher-btn.bx--content-switcher--selected";
    const card = rules.find((r) => r.selector === selected);
    expect(card?.decls.get("border-color")).toBe("transparent");
    expect(card?.decls.get("outline")).toMatch(/^0.0625rem solid /);
    expect(card?.decls.get("outline-offset")).toBe("-0.0625rem");
    const overlay = rules.find((r) => r.selector === `${selected}::after`);
    expect(overlay?.decls.get("box-shadow")).toBe("none");
    // The fill must sit under the outline, or it covers the ring's sides on
    // middle switches (no side border slot).
    expect(overlay?.decls.get("z-index")).toBe("-1");
  }, 30_000);

  // A focus ring split across the outline and an `::after` shadow left a
  // seam where their corner curves diverged.
  it("draws the 2px focus ring as one outline", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css).filter((r) => r.context.length === 0);
    const selected =
      ".bx--content-switcher--low-contrast .bx--content-switcher-btn.bx--content-switcher--selected";
    const focus = rules.find((r) => r.selector === `${selected}:focus`);
    expect(focus?.decls.get("outline")).toMatch(/^0.125rem solid /);
    expect(focus?.decls.get("outline-offset")).toBe("-0.125rem");
    const overlay = rules.find(
      (r) => r.selector === `${selected}:focus::after`,
    );
    expect(overlay?.decls.get("box-shadow")).toBe("none");
  }, 30_000);
});
