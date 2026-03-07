import { expect, test } from "@playwright/test";

test.describe("ExpandableTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/expandable-tile.html");
  });

  test("renders above-the-fold content", async ({ page }) => {
    await expect(page.getByTestId("above-fold")).toHaveText("Above the fold");
    await expect(page.getByTestId("above-fold")).toBeVisible();
  });

  test("expands on click to show below-the-fold content", async ({ page }) => {
    await page.getByTestId("expandable-tile").click();

    await expect(page.getByTestId("below-fold")).toBeVisible();
    await expect(page.getByTestId("below-fold")).toHaveText("Below the fold");
  });

  test("collapses on second click", async ({ page }) => {
    await page.getByTestId("expandable-tile").click();
    await expect(page.getByTestId("below-fold")).toBeVisible();

    await page.getByTestId("expandable-tile").click();
    await expect(page.getByTestId("expandable-tile")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("has aria-expanded that toggles with state", async ({ page }) => {
    const tile = page.getByTestId("expandable-tile");
    await expect(tile).toHaveAttribute("aria-expanded", "false");

    await tile.click();
    await expect(tile).toHaveAttribute("aria-expanded", "true");

    await tile.click();
    await expect(tile).toHaveAttribute("aria-expanded", "false");
  });
});
