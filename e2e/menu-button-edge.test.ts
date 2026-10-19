import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A MenuButton's menu aligns to the button's inline start edge, and to its
// other edge when that would run past the window's side. The edge fixture's
// button sits at the window's inline end: the right in LTR, the left in RTL.
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
  if (!b || !m) throw new Error("no layout");
  return { b, m, width };
}

for (const dir of ["ltr", "rtl"] as const) {
  test.describe(dir, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 600 });
      await page.goto("/menu-button-edge.html");
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, dir);
    });

    test("at the window's side, the menu stays in the window", async ({
      page,
    }) => {
      const { b, m, width } = await openMenu(page, "edge", "Export");
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x + m.width).toBeLessThanOrEqual(width);
      // It lines up with the button's inline end edge instead.
      if (dir === "ltr")
        expect(Math.abs(m.x + m.width - (b.x + b.width))).toBeLessThan(1);
      else expect(Math.abs(m.x - b.x)).toBeLessThan(1);
    });

    test("with room, the menu keeps the button's start edge", async ({
      page,
    }) => {
      const { b, m } = await openMenu(page, "middle", "Share");
      if (dir === "ltr") expect(Math.abs(m.x - b.x)).toBeLessThan(1);
      else expect(Math.abs(m.x + m.width - (b.x + b.width))).toBeLessThan(1);
    });
  });
}
