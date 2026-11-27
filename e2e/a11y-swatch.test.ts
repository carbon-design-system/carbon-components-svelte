import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Swatch a11y", () => {
  for (const theme of ["white", "g100"]) {
    test(`has no accessibility violations in ${theme}`, async ({ page }) => {
      await page.goto("/swatch.html");
      await page.evaluate(
        (theme) => document.documentElement.setAttribute("theme", theme),
        theme,
      );
      await expect(
        page.getByTestId("palette").locator(".bx--swatch"),
      ).toHaveCount(8);
      // Axe reads colors, which are mid-transition after the theme switch.
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((a) => a.finished)),
      );

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
