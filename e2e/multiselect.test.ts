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

  test("opens with Enter and closes with Escape", async ({ page }) => {
    const trigger = page.getByTestId("multiselect-fruits");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("option", { name: "Apple" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("option", { name: "Apple" })).not.toBeVisible();
  });

  test("ArrowDown and Enter toggle option selection", async ({ page }) => {
    const trigger = page.getByTestId("multiselect-fruits");
    await trigger.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected-count")).toContainText("1");
  });
});
