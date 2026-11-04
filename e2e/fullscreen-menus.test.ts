import { expect, test } from "./helpers/host";

test.describe("menus inside a fullscreen element", () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "fullscreen is checked on Chromium");
    await page.goto("/fullscreen-menus.html");
    await page.getByTestId("enter-fullscreen").click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(true);
  });

  for (const [name, item] of [
    ["Actions", "Cut"],
    ["Additional actions", "Save as"],
    ["Options", "Edit"],
  ] as const) {
    test(`${name} menu is hit-testable in fullscreen`, async ({ page }) => {
      await page
        .getByTestId("stage")
        .getByRole("button", { name })
        .first()
        .click();
      const menuitem = page.getByRole("menuitem", { name: item });
      await expect(menuitem).toBeVisible();
      const hit = await menuitem.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return !!top && el.contains(top);
      });
      expect(hit).toBe(true);
    });
  }
});
