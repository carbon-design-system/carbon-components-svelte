import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The menu fits its alignment a frame after it opens (`fitIntrinsicAlign`),
// so read its box once that frame has run.
async function openMenu(page: Page, trigger: string) {
  const button = page.getByRole("button", { name: trigger });
  await button.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  const [b, m] = await Promise.all([button.boundingBox(), menu.boundingBox()]);
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  if (!b || !m) throw new Error("no layout");
  return { b, m, width };
}

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

// The menu trigger sits at the group's inline end, so the trigger's inline
// end edge is the group's.
for (const dir of ["ltr", "rtl"] as const) {
  test.describe(`ComboButton menu alignment (${dir})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/combo-button.html");
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, dir);
    });

    test("with room, the menu lines up with the group's inline end", async ({
      page,
    }) => {
      const { b, m } = await openMenu(page, "Additional actions");
      if (dir === "ltr")
        expect(Math.abs(m.x + m.width - (b.x + b.width))).toBeLessThan(1);
      else expect(Math.abs(m.x - b.x)).toBeLessThan(1);
    });

    test("at the window's side, the menu stays in the window", async ({
      page,
    }) => {
      const { b, m, width } = await openMenu(page, "More export actions");
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x + m.width).toBeLessThanOrEqual(width);
      // It lines up with the trigger's inline start edge instead.
      if (dir === "ltr") expect(Math.abs(m.x - b.x)).toBeLessThan(1);
      else expect(Math.abs(m.x + m.width - (b.x + b.width))).toBeLessThan(1);
    });
  });
}
