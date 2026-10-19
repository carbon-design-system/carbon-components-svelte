import { expect, test } from "./helpers/host";

const VARIANTS = ["default", "low-contrast", "sm", "xl", "narrow"];

test.describe("ContentSwitcher icon and text", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/content-switcher-icon-text.html");
    await expect(page.getByTestId("narrow")).toBeVisible();
  });

  for (const id of VARIANTS) {
    test(`centers a leading icon on the text (${id})`, async ({ page }) => {
      const offsets = await page.getByTestId(id).evaluate((switcher) =>
        [...switcher.querySelectorAll(".bx--content-switcher__label")].map(
          (label) => {
            const icon = label.querySelector("svg")?.getBoundingClientRect();
            const line = label.getBoundingClientRect();
            if (!icon) return Number.NaN;
            return icon.top + icon.height / 2 - (line.top + line.height / 2);
          },
        ),
      );
      expect(offsets.length).toBeGreaterThan(0);
      for (const offset of offsets) expect(Math.abs(offset)).toBeLessThan(0.5);
    });
  }
});
