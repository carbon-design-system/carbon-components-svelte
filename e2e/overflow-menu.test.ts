import { expect, test } from "@playwright/test";

test.describe("OverflowMenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/overflow-menu.html");
  });

  test("opens menu on click", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();

    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Action 2" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Action 3" }),
    ).toBeVisible();
  });

  test("selects menu item", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Action 2" }).click();

    await expect(page.getByTestId("selected-action")).toContainText("Action 2");
  });

  test("closes on outside click", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();

    await page.getByTestId("outside-area").click();

    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).not.toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const trigger = page.getByTestId("overflow-menu");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
  });

  test("opens menu with Enter key", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
  });

  test("closes menu with Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).not.toBeVisible();
  });

  test("focus returns to trigger after Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
});
