import { expect, test } from "@playwright/test";

test.describe("Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tabs.html");
  });

  test("renders tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Tab 1" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tab 2" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tab 3" })).toBeVisible();
  });

  test("switches tab on click", async ({ page }) => {
    await expect(page.getByTestId("tab-content-1")).toBeVisible();

    await page.getByRole("tab", { name: "Tab 2" }).click();
    await expect(page.getByTestId("tab-content-2")).toBeVisible();

    await page.getByRole("tab", { name: "Tab 3" }).click();
    await expect(page.getByTestId("tab-content-3")).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const tabs = page.getByTestId("tabs");
    await expect(tabs).toBeVisible();
    await tabs.getByRole("tab", { name: "Tab 2" }).click();
    await expect(page.getByTestId("tab-content-2")).toBeVisible();
  });

  test("first tab is selected by default", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("ArrowRight switches to next tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Tab 1" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Tab 2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("tab-content-2")).toBeVisible();
  });

  test("ArrowLeft switches to previous tab", async ({ page }) => {
    await page.getByRole("tab", { name: "Tab 2" }).click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByTestId("tab-content-1")).toBeVisible();
  });
});
