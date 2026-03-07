import { expect, test } from "@playwright/test";

test.describe("DataTable", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table.html");
  });

  test("renders table with headers", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Value" }),
    ).toBeVisible();
  });

  test("renders rows with data", async ({ page }) => {
    const table = page.locator(".bx--data-table");
    await expect(table).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Row 0", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Row 1", exact: true }),
    ).toBeVisible();
  });
});
