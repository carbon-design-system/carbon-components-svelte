// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

const SELECTOR = ".bx--slider-container--readonly .bx--slider__thumb:focus";

describe("read-only slider thumb focus", () => {
  it("restores the hidden thumb's size so focus is visible", async () => {
    const rule = parseRules(await compileEntry("all.scss")).find(
      (r) => r.context === "" && r.selector === SELECTOR,
    );

    expect(rule?.decls.get("width")).toBe("0.875rem");
    expect(rule?.decls.get("height")).toBe("0.875rem");
  }, 30_000);
});
