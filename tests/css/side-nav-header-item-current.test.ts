// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("side nav header item current", () => {
  it("swaps the header underline for the side nav's selected surface and accent bar", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const find = (selector: string) =>
      rules.filter((r) => r.selector === selector);

    const underline = find(".bx--header__menu-item--current::after")[0];
    const surface = find(".bx--side-nav .bx--header__menu-item--current").find(
      (r) => r.decls.has("background-color") && !r.context,
    );
    const bar = find(".bx--side-nav .bx--header__menu-item--current::after")[0];

    expect(underline?.decls.get("border-bottom")).toMatch(/^3px solid/);
    expect(surface?.decls.get("background-color")).toBeDefined();
    expect(bar?.decls.get("border-bottom")).toBe("0");
    expect(bar?.decls.get("width")).toBe("3px");
    expect(bar?.decls.get("left")).toBe("-2px");
    // The side nav rule must beat the header's underline.
    expect(bar?.specificity[1]).toBeGreaterThan(
      underline?.specificity[1] ?? Number.POSITIVE_INFINITY,
    );
  }, 30_000);
});
