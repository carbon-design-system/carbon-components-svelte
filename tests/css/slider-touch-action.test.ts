// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("slider touch-action", () => {
  it("only lets the page pan across the drag axis", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const horizontal = rules.find((r) => r.selector === ".bx--slider");
    const vertical = rules.find((r) => r.selector === ".bx--slider--vertical");

    expect(horizontal?.decls.get("touch-action")).toBe("pan-y");
    expect(vertical?.decls.get("touch-action")).toBe("pan-x");
    expect(vertical?.order).toBeGreaterThan(
      horizontal?.order ?? Number.POSITIVE_INFINITY,
    );
  }, 30_000);
});
