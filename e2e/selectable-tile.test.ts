import { expect, test } from "@playwright/test";

test.describe("SelectableTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/selectable-tile.html");
  });

  test("renders selectable tiles", async ({ page }) => {
    await expect(page.getByTestId("selectable-tile-group")).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Choose one or more" }),
    ).toBeVisible();
    await expect(page.getByTestId("selectable-tile-x")).toContainText(
      "Option X",
    );
    await expect(page.getByTestId("selectable-tile-y")).toContainText(
      "Option Y",
    );
  });

  test("selects and deselects tiles when clicked", async ({ page }) => {
    await expect(page.getByTestId("selected-values")).toHaveText("none");

    await page.getByTestId("selectable-tile-x").click();
    await expect(page.getByTestId("selected-values")).toHaveText("x");

    await page.getByTestId("selectable-tile-y").click();
    await expect(page.getByTestId("selected-values")).toHaveText("x,y");

    await page.getByTestId("selectable-tile-x").click();
    await expect(page.getByTestId("selected-values")).toHaveText("y");
  });
});
