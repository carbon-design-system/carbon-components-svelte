// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("tooltip definition wrapper", () => {
  it("is the positioning context for its inline tooltip", async () => {
    // The tooltip is a sibling of the trigger, absolutely positioned. With
    // a static wrapper it resolved against the page and rendered far from
    // the term.
    const rules = parseRules(await compileEntry("all.scss"));
    const wrapper = rules.filter(
      (r) => r.selector === ".bx--tooltip--definition.bx--tooltip--a11y",
    );

    expect(wrapper.some((r) => r.decls.get("position") === "relative")).toBe(
      true,
    );
  });
});
