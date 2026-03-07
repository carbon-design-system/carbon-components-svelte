import { expect, test } from "@playwright/test";

test.describe("ContentSwitcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/content-switcher.html");
  });

  test("renders switches", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "First" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Second" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Third" })).toBeVisible();
  });

  test("selects switch on click", async ({ page }) => {
    await page.getByRole("tab", { name: "Second" }).click();
    await expect(page.getByTestId("selected-index")).toContainText("1");
  });

  test("can be located by data-testid", async ({ page }) => {
    const switcher = page.getByTestId("content-switcher");
    await expect(switcher).toBeVisible();
    await switcher.getByRole("tab", { name: "Third" }).click();
    await expect(page.getByTestId("selected-index")).toContainText("2");
  });

  test("first switch is selected by default", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "First" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
