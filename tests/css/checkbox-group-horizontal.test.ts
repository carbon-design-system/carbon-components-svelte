// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("checkbox group horizontal", () => {
  it("lays checkboxes out in a row without the stack's margins", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const find = (selector: string) =>
      rules.find((r) => r.selector === selector);

    const group = find(".bx--checkbox-group--horizontal");
    expect(group?.decls.get("display")).toBe("flex");
    expect(group?.decls.get("flex-wrap")).toBe("wrap");

    const item = find(
      ".bx--checkbox-group--horizontal>.bx--form-item.bx--checkbox-wrapper",
    );
    expect(item?.decls.get("flex")).toBe("none");
    expect(item?.decls.get("margin")).toBe("0");

    // The stack's first/last margins have equal specificity, so the row's
    // reset must come later to win.
    for (const selector of [
      ".bx--form-item.bx--checkbox-wrapper:first-of-type",
      ".bx--form-item.bx--checkbox-wrapper:last-of-type",
      ".bx--label+.bx--form-item.bx--checkbox-wrapper",
    ]) {
      const stack = find(selector);
      expect(stack?.specificity).toEqual(item?.specificity);
      expect(stack?.order).toBeLessThan(item?.order ?? 0);
    }

    expect(
      find(
        ".bx--checkbox-group--horizontal>.bx--checkbox-group__validation-msg",
      )?.decls.get("flex-basis"),
    ).toBe("100%");
  }, 30_000);
});
