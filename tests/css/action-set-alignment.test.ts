// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// As Carbon: actions that don't fill the row (25% buttons at xl and 2xl)
// sit at the inline end, so the primary action stays in the trailing
// corner. flex-end follows the writing direction, so RTL needs no rule.
describe("ActionSet alignment", () => {
  it("packs actions at the inline end", async () => {
    const rules = parseRules(await compileEntry("white.scss"));
    const set = rules.filter(
      (r) => r.selector === ".bx--action-set" && r.decls.has("justify-content"),
    );

    expect(set.map((r) => r.decls.get("justify-content"))).toEqual([
      "flex-end",
    ]);
  }, 30_000);
});
