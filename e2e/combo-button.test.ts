import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The menu fits its alignment a frame after it opens (`fitIntrinsicAlign`),
// and the portal moves a frame after that. Read the boxes once the menu has
// held still for a frame.
async function openMenu(page: Page, id: string) {
  const group = page.getByTestId(id);
  await group.locator(".bx--combo-button__trigger").click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await menu.evaluate(
    (node) =>
      new Promise<void>((resolve) => {
        let prev = "";
        const check = () => {
          const { left, width } = node.getBoundingClientRect();
          const box = `${left},${width}`;
          if (box === prev) resolve();
          else {
            prev = box;
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      }),
  );
  const [g, m] = await Promise.all([group.boundingBox(), menu.boundingBox()]);
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  if (!g || !m) throw new Error("no layout");
  return { g, m, width };
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

// The menu lines up with the whole button group, not the chevron, as in
// Carbon React. With room, `start` and `end` are the group's inline sides.
// At a side of the window, every alignment takes the group edge on that
// side, so the menu stays in the window.
const cases = (["start", "center", "end"] as const).flatMap((align) =>
  (["room", "inline-start", "inline-end"] as const).map(
    (where) => [align, where] as const,
  ),
);

for (const dir of ["ltr", "rtl"] as const) {
  test(`ComboButton menu lines up with the group (${dir})`, async ({
    page,
  }) => {
    await page.goto("/combo-button.html");
    await page.evaluate((dir) => {
      document.documentElement.dir = dir;
    }, dir);
    await page.evaluate(() => document.fonts.ready);

    for (const [align, where] of cases) {
      const name = `${align}, ${where}`;
      // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
      const { g, m, width } = await openMenu(page, `${align}-${where}`);
      const left = Math.abs(m.x - g.x);
      const right = Math.abs(m.x + m.width - (g.x + g.width));
      const center = Math.abs(m.x + m.width / 2 - (g.x + g.width / 2));

      if (where === "room") {
        const side =
          align === "center"
            ? center
            : (align === "start") === (dir === "ltr")
              ? left
              : right;
        expect.soft(side, name).toBeLessThan(1);
      } else {
        expect
          .soft(m.width, `${name}: menu wider than the group`)
          .toBeGreaterThan(g.width);
        expect.soft(m.x, name).toBeGreaterThanOrEqual(0);
        expect.soft(m.x + m.width, name).toBeLessThanOrEqual(width);
        const atLeftEdge = (where === "inline-start") === (dir === "ltr");
        expect.soft(atLeftEdge ? left : right, name).toBeLessThan(1);
      }

      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toBeHidden();
    }
  });
}
