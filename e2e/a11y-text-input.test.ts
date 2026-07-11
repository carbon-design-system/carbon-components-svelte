import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TextInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/text-input.html");
    await expect(page.getByTestId("text-input-username")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
