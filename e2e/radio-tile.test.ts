import { expect, test } from "@playwright/test";

test.describe("RadioTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/radio-tile.html");
  });

  test("renders radio tiles", async ({ page }) => {
    await expect(page.getByTestId("radio-tile-group")).toBeVisible();
    await expect(page.getByRole("group", { name: "Choose one" })).toBeVisible();
    await expect(page.getByTestId("radio-tile-a")).toContainText("Option A");
    await expect(page.getByTestId("radio-tile-b")).toContainText("Option B");
  });

  test("selects tile when clicked", async ({ page }) => {
    await expect(page.getByTestId("selected-value")).toHaveText("none");

    await page.getByTestId("radio-tile-a").click();
    await expect(page.getByTestId("selected-value")).toHaveText("a");

    await page.getByTestId("radio-tile-b").click();
    await expect(page.getByTestId("selected-value")).toHaveText("b");
  });
});
