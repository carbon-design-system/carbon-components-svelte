import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

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
    // The content below the fold fades in. Scan once it is opaque: mid-fade,
    // axe reads the faint text and reports a contrast failure.
    await page
      .locator("#app")
      .evaluate((app) =>
        Promise.all(
          app.getAnimations({ subtree: true }).map((a) => a.finished),
        ),
      );

    const expandedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(expandedResults.violations).toEqual([]);
  });
});
