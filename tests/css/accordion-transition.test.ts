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

describe("accordion transition", () => {
  it(".bx--accordion__item lists border-color instead of `all`", async () => {
    const transition = await transitionOf(".bx--accordion__item");
    expect(transition).toBeDefined();
    expect(transition).not.toMatch(/\ball\b/);
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["border-color"]);
  }, 30_000);

  it(".bx--accordion__arrow lists transform and fill instead of `all`", async () => {
    const transition = await transitionOf(".bx--accordion__arrow");
    expect(transition).toBeDefined();
    expect(transition).not.toMatch(/\ball\b/);
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["transform", "fill"]);
  }, 30_000);
});
