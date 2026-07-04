import { expect, test } from "@playwright/test";

test.describe("ComboButton", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/combo-button.html");
  });

  test("fires the primary action independently of the menu trigger", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("primary-clicks")).toContainText("1");
    await expect(page.getByRole("menu")).not.toBeVisible();
  });

  test("opens the menu from the trigger and focuses the first item", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Additional actions" }).click();

    await expect(page.getByRole("menuitem", { name: "Save as" })).toBeFocused();
  });

  test("selects a menu item", async ({ page }) => {
    await page.getByRole("button", { name: "Additional actions" }).click();
    await page.getByRole("menuitem", { name: "Save a copy" }).click();

    await expect(page.getByTestId("selected-action")).toContainText(
      "Save a copy",
    );
    await expect(page.getByRole("menu")).not.toBeVisible();
  });

  test("aligns the menu to the right edge of the trigger group", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Additional actions" }).click();

    const triggerBox = await page
      .getByRole("button", { name: "Additional actions" })
      .boundingBox();
    const menuBox = await page.getByRole("menu").boundingBox();

    expect(Math.round(menuBox.x + menuBox.width)).toBe(
      Math.round(triggerBox.x + triggerBox.width),
    );
  });

  test("does not leave the trigger focused after closing it with a mouse click", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Additional actions" });
    await trigger.click();
    await trigger.click();

    await expect(trigger).not.toBeFocused();
  });

  test("keeps the trigger focused after closing it with the keyboard", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Additional actions" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    // dismiss.js defers registering its window listeners (including this
    // Escape handler) past the enabling keypress by a macrotask (setTimeout),
    // so the menu already being visible isn't enough - that happens
    // synchronously, before the deferred registration runs. Wait past that
    // macrotask boundary, or Escape can race the registration and be dropped.
    await page.waitForTimeout(50);
    await page.keyboard.press("Escape");

    await expect(trigger).toBeFocused();
  });
});
