// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

describe("copy text", () => {
  it("shrinks the sm copy button after the base sm sizing so it wins", async () => {
    const rules = parseRules(await compileEntry("all.scss")).filter(
      (r) => r.context === "" && r.decls.has("width"),
    );
    const base = rules.findIndex(
      (r) => r.selector === ".bx--copy-btn.bx--copy-btn--sm",
    );
    const inline = rules.findIndex(
      (r) => r.selector === ".bx--copy-text .bx--copy-btn.bx--copy-btn--sm",
    );

    expect(base).toBeGreaterThanOrEqual(0);
    expect(inline).toBeGreaterThan(base);
    expect(rules[inline].decls.get("width")).toBe("1.5rem");
    expect(rules[inline].decls.get("height")).toBe("1.5rem");
  }, 30_000);
});
