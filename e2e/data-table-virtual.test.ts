import { expect, test } from "@playwright/test";

test.describe("DataTable virtualization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-virtual.html");
  });

  test("renders column headers and first rows", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Value" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Row 0", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Row 1", exact: true }),
    ).toBeVisible();
  });

  test("omits far rows from the DOM until scrolled", async ({ page }) => {
    await expect(
      page.getByRole("cell", { name: "Row 0", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Row 65", exact: true }),
    ).toHaveCount(0);
  });

  test("scroll updates which rows are rendered", async ({ page }) => {
    const scrollContainer = page
      .getByTestId("data-table-virtual-root")
      .locator(".bx--data-table-container > div")
      .filter({ has: page.locator("table.bx--data-table") });
    await expect(scrollContainer).toBeVisible();

    await scrollContainer.evaluate((el) => {
      el.scrollTop = 50 * 48;
    });

    await expect(
      page.getByRole("cell", { name: "Row 50", exact: true }),
    ).toBeVisible();
    await expect(page.locator(`tr[data-row="50"]`)).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Row 0", exact: true }),
    ).toHaveCount(0);
  });

  test("virtual scroll container is height-limited and scrollable", async ({
    page,
  }) => {
    const scrollContainer = page
      .getByTestId("data-table-virtual-root")
      .locator(".bx--data-table-container > div")
      .filter({ has: page.locator("table.bx--data-table") });

    const metrics = await scrollContainer.evaluate((el) => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  });
});
