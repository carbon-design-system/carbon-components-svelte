import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("TileGrid a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/tile-grid.html");
    await expect(page.getByTestId("tile-grid")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowDown");
    const focusedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(focusedResults.violations).toEqual([]);
  });
});
