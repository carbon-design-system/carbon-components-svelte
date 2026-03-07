import { expect, test } from "@playwright/test";

test.describe("StructuredList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/structured-list.html");
  });

  test("renders structured list", async ({ page }) => {
    await expect(page.getByTestId("structured-list")).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("Row A")).toBeVisible();
    await expect(page.getByText("Row B")).toBeVisible();
  });

  test("selects row when clicked", async ({ page }) => {
    await expect(page.getByTestId("selected-value")).toHaveText("none");

    await page.getByText("Row A").click();

    await expect(page.getByTestId("selected-value")).toHaveText("a");
  });
});
