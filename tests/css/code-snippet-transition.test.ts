// @vitest-environment node
import { parseRules } from "crassus";
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

describe("code-snippet transition", () => {
  it(".bx--snippet__icon lists fill instead of `all`", async () => {
    const transition = await transitionOf(".bx--snippet__icon");
    expect(transition).toBeDefined();
    expect(transition).not.toMatch(/\ball\b/);
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["fill"]);
  }, 30_000);

  it(".bx--snippet-btn--expand .bx--icon-chevron--down lists transform and fill instead of `all`", async () => {
    const transition = await transitionOf(
      ".bx--snippet-btn--expand .bx--icon-chevron--down",
    );
    expect(
      transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]),
    ).toEqual(["transform", "fill"]);
  }, 30_000);
});
