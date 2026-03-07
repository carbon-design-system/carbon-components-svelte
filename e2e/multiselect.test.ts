import { expect, test } from "@playwright/test";

test.describe("MultiSelect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/multiselect.html");
  });

  test("opens menu on click", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    await expect(page.getByRole("option", { name: "Apple" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Banana" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Cherry" })).toBeVisible();
  });

  test("selects multiple items", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    await page.getByRole("option", { name: "Apple" }).click();
    await page.getByRole("option", { name: "Cherry" }).click();

    await expect(page.getByTestId("selected-count")).toContainText("2");
  });

  test("filters items when filterable", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    const input = page.getByPlaceholder("Filter fruits");
    await input.fill("er");

    await expect(page.getByRole("option", { name: "Cherry" })).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Elderberry" }),
    ).toBeVisible();
    await expect(page.getByRole("option", { name: "Apple" })).not.toBeVisible();
  });

  test("clears selection", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    await page.getByRole("option", { name: "Apple" }).click();
    await expect(page.getByTestId("selected-count")).toContainText("1");

    await page.getByRole("button", { name: /Clear/i }).click();
    await expect(page.getByTestId("selected-count")).not.toBeVisible();
  });
});
