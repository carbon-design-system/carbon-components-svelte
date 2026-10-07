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

const properties = (transition: string | undefined) =>
  transition?.split(/,(?![^(]*\))/).map((t) => t.trim().split(" ")[0]);

describe("tile transition", () => {
  // `all` (no property) also animated `outline`, so the focus ring faded in
  // instead of snapping.
  it.each([".bx--tile--clickable", ".bx--tile--selectable"])(
    "%s lists background-color and border-color",
    async (selector) => {
      expect(properties(await transitionOf(selector))).toEqual([
        "background-color",
        "border-color",
      ]);
    },
    30_000,
  );

  it.each([".bx--tile__checkmark", ".bx--tile__chevron"])(
    "%s lists opacity",
    async (selector) => {
      expect(properties(await transitionOf(selector))).toEqual(["opacity"]);
    },
    30_000,
  );

  it(".bx--tile__chevron svg lists transform", async () => {
    expect(properties(await transitionOf(".bx--tile__chevron svg"))).toEqual([
      "transform",
    ]);
  }, 30_000);
});
