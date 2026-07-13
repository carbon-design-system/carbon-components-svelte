import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ContentSwitcher a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/content-switcher.html");
    await expect(page.getByTestId("content-switcher")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("tab", { name: "Second" }).click();
    await expect(page.getByTestId("selected-index")).toHaveText("Selected: 1");

    const switchedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(switchedResults.violations).toEqual([]);
  });
});
