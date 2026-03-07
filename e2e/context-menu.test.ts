import { expect, test } from "@playwright/test";

test.describe("ContextMenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/context-menu.html");
  });

  test("opens on right-click", async ({ page }) => {
    await page.getByTestId("context-target").click({ button: "right" });

    await expect(page.getByText("Option 1")).toBeVisible();
    await expect(page.getByText("Option 2")).toBeVisible();
  });

  test("displays menu options", async ({ page }) => {
    await page.getByTestId("context-target").click({ button: "right" });

    await expect(page.getByText("Option 1")).toBeVisible();
    await expect(page.getByText("Option 2")).toBeVisible();
  });
});
