import { expect, test } from "@playwright/test";

test.describe("ToolbarColumnVisibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toolbar-column-visibility.html");
  });

  test("toggling a column keeps the menu open", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Column visibility" });
    await trigger.click();

    const portItem = page.getByRole("menuitemcheckbox", { name: "Port" });
    await expect(portItem).toHaveAttribute("aria-checked", "true");

    await portItem.click();

    await expect(portItem).toHaveAttribute("aria-checked", "false");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("columnheader", { name: "Port" })).toHaveCount(
      0,
    );
  });
});
