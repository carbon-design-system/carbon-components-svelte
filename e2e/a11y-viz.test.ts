import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Data visualization a11y", () => {
  for (const theme of ["white", "g10", "g90", "g100"]) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      await page.goto("/viz.html");
      await page.evaluate(
        (value) => document.documentElement.setAttribute("theme", value),
        theme,
      );
      await expect(page.getByTestId("viz")).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
