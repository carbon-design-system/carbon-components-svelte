// @vitest-environment node
import { parseRules } from "../../scripts/lib/css-cascade";
import { compileEntry } from "./compile";

// A focus ring should snap, so a transition must name its properties (no
// `all`, no bare duration) and leave out the property drawing the ring.
const transitionProperties = async (selector: string) => {
  const value = parseRules(await compileEntry("all.scss"))
    .find(
      (r) =>
        r.selector === selector &&
        r.context === "" &&
        r.decls.has("transition"),
    )
    ?.decls.get("transition");
  return value?.split(/,(?![^(]*\))/).map((part) => part.trim().split(" ")[0]);
};

describe("focus ring transitions", () => {
  it("file uploader browse button fades only its color", async () => {
    expect(await transitionProperties(".bx--file-browse-btn")).toEqual([
      "color",
    ]);
  }, 30_000);

  it.each([
    ".bx--side-nav__submenu",
    ".bx--side-nav__link",
    ".bx--side-nav .bx--header__menu-item",
  ])(
    "side nav %s leaves outline out",
    async (selector) => {
      expect(await transitionProperties(selector)).toEqual([
        "color",
        "background-color",
      ]);
    },
    30_000,
  );

  it.each([".bx--toggle__switch::before", ".bx--toggle__appearance::before"])(
    "toggle %s leaves out the box-shadow ring",
    async (selector) => {
      expect(await transitionProperties(selector)).toEqual([
        "background-color",
      ]);
    },
    30_000,
  );

  it.each([
    ".bx--toggle-input:disabled+.bx--toggle-input__label>.bx--toggle__switch::before",
    ".bx--toggle:disabled+.bx--toggle__label .bx--toggle__appearance::after",
  ])(
    "disabled toggle %s names its properties",
    async (selector) => {
      expect(await transitionProperties(selector)).toEqual([
        "background-color",
        "transform",
      ]);
    },
    30_000,
  );
});
