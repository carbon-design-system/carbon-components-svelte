// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("header panel group", () => {
  it("resets the nested link list and its first item margin", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const list = rules.find(
      (r) => r.selector === ".bx--header-panel-group__list",
    );
    const first = rules.find(
      (r) =>
        r.selector ===
        ".bx--header-panel-group__list>.bx--switcher__item:nth-child(1)",
    );

    expect(list?.decls.get("list-style")).toBe("none");
    expect(list?.decls.get("margin")).toBe("0");
    expect(list?.decls.get("padding")).toBe("0");
    // Only the first link of the whole panel keeps the top margin.
    expect(first?.decls.get("margin-top")).toBe("0");
  }, 30_000);
});
