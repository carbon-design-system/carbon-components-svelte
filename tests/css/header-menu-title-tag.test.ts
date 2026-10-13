// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("header menu title tag", () => {
  it("drops a trigger tag's trailing margin over the tag's own margin", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const tag = rules.find(
      (r) => r.selector === ".bx--tag" && r.decls.has("margin"),
    );
    const inTrigger = rules.find(
      (r) => r.selector === ".bx--header__menu-title>.bx--tag",
    );

    expect(tag?.decls.get("margin")).toBeDefined();
    expect(inTrigger?.decls.get("margin-right")).toBe("0");
    expect(inTrigger?.specificity).toEqual([0, 2, 0]);
    expect(tag?.specificity).toEqual([0, 1, 0]);
  }, 30_000);
});
