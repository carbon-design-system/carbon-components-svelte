import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function edges(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return { left: box.x, right: box.x + box.width };
}

test.describe("OverflowMenu at an edge", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/overflow-menu-edge.html");
  });

  for (const name of ["Row actions", "Portal row actions"]) {
    test(`${name}: lines up with the button's end at the window edge`, async ({
      page,
    }) => {
      const button = page.getByRole("button", { name, exact: true });
      await button.click();
      const menu = page.getByRole("menu", { name, exact: true });
      await expect(menu).toBeVisible();

      const [buttonBox, menuBox] = await Promise.all([
        edges(button),
        edges(menu),
      ]);
      const width = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(menuBox.right).toBe(buttonBox.right);
      expect(menuBox.left).toBeGreaterThanOrEqual(0);
      expect(menuBox.right).toBeLessThanOrEqual(width);
    });
  }

  // Before, the clipped menu moved to a portal and ran past the card.
  test("flips inside a box that clips it instead of moving to a portal", async ({
    page,
  }) => {
    const card = page.getByTestId("card");
    const button = card.getByRole("button", { name: "Card actions" });
    await button.click();
    const menu = card.getByRole("menu", { name: "Card actions" });
    await expect(menu).toBeVisible();

    const [buttonBox, menuBox] = await Promise.all([
      edges(button),
      edges(menu),
    ]);
    expect(menuBox.right).toBe(buttonBox.right);
  });

  for (const [name, side] of [
    ["Centered actions", "left"],
    ["Centered flipped actions", "right"],
  ] as const) {
    test(`${name}: keeps its alignment when it fits`, async ({ page }) => {
      const button = page.getByRole("button", { name, exact: true });
      await button.click();
      const menu = page.getByRole("menu", { name, exact: true });
      await expect(menu).toBeVisible();

      const [buttonBox, menuBox] = await Promise.all([
        edges(button),
        edges(menu),
      ]);
      expect(menuBox[side]).toBe(buttonBox[side]);
    });
  }
});
