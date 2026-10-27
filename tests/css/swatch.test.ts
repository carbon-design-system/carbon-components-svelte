// @vitest-environment node
import { contrast, THEMES, themeTokens } from "./helpers";

const COLORS = [
  "red",
  "magenta",
  "purple",
  "blue",
  "cyan",
  "teal",
  "green",
  "gray",
];

// The dot sits in a tag, which paints `tag-background-<hue>`. A dot that
// reads the same token as its host disappears (`red-20` on `red-20`), so it
// reads the strong avatar fills instead. The default avatar fills fall to
// 1.5:1 on a gray tag in g80 and 2.3:1 in g90 and g100. The strong fills
// stay at 2.9:1 or more, from a gray tag in g80 up to 8.7:1 in white.
describe("Swatch fill", () => {
  it("reads the strong avatar fill tokens, not the tag background tokens", async () => {
    const { rules } = await themeTokens();
    for (const color of COLORS) {
      const rule = rules.find(
        (r) => r.selector === `.bx--swatch--${color}` && r.context === "",
      );
      expect(rule, color).toBeDefined();
      const fill = rule?.decls.get("--ccs-swatch-color");
      expect(fill, color).toBe(`var(--ccs-user-avatar-${color}-strong)`);
    }
  }, 30_000);

  it.each(THEMES)(
    "stands out from a gray tag in %s",
    async (theme) => {
      const tokens = (await themeTokens()).themes[theme];
      for (const color of COLORS) {
        const fill = tokens[`--ccs-user-avatar-${color}-strong`];
        expect(
          contrast(fill, tokens["--cds-tag-background-gray"]),
          `${color} on tag-background-gray`,
        ).toBeGreaterThanOrEqual(2.5);
      }
    },
    30_000,
  );
});
