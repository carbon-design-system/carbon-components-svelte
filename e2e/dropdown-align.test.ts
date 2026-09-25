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
  }
});
