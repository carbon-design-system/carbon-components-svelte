import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

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

  test("adds no unnamed landmark for each tab list", async ({ page }) => {
    await page.goto("/tabs-landmarks.html");
    await expect(page.getByRole("tab", { name: "Eight" })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include("#app")
      .withRules(["landmark-unique"])
      .analyze();
    expect(results.violations).toEqual([]);
    await expect(page.getByRole("navigation")).toHaveCount(0);
  });
});
