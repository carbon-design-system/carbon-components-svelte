import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function openMenu(page: Page, key: string) {
  await page.getByTestId(key).getByRole("combobox").click();
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  const field = await page.getByTestId(key).getByRole("combobox").boundingBox();
  const box = await menu.boundingBox();
  if (!field || !box) throw new Error("missing box");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  return { field, menu: box };
}

// One page load: each case opens its menu, measures it and closes it again.
test("Dropdown menu aligns to its field", async ({ page }) => {
  await page.goto("/dropdown-align.html");

  for (const portal of [false, true]) {
    const prefix = portal ? "portal" : "inline";

    await test.step(`${prefix}: keeps the inline width, left edge on the field`, async () => {
      const { field, menu } = await openMenu(page, `${prefix}-start`);
      expect.soft(menu.width).toBeGreaterThan(field.width);
      expect.soft(menu.width).toBeCloseTo(288, 0);
      expect.soft(menu.x).toBeCloseTo(field.x, 0);
    });

    await test.step(`${prefix}: direction top opens the menu above the field`, async () => {
      const { field, menu } = await openMenu(page, `${prefix}-start-top`);
      expect.soft(menu.y + menu.height).toBeLessThanOrEqual(field.y + 1);
      expect.soft(menu.x).toBeCloseTo(field.x, 0);
    });

    await test.step(`${prefix}: end aligns the menu's right edge to the field`, async () => {
      const { field, menu } = await openMenu(page, `${prefix}-end`);
      expect.soft(menu.width).toBeCloseTo(288, 0);
      expect.soft(menu.x + menu.width).toBeCloseTo(field.x + field.width, 0);
    });

    await test.step(`${prefix}: end combines with direction top`, async () => {
      const { field, menu } = await openMenu(page, `${prefix}-end-top`);
      expect.soft(menu.y + menu.height).toBeLessThanOrEqual(field.y + 1);
      expect.soft(menu.x + menu.width).toBeCloseTo(field.x + field.width, 0);
    });
  }
});
