// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("select inline form item", () => {
  it("keeps an inline select's form item from growing in a flex row", async () => {
    const css = await compileEntry("white.scss");
    const rule = parseRules(css).find(
      (r) => r.selector === ".bx--form-item.bx--select__form-item--inline",
    );
    expect(rule?.decls.get("flex")).toBe("0 1 auto");
  }, 30_000);
});
