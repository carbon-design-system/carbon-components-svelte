// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("side nav menu badge", () => {
  it("stops the chevron filling the row when a badge precedes it", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const chevron = rules.find(
      (r) => r.selector === ".bx--side-nav__icon.bx--side-nav__submenu-chevron",
    );
    const afterBadge = rules.find(
      (r) =>
        r.selector ===
        ".bx--side-nav__submenu-badge+.bx--side-nav__icon.bx--side-nav__submenu-chevron",
    );

    expect(chevron?.decls.get("flex")).toBe("1");
    expect(afterBadge?.decls.get("flex")).toBe("0 0 auto");
    expect(afterBadge?.decls.get("margin-left")).toBeDefined();
    expect(afterBadge?.specificity[1]).toBeGreaterThan(
      chevron?.specificity[1] ?? Number.POSITIVE_INFINITY,
    );
  }, 30_000);
});
