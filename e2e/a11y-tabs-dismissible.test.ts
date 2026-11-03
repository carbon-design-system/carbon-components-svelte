import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Tabs dismissible a11y", () => {
  for (const type of ["line", "container"]) {
    test(`${type} tabs have no detectable accessibility violations`, async ({
      page,
    }) => {
      await page.goto("/tabs-dismissible.html");
      await expect(page.getByTestId(`tabs-${type}`)).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include(`[data-testid="tabs-${type}"]`)
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
