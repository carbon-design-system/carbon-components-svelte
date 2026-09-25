import { expect, type Page, test } from "@playwright/test";

async function openMenu(page: Page, key: string) {
  await page.getByTestId(key).getByRole("combobox").click();
  const menu = page.getByRole("listbox");
  await expect(menu).toBeVisible();
  const field = await page.getByTestId(key).getByRole("combobox").boundingBox();
  const box = await menu.boundingBox();
  if (!field || !box) throw new Error("missing box");
  return { field, menu: box };
}

test.describe("Dropdown menu alignment", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dropdown-align.html");
  });

  for (const portal of [false, true]) {
    const prefix = portal ? "portal" : "inline";

    test(`${prefix}: keeps the inline width, left edge on the field`, async ({
      page,
    }) => {
      const { field, menu } = await openMenu(page, `${prefix}-start`);
      expect(menu.width).toBeGreaterThan(field.width);
      expect(menu.width).toBeCloseTo(288, 0);
      expect(menu.x).toBeCloseTo(field.x, 0);
    });

    test(`${prefix}: direction top opens the menu above the field`, async ({
      page,
    }) => {
      const { field, menu } = await openMenu(page, `${prefix}-start-top`);
      expect(menu.y + menu.height).toBeLessThanOrEqual(field.y + 1);
      expect(menu.x).toBeCloseTo(field.x, 0);
    });

    test(`${prefix}: end aligns the menu's right edge to the field`, async ({
      page,
    }) => {
      const { field, menu } = await openMenu(page, `${prefix}-end`);
      expect(menu.width).toBeCloseTo(288, 0);
      expect(menu.x + menu.width).toBeCloseTo(field.x + field.width, 0);
    });

    test(`${prefix}: end combines with direction top`, async ({ page }) => {
      const { field, menu } = await openMenu(page, `${prefix}-end-top`);
      expect(menu.y + menu.height).toBeLessThanOrEqual(field.y + 1);
      expect(menu.x + menu.width).toBeCloseTo(field.x + field.width, 0);
    });
  }
});
