import { expect, test } from "@playwright/test";

test.describe("Breadcrumb", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/breadcrumb.html");
  });

  test("renders breadcrumb", async ({ page }) => {
    await expect(page.getByTestId("breadcrumb")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  test("displays breadcrumb items", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Annual reports" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "2019", current: "page" }),
    ).toBeVisible();
  });

  test("can be located by getByLabel", async ({ page }) => {
    const nav = page.getByLabel("Breadcrumb");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });
});
