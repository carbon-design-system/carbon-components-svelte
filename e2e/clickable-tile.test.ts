import { expect, test } from "@playwright/test";

test.describe("ClickableTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/clickable-tile.html");
  });

  test("renders clickable tile", async ({ page }) => {
    await expect(page.getByTestId("clickable-tile")).toBeVisible();
    await expect(page.getByText("Clickable tile content")).toBeVisible();
  });

  test("toggles clicked state when clicked", async ({ page }) => {
    await expect(page.getByTestId("clicked-state")).toHaveText("false");

    await page.getByTestId("clickable-tile").click();
    await expect(page.getByTestId("clicked-state")).toHaveText("true");

    await page.getByTestId("clickable-tile").click();
    await expect(page.getByTestId("clicked-state")).toHaveText("false");
  });
});
