import { expect, test } from "@playwright/test";

test.describe("MenuButton", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/menu-button.html");
  });

  test("opens menu on trigger click and focuses the first item", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Actions" }).click();

    await expect(page.getByRole("menuitem", { name: "Cut" })).toBeFocused();
  });

  test("selects a menu item", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Copy" }).click();

    await expect(page.getByTestId("selected-action")).toContainText("Copy");
  });

  test("opens and stays open when triggered by an external control", async ({
    page,
  }) => {
    // Regression: the click that flips `open` to true from outside the
    // trigger must not be read as an "outside click" against itself,
    // closing the menu it just opened.
    await page.getByTestId("open-externally").click();

    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cut" })).toBeVisible();
  });

  test("closes on outside click", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();

    await page.getByTestId("open-externally").click();

    await expect(page.getByRole("menu")).not.toBeVisible();
  });

  test("does not leave the trigger focused after closing it with a mouse click", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.click();
    await trigger.click();

    await expect(trigger).not.toBeFocused();
  });

  test("keeps the trigger focused after closing it with the keyboard", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
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

  test.describe("submenu", () => {
    test("opens on click without closing the root menu", async ({ page }) => {
      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Export as" }).click();

      await expect(page.getByRole("menuitem", { name: "PDF" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "Cut" })).toBeVisible();
    });

    test("opens on hover after a delay and stays open when the pointer moves into it", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Export as" }).hover();

      await expect(page.getByRole("menuitem", { name: "PDF" })).toBeVisible();

      await page.getByRole("menuitem", { name: "PDF" }).hover();
      await page.waitForTimeout(300);

      await expect(page.getByRole("menuitem", { name: "PDF" })).toBeVisible();
    });

    test("ArrowRight opens and focuses the first item; ArrowLeft closes and refocuses the parent", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Actions" }).click();
      const parent = page.getByRole("menuitem", { name: "Export as" });
      await parent.focus();

      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("menuitem", { name: "PDF" })).toBeFocused();

      await page.keyboard.press("ArrowLeft");
      await expect(
        page.getByRole("menuitem", { name: "PDF" }),
      ).not.toBeVisible();
      await expect(parent).toBeFocused();
    });

    test("selecting a nested item closes the entire menu tree", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Export as" }).click();
      await page.getByRole("menuitem", { name: "JPG" }).click();

      await expect(page.getByTestId("selected-action")).toContainText("JPG");
      await expect(page.getByRole("menu")).not.toBeVisible();
    });

    test("flips to the left when there is no room on the right", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 500, height: 800 });
      await page.addStyleTag({ content: "body { padding-left: 300px; }" });

      await page.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Export as" }).click();

      const parentBox = await page
        .getByRole("menuitem", { name: "Export as" })
        .boundingBox();
      const submenuBox = await page
        .getByRole("menuitem", { name: "PDF" })
        .boundingBox();

      expect(submenuBox.x).toBeLessThan(parentBox.x);
    });
  });
});
