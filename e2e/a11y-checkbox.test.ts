import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Checkbox a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/checkbox.html");
    await expect(page.getByTestId("checkbox-agree")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
