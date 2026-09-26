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

describe("list-box transition", () => {
  it(".bx--list-box lists background-color and border-bottom-color instead of `all`", async () => {
    const transition = await transitionOf(".bx--list-box");
    expect(transition).toBeDefined();
    expect(transition).not.toMatch(/\ball\b/);
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["background-color", "border-bottom-color"]);
    // The invalid ring and size modifiers must snap, not fade.
    expect(transition).not.toMatch(/outline|height/);
  }, 30_000);
});
