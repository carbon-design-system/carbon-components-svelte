import { expect, test } from "@playwright/test";

test.describe("DataTable batch actions overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 720 });
    await page.goto("/data-table-batch-actions-overflow.html");
  });

  test("hidden batch actions bar does not widen the page", async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("selecting a row reveals the bar and its actions", async ({ page }) => {
    await page
      .getByRole("checkbox", { name: "Select all rows" })
      .click({ force: true });

    const batchActionsBar = page.locator(".bx--batch-actions--active");
    await expect(batchActionsBar).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();
  });
});
