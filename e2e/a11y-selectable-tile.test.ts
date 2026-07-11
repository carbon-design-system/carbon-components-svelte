import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("SelectableTile a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/selectable-tile.html");
    await expect(page.getByTestId("selectable-tile-group")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no detectable accessibility violations after selecting a tile", async ({
    page,
  }) => {
    await page.goto("/selectable-tile.html");
    await page.getByTestId("selectable-tile-x").click();
    await expect(page.getByTestId("selected-values")).toHaveText("x");

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
