// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("tearsheet stacking", () => {
  it("sits one level below Modal, and one above it when opened from a modal", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const zIndex = (selector: string) =>
      Number(rules.find((r) => r.selector === selector)?.decls.get("z-index"));

    const modal = zIndex(".bx--modal");
    expect(modal).toBeGreaterThan(0);
    expect(zIndex(".bx--tearsheet")).toBe(modal - 1);
    expect(zIndex(".bx--tearsheet--stacked")).toBe(modal + 1);
  }, 60_000);
});
