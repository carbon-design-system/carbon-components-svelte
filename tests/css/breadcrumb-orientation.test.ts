// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("breadcrumb orientation", () => {
  it("pins the layout after the responsive base rule", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const base = rules.filter((r) => r.selector === ".bx--breadcrumb");
    const responsive = base.find((r) => r.context.includes("min-width"));
    const horizontal = rules.find(
      (r) => r.selector === ".bx--breadcrumb--horizontal",
    );
    const vertical = rules.find(
      (r) => r.selector === ".bx--breadcrumb--vertical",
    );

    expect(base.some((r) => r.decls.get("display") === "inline")).toBe(true);
    expect(responsive?.decls.get("display")).toBe("flex");

    expect(horizontal?.context).toBe("");
    expect(horizontal?.decls.get("display")).toBe("flex");
    expect(horizontal?.decls.get("flex-wrap")).toBe("wrap");

    expect(vertical?.context).toBe("");
    expect(vertical?.decls.get("display")).toBe("flex");
    expect(vertical?.decls.get("flex-direction")).toBe("column");

    // Equal specificity, so emit order decides the cascade.
    for (const rule of [horizontal, vertical]) {
      expect(rule?.specificity).toEqual(responsive?.specificity);
      expect(rule?.order).toBeGreaterThan(
        responsive?.order ?? Number.POSITIVE_INFINITY,
      );
    }
  }, 30_000);
});
