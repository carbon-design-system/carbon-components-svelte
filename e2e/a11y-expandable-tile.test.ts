import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ExpandableTile a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/expandable-tile.html");
    await expect(page.getByTestId("expandable-tile")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByTestId("expandable-tile").click();
    await expect(page.getByTestId("expandable-tile")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    const expandedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(expandedResults.violations).toEqual([]);
  });
});
