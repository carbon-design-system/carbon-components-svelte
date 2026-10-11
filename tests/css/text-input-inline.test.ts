// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("text input inline form item", () => {
  it("keeps an inline input at its content width in a flex row", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css);
    const find = (selector: string) =>
      rules.find((r) => r.selector === selector);

    const formItem = find(".bx--form-item.bx--text-input-wrapper--inline");
    expect(formItem?.decls.get("flex")).toBe("0 1 auto");

    const label = find(".bx--text-input-wrapper--inline .bx--label--inline");
    expect(label?.decls.get("width")).toBe("max-content");
    expect(label?.decls.get("max-width")).toBe("100%");
  }, 30_000);
});
