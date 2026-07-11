import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("ExpandableTile a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/expandable-tile.html");
    await expect(page.getByTestId("expandable-tile")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations when expanded", async ({
    page,
  }) => {
    await page.goto("/expandable-tile.html");
    await page.getByTestId("expandable-tile").click();
    await expect(page.getByTestId("expandable-tile")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
