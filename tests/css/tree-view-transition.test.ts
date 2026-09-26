// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

const transitionOf = async (selector: string) =>
  parseRules(await compileEntry("all.scss"))
    .find(
      (r) =>
        r.selector === selector &&
        r.context === "" &&
        r.decls.has("transition"),
    )
    ?.decls.get("transition");

describe("tree-view transition", () => {
  it(".bx--tree .bx--tree-parent-node__toggle-icon lists transform and fill instead of `all`", async () => {
    const transition = await transitionOf(
      ".bx--tree .bx--tree-parent-node__toggle-icon",
    );
    expect(transition).toBeDefined();
    expect(transition).not.toMatch(/\ball\b/);
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["transform", "fill"]);
  }, 30_000);
});
