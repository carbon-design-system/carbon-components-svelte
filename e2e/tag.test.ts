import { expect, test } from "@playwright/test";

test.describe("Tag", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tag.html");
  });

  test("renders tag", async ({ page }) => {
    await expect(page.getByText("Carbon")).toBeVisible();
    await expect(page.getByText("Static tag")).toBeVisible();
  });

  test("filterable tag has close button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Clear filter" }),
    ).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const tag = page.getByTestId("tag-filter");
    await expect(tag).toBeVisible();
    await expect(tag).toContainText("Carbon");
  });

  test("close button removes filterable tag", async ({ page }) => {
    await expect(page.getByTestId("tag-filter")).toBeVisible();

    await page.getByRole("button", { name: "Clear filter" }).click();

    await expect(page.getByTestId("tag-filter")).not.toBeVisible();
  });
});
