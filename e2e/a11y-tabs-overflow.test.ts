import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Tabs overflow a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tabs-overflow.html");
    await expect(page.getByTestId("tabs-overflow")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
