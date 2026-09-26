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

describe("structured-list transition", () => {
  it(".bx--structured-list-svg lists fill instead of `all`", async () => {
    const transition = await transitionOf(".bx--structured-list-svg");
    expect(transition).toBeDefined();
    expect(transition).not.toMatch(/\ball\b/);
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["fill"]);
  }, 30_000);
});
