import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Link a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/link.html");
    await expect(page.getByTestId("link-md")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
