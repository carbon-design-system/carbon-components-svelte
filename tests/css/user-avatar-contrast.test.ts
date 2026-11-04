// @vitest-environment node
import { contrast, THEMES, themeTokens } from "./helpers";

// The initials are text-inverse and the icon icon-inverse, on every fill:
// small text needs 4.5:1 and an icon 3:1.
describe("UserAvatar fill contrast", () => {
  it.each(THEMES)(
    "every fill holds its initials and icon in %s",
    async (theme) => {
      const tokens = (await themeTokens()).themes[theme];
      // The `-inverse` steps are Swatch fills on an inverse surface; no
      // initials sit on them (see swatch.test.ts).
      const fills = Object.keys(tokens).filter(
        (name) =>
          name.startsWith("--ccs-user-avatar-") && !name.endsWith("-inverse"),
      );
      // Ten hues, each with a default and a strong fill.
      expect(fills).toHaveLength(20);
      for (const fill of fills) {
        expect(tokens[fill], fill).toMatch(/^#[\da-f]{6}$/);
        expect(
          contrast(tokens["--cds-text-inverse"], tokens[fill]),
          `text-inverse on ${fill}`,
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(tokens["--cds-icon-inverse"], tokens[fill]),
          `icon-inverse on ${fill}`,
        ).toBeGreaterThanOrEqual(3);
      }
    },
    30_000,
  );
});
