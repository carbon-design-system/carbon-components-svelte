// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("tag lg close icon", () => {
  // The close button kept its 24px default inside a 32px tag.
  it("sizes the close button to the large tag height", async () => {
    const rule = parseRules(await compileEntry("all.scss")).find(
      (r) =>
        r.selector === ".bx--tag--lg .bx--tag__close-icon" && r.context === "",
    );
    expect(rule?.decls.get("width")).toBe("2rem");
    expect(rule?.decls.get("height")).toBe("2rem");
  }, 30_000);
});
