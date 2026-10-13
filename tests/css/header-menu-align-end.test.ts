// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("header menu align end", () => {
  it("right-aligns an open menu and beats the default left alignment", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const open = ".bx--header__menu-title[aria-expanded=true]+";
    const base = rules.find(
      (r) => r.selector === `${open}.bx--header__menu` && r.decls.has("left"),
    );
    const alignEnd = rules.find(
      (r) => r.selector === `${open}.bx--header__menu--align-end`,
    );

    expect(base?.decls.get("left")).toBe("0");
    expect(alignEnd?.decls.get("right")).toBe("0");
    expect(alignEnd?.decls.get("left")).toBe("auto");
    // Equal specificity, so emit order decides.
    expect(alignEnd?.specificity).toEqual(base?.specificity);
    expect(alignEnd?.order).toBeGreaterThan(
      base?.order ?? Number.POSITIVE_INFINITY,
    );
  }, 30_000);
});
