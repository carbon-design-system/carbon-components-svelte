import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("RadioTile a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/radio-tile.html");
    await expect(page.getByTestId("radio-tile-group")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("radio-tile-a").click();
    await expect(page.getByTestId("selected-value")).toHaveText("a");

    const selectedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(selectedResults.violations).toEqual([]);
  });
});
