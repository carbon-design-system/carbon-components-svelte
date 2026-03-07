import { expect, test } from "@playwright/test";

test.describe("Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pagination.html");
  });

  test("renders pagination", async ({ page }) => {
    await expect(page.getByTestId("pagination")).toBeVisible();
    await expect(page.getByText("1–10 of 50 items")).toBeVisible();
  });

  test("next page button advances page", async ({ page }) => {
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText("11–20 of 50 items")).toBeVisible();
  });

  test("previous page button goes back", async ({ page }) => {
    await page.getByRole("button", { name: "Next page" }).click();
    await page.getByRole("button", { name: "Previous page" }).click();
    await expect(page.getByText("1–10 of 50 items")).toBeVisible();
  });

  test("can change items per page", async ({ page }) => {
    await page.getByLabel("Items per page:").selectOption("20");
    await expect(page.getByText("1–20 of 50 items")).toBeVisible();
  });
});
