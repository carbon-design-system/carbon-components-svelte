// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("content switcher auto width", () => {
  it("sizes switches to their labels and the switcher to its switches", async () => {
    const css = await compileEntry("white.scss");
    const rules = parseRules(css);
    const index = (selector: string) =>
      rules.findIndex((r) => r.selector === selector);

    const root = rules.find(
      (r) => r.selector === ".bx--content-switcher--auto-width",
    );
    expect(root?.decls.get("width")).toBe("fit-content");
    expect(root?.decls.get("max-width")).toBe("100%");

    const btnSelector =
      ".bx--content-switcher--auto-width .bx--content-switcher-btn";
    const btn = rules.find((r) => r.selector === btnSelector);
    expect(btn?.decls.get("width")).toBe("auto");
    expect(btn?.decls.get("flex")).toBe("0 1 auto");

    // Icon-only's fixed square width has equal specificity, so it must come
    // later to win when both modifiers are set.
    expect(index(btnSelector)).toBeLessThan(
      index(".bx--content-switcher--icon-only .bx--content-switcher-btn"),
    );
  }, 30_000);
});
