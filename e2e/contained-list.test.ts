import { expect, test } from "@playwright/test";

test.describe("ContainedList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contained-list.html");
  });

  test("renders contained list", async ({ page }) => {
    await expect(page.getByTestId("contained-list")).toBeVisible();
    await expect(page.getByText("List title")).toBeVisible();
    await expect(page.getByText("Item 1")).toBeVisible();
    await expect(page.getByText("Item 2")).toBeVisible();
  });

  test("clicking interactive item triggers handler", async ({ page }) => {
    await expect(page.getByTestId("clicked-item")).toHaveText("none");

    await page.getByRole("button", { name: "Item 1" }).click();
    await expect(page.getByTestId("clicked-item")).toHaveText("1");

    await page.getByRole("button", { name: "Item 2" }).click();
    await expect(page.getByTestId("clicked-item")).toHaveText("2");
  });
});
