import { expect, type Page, test } from "@playwright/test";

// A MenuButton's menu aligns to the button's start edge, and to its other
// edge when that would run past the window's side.
async function openMenu(page: Page, id: string, name: string) {
  const button = page.getByTestId(id).getByRole("button", { name });
  await button.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  const [b, m] = await Promise.all([button.boundingBox(), menu.boundingBox()]);
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  return { b, m, width };
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto("/menu-button-edge.html");
});

test("at the window's right edge, the menu stays in the window", async ({
  page,
}) => {
  const { b, m, width } = await openMenu(page, "edge", "Export");
  expect((m?.x ?? 0) + (m?.width ?? 0)).toBeLessThanOrEqual(width);
  expect(
    Math.abs((m?.x ?? 0) + (m?.width ?? 0) - ((b?.x ?? 0) + (b?.width ?? 0))),
  ).toBeLessThan(1);
});

test("with room, the menu keeps the button's start edge", async ({ page }) => {
  const { b, m } = await openMenu(page, "middle", "Share");
  expect(Math.abs((m?.x ?? 0) - (b?.x ?? 0))).toBeLessThan(1);
});
