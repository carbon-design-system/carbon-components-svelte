// @vitest-environment node
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// ClickableTile's `icon` reads v11's `icon-interactive`, which the v10 theme
// maps never had, and `icon-disabled` on a disabled tile. Both must resolve
// in every theme, or the icon falls back to the inherited black fill.

const ICON = ".bx--tile--clickable .bx--tile--icon";
const DISABLED_ICON = ".bx--tile--clickable.bx--link--disabled .bx--tile--icon";
const THEMES = [
  ":root",
  ":root[theme=g10]",
  ":root[theme=g80]",
  ":root[theme=g90]",
  ":root[theme=g100]",
];

describe("ClickableTile icon", () => {
  it("fills with icon-interactive, and icon-disabled when disabled", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const fill = (selector: string) =>
      rules
        .filter((r) => r.selector === selector && r.context === "")
        .map((r) => r.decls.get("fill"));

    expect(fill(ICON)).toEqual(["var(--cds-icon-interactive)"]);
    expect(fill(DISABLED_ICON)).toEqual(["var(--cds-icon-disabled)"]);
  }, 30_000);

  it.each(THEMES)(
    "%s gives both tokens a color",
    async (selector) => {
      const rules = parseRules(await compileEntry("all.scss"));
      // A theme block declares only what differs from `:root`.
      const token = (name: string) =>
        [selector, ":root"]
          .map((s) => rules.find((r) => r.selector === s && r.decls.has(name)))
          .find(Boolean)
          ?.decls.get(name);

      expect(token("--cds-icon-interactive")).toMatch(/^#[\da-f]{3,8}$/);
      expect(token("--cds-icon-disabled")).toMatch(/^(#[\da-f]{3,8}|rgba?\()/);
    },
    30_000,
  );
});
