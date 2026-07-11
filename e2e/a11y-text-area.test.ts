import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TextArea a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/text-area.html");
    await expect(page.getByTestId("text-area-comment")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
