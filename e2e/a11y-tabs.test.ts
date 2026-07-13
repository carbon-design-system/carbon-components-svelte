import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Tabs a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tabs.html");
    await expect(page.getByTestId("tab-content-1")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("tab", { name: "Tab 2" }).click();
    await expect(page.getByTestId("tab-content-2")).toBeVisible();

    const switchedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(switchedResults.violations).toEqual([]);
  });
});
