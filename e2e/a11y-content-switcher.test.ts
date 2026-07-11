import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ContentSwitcher a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/content-switcher.html");
    await expect(page.getByTestId("content-switcher")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after switching", async ({
    page,
  }) => {
    await page.goto("/content-switcher.html");
    await page.getByRole("tab", { name: "Second" }).click();
    await expect(page.getByTestId("selected-index")).toHaveText("Selected: 1");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
