import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Tag a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tag.html");
    await expect(page.getByTestId("tag-filter")).toBeVisible();
    await expect(page.getByTestId("tag-static")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
