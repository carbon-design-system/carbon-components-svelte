import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Select a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/select.html");
    await expect(page.getByTestId("select-country")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
