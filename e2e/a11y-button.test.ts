import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Button a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/button.html");
    await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
