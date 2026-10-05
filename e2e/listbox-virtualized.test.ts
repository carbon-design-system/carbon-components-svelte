import { expect, type Locator, type Page, test } from "@playwright/test";

const COMPONENTS = ["Dropdown", "ComboBox", "MultiSelect"] as const;

/**
 * Open the fixture on one pairing. Each URL is a literal, so CI can tell which
 * fixture this suite loads.
 */
const OPEN_FIXTURE = {
  Dropdown: (page: Page, optimizeFastScroll: boolean) =>
    optimizeFastScroll
      ? page.goto(
          "/listbox-virtualized.html?component=Dropdown&optimizeFastScroll",
        )
      : page.goto("/listbox-virtualized.html?component=Dropdown"),
  ComboBox: (page: Page, optimizeFastScroll: boolean) =>
    optimizeFastScroll
      ? page.goto(
          "/listbox-virtualized.html?component=ComboBox&optimizeFastScroll",
        )
      : page.goto("/listbox-virtualized.html?component=ComboBox"),
  MultiSelect: (page: Page, optimizeFastScroll: boolean) =>
    optimizeFastScroll
      ? page.goto(
          "/listbox-virtualized.html?component=MultiSelect&optimizeFastScroll",
        )
      : page.goto("/listbox-virtualized.html?component=MultiSelect"),
};

/** Whether the element is wholly inside its menu's scroll viewport. */
function isFullyInView(option: Locator) {
  return option.evaluate((el) => {
    const menu = el.closest('[role="listbox"]');
    if (!menu) return null;
    const box = el.getBoundingClientRect();
    const menuBox = menu.getBoundingClientRect();
    return box.top >= menuBox.top - 1 && box.bottom <= menuBox.bottom + 1;
  });
}

function readMenuScrollTop(page: Page) {
  return page.getByRole("listbox").evaluate((el) => el.scrollTop);
}

for (const component of COMPONENTS) {
  for (const optimizeFastScroll of [false, true]) {
    test.describe(`${component} virtualized${optimizeFastScroll ? ", optimizeFastScroll" : ""}`, () => {
      test.beforeEach(async ({ page }) => {
        await OPEN_FIXTURE[component](page, optimizeFastScroll);
        await page.getByRole("combobox").click();
        await expect(page.getByRole("listbox")).toBeVisible();
      });

      // The menu is 300px tall with 40px options, so the bottom edge cuts
      // option 7 (280-320px) off. The pointer can only reach what it sees.
      test("hovering a clipped option leaves the menu alone", async ({
        page,
      }) => {
        const box = await page.getByRole("listbox").boundingBox();
        if (!box) throw new Error("menu has no box");

        await page.mouse.move(box.x + 40, box.y + box.height - 2);
        await expect(
          page.locator(".bx--list-box__menu-item--highlighted"),
        ).toHaveText("Item 7");
        await page.waitForTimeout(150);

        expect(await readMenuScrollTop(page)).toBe(0);
      });

      test("arrowing onto a clipped option brings it fully into view", async ({
        page,
      }) => {
        const highlighted = page.locator(
          ".bx--list-box__menu-item--highlighted",
        );

        for (let step = 0; step <= 7; step++) {
          // biome-ignore lint/performance/noAwaitInLoops: each step lands before the next
          await page.keyboard.press("ArrowDown");
          await page.waitForTimeout(30);
        }
        await expect(highlighted).toHaveText("Item 7");
        await page.waitForTimeout(100);

        // Scrolled just far enough to show it, at the bottom edge.
        expect(await readMenuScrollTop(page)).toBe(20);
        expect(await isFullyInView(highlighted)).toBe(true);
      });

      // Keys faster than a frame move the highlight onto options the window
      // has not rendered yet: the menu scrolls, but the window only
      // re-renders on the scroll event, once per frame. The highlight must
      // still end up in view.
      test("arrow keys faster than a frame keep the highlight in view", async ({
        page,
      }) => {
        const highlighted = page.locator(
          ".bx--list-box__menu-item--highlighted",
        );
        await page.keyboard.press("ArrowDown");
        await expect(highlighted).toHaveText("Item 0");

        for (const target of [12, 24, 36, 48, 60, 72, 84, 96, 108, 120]) {
          for (let step = 0; step < 12; step++) {
            // biome-ignore lint/performance/noAwaitInLoops: keys go out in order, without waiting for a frame
            await page.keyboard.press("ArrowDown");
          }
          await expect(highlighted).toHaveText(`Item ${target}`);
          await page.waitForTimeout(100);

          expect(await isFullyInView(highlighted), `Item ${target}`).toBe(true);
        }
      });
    });
  }
}
