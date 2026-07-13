import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ClickableTile a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/clickable-tile.html");
    await expect(page.getByTestId("clickable-tile")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("clickable-tile").click();
    await expect(page.getByTestId("clicked-state")).toHaveText("true");

    const clickedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(clickedResults.violations).toEqual([]);
  });
});
