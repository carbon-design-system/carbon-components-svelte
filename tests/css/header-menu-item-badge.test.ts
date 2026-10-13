// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("header menu item badge", () => {
  it("trails the label inline, and sits at the row's end in menus and the side nav", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const find = (selector: string) =>
      rules.find((r) => r.selector === selector);

    const inline = find(".bx--header__menu-item-badge");
    const reset = find(".bx--header__menu-item-badge>.bx--badge-indicator");
    const withIcon = find(
      ".bx--header__menu-item--icon>.bx--header__menu-item-badge",
    );
    const rowEnd =
      rules.find((r) =>
        r.selector.startsWith(".bx--header__menu .bx--header__menu-item-badge"),
      ) ?? find(".bx--header__menu .bx--header__menu-item-badge");

    expect(inline?.decls.get("margin-left")).toBeDefined();
    expect(reset?.decls.get("position")).toBe("static");
    expect(withIcon?.decls.get("margin-left")).toBe("0");
    expect(rowEnd?.decls.get("margin-left")).toBe("auto");
    // The row-end rule ties the icon rule and must come after it.
    expect(rowEnd?.specificity).toEqual(withIcon?.specificity);
    expect(rowEnd?.order).toBeGreaterThan(
      withIcon?.order ?? Number.POSITIVE_INFINITY,
    );
  }, 30_000);
});
