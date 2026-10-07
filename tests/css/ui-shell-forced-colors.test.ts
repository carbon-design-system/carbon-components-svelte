// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

describe("UI shell in forced colors", () => {
  async function forcedRules() {
    const css = await compileEntry("white.scss");
    return parseRules(css).filter((r) => r.context.includes("forced-colors"));
  }

  // The header focus ring is a border-colour change on a transparent border;
  // forced colors paint that border the same focused or not. The name and
  // actions also set `outline: none`.
  it.each([
    ".bx--header__menu-item:focus",
    ".bx--header__name:focus",
    ".bx--header__action:focus",
  ])(
    "outlines a focused %s",
    async (selector) => {
      const rules = (await forcedRules()).filter((r) =>
        r.selector.split(",").some((part) => part.trim() === selector),
      );
      expect(
        rules.some((r) => r.decls.get("outline")?.includes("Highlight")),
      ).toBe(true);
    },
    30_000,
  );

  // `.bx--header__global .bx--header__action:not(.bx--header-search-button):focus`
  // (0,4,0) sets `outline: none`, so the global action needs a matching rule.
  it("outlines a focused global header action over its outline: none", async () => {
    const rules = (await forcedRules()).filter((r) =>
      r.selector.includes(
        ".bx--header .bx--header__global .bx--header__action:not(.bx--header-search-button):focus",
      ),
    );
    expect(
      rules.some((r) => r.decls.get("outline")?.includes("Highlight")),
    ).toBe(true);
  }, 30_000);

  const link = ".bx--switcher__item-link.bx--switcher__item-link--selected";

  it("paints the selected header panel link with Highlight, even pressed", async () => {
    const rules = await forcedRules();
    for (const selector of [link, `${link}:active`]) {
      expect(
        rules.some(
          (r) =>
            r.selector.split(",").some((part) => part.trim() === selector) &&
            r.decls.get("forced-color-adjust") === "none" &&
            r.decls.get("background-color") === "Highlight" &&
            r.decls.get("color") === "HighlightText",
        ),
      ).toBe(true);
    }
  }, 30_000);

  it("keeps the selected header panel link's focus ring a system colour", async () => {
    const rules = (await forcedRules()).filter(
      (r) => r.selector === `${link}:focus`,
    );
    expect(
      rules.some((r) => r.decls.get("outline")?.includes("HighlightText")),
    ).toBe(true);
  }, 30_000);
});
