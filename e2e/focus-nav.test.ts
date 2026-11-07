import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const toolbar = (page: Page) => page.getByRole("toolbar");
const list = (page: Page) => page.getByRole("listbox");
const bigGrid = (page: Page) => page.getByTestId("grid").getByRole("grid");
const smallGrid = (page: Page) => page.getByTestId("small").getByRole("grid");

/** The text of the cell `aria-activedescendant` names, or null if it names nothing mounted. */
function activeCell(page: Page) {
  return bigGrid(page).evaluate((grid) => {
    const id = grid.getAttribute("aria-activedescendant");
    return id
      ? (document.getElementById(id)?.textContent?.trim() ?? null)
      : null;
  });
}

/** Whether the element lies inside its scrolling ancestor, not just in the DOM. */
function insideScroller(target: Locator) {
  return target.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const scroller = node.closest(".scroller")?.getBoundingClientRect();
    return (
      !!scroller &&
      box.top >= scroller.top - 1 &&
      box.bottom <= scroller.bottom + 1
    );
  });
}

test.describe("focusNav", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus-nav.html");
    await expect(toolbar(page)).toBeVisible();
  });

  test.describe("toolbar (roving tabindex)", () => {
    test("is one tab stop and skips a disabled cluster", async ({ page }) => {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Bold" })).toBeFocused();

      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("button", { name: "Italic" })).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(
        page.getByRole("button", { name: "Underline" }),
      ).toBeFocused();
      // Strike, Code and Link are disabled.
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("button", { name: "Quote" })).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(
        page.getByRole("button", { name: "Underline" }),
      ).toBeFocused();

      // Tab leaves the toolbar from the active button, and Shift+Tab returns to it.
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("after-toolbar")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "Underline" }),
      ).toBeFocused();
    });

    test("wraps, and Home and End go to the ends", async ({ page }) => {
      await page.getByRole("button", { name: "Bold" }).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByRole("button", { name: "Clear" })).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("button", { name: "Bold" })).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.getByRole("button", { name: "Clear" })).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.getByRole("button", { name: "Bold" })).toBeFocused();
    });

    test("swaps Left and Right in RTL", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      await page.getByRole("button", { name: "Bold" }).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.getByRole("button", { name: "Italic" })).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("button", { name: "Bold" })).toBeFocused();
      // Right is backward in RTL, so it wraps from the first to the last.
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("button", { name: "Clear" })).toBeFocused();
    });
  });

  test.describe("ten thousand options (roving tabindex, mount on demand)", () => {
    test("windows the DOM and focuses an option that was not mounted", async ({
      page,
    }) => {
      const options = list(page).getByRole("option");
      expect(await options.count()).toBeLessThan(40);

      await options.first().focus();
      await page.keyboard.press("End");
      const last = page.locator("#o-9999");
      await expect(last).toBeFocused();
      await expect(last).toHaveAttribute("aria-posinset", "10000");
      expect(await insideScroller(last)).toBe(true);
      expect(await options.count()).toBeLessThan(40);

      await page.keyboard.press("Home");
      await expect(page.locator("#o-0")).toBeFocused();
      await expect
        .poll(() => list(page).evaluate((el) => el.scrollTop))
        .toBe(0);
    });

    test("pages by a viewport of options", async ({ page }) => {
      await list(page).getByRole("option").first().focus();
      await page.keyboard.press("PageDown");
      await expect(page.locator("#o-8")).toBeFocused();
      await page.keyboard.press("PageDown");
      await expect(page.locator("#o-16")).toBeFocused();
      await page.keyboard.press("PageUp");
      await expect(page.locator("#o-8")).toBeFocused();
    });

    test("typeahead jumps to a far option, then through its matches", async ({
      page,
    }) => {
      await list(page).getByRole("option").first().focus();
      await page.keyboard.press("m");
      // 385 options per letter: M is the 13th block.
      const first = page.locator("#o-4620");
      await expect(first).toBeFocused();
      await expect(first).toHaveText("M option 4621");
      expect(await insideScroller(first)).toBe(true);

      // A longer prefix stays where it is.
      await page.keyboard.type(" ");
      await expect(first).toBeFocused();
    });

    test("keeps the active option mounted as the tab stop after scrolling away", async ({
      page,
    }) => {
      await list(page).getByRole("option").first().focus();
      await page.keyboard.press("PageDown");
      await expect(page.locator("#o-8")).toBeFocused();
      await list(page).evaluate((el) => {
        el.scrollTop = 200_000;
      });
      await expect(list(page).locator("#o-8")).toHaveAttribute("tabindex", "0");
      await expect(list(page).locator("#o-8")).toHaveCount(1);
    });
  });

  test.describe("ten thousand cells (aria-activedescendant)", () => {
    test("keeps focus on the grid and points at a mounted cell", async ({
      page,
    }) => {
      await bigGrid(page).focus();
      await page.keyboard.press("ArrowDown");
      await expect(bigGrid(page)).toBeFocused();
      expect(await activeCell(page)).toBe("0");

      await page.keyboard.press("ArrowRight");
      expect(await activeCell(page)).toBe("1");
      await page.keyboard.press("ArrowDown");
      expect(await activeCell(page)).toBe("11");
      await page.keyboard.press("End");
      expect(await activeCell(page)).toBe("19");
      await page.keyboard.press("Home");
      expect(await activeCell(page)).toBe("10");
    });

    test("Ctrl+End mounts the last cell before pointing at it", async ({
      page,
    }) => {
      await bigGrid(page).focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Control+End");
      await expect.poll(() => activeCell(page)).toBe("9999");
      await expect(page.locator("#g-9999")).toBeVisible();
      expect(await insideScroller(page.locator("#g-9999"))).toBe(true);
      expect(await page.locator("[role=gridcell]").count()).toBeLessThan(200);

      await page.keyboard.press("Control+Home");
      await expect.poll(() => activeCell(page)).toBe("0");
    });

    test("never names a cell that is not in the DOM, under mixed keys and scrolling", async ({
      page,
    }) => {
      await bigGrid(page).focus();
      await page.keyboard.press("ArrowDown");
      const keys = [
        "PageDown",
        "PageDown",
        "ArrowRight",
        "End",
        "PageUp",
        "Control+ArrowDown",
        "ArrowUp",
        "Control+ArrowUp",
        "Control+End",
        "ArrowLeft",
        "PageUp",
        "Home",
      ];
      for (const key of keys) {
        await page.keyboard.press(key);
        // Resolve right after the key, then again once renders have settled.
        const now = await bigGrid(page).evaluate((grid) => {
          const id = grid.getAttribute("aria-activedescendant");
          return id === null || document.getElementById(id) !== null;
        });
        expect(now, `after ${key}`).toBe(true);
      }
      await expect.poll(() => activeCell(page)).not.toBeNull();

      // Scrolling the cell away with the wheel keeps it mounted.
      await bigGrid(page).evaluate((grid) => {
        grid.scrollTop = 0;
      });
      await bigGrid(page).evaluate((grid) => {
        grid.scrollTop = 300_000;
      });
      expect(await activeCell(page)).not.toBeNull();
    });

    test("holds up under a held arrow key", async ({ page }) => {
      await bigGrid(page).focus();
      await page.keyboard.press("ArrowDown");
      const started = Date.now();
      for (let i = 0; i < 100; i++) await page.keyboard.press("ArrowDown");
      const elapsed = Date.now() - started;
      // 100 rows down from row 0 is cell 1000, whatever the speed.
      await expect.poll(() => activeCell(page)).toBe("1000");
      expect(await page.locator("[role=gridcell]").count()).toBeLessThan(200);
      expect(elapsed).toBeLessThan(20_000);
    });

    test("swaps Left and Right in RTL, and keeps Up and Down", async ({
      page,
    }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      await bigGrid(page).focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      expect(await activeCell(page)).toBe("10");
      await page.keyboard.press("ArrowLeft");
      expect(await activeCell(page)).toBe("11");
      await page.keyboard.press("ArrowRight");
      expect(await activeCell(page)).toBe("10");
    });
  });

  test.describe("small grid (disabled clusters, roving tabindex)", () => {
    test("steps over a disabled run in a row and stays at a disabled column", async ({
      page,
    }) => {
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      // Tab went through the toolbar, the list and the big grid to the small one.
      const cell = (n: number) =>
        smallGrid(page).getByRole("gridcell", { name: `${n}`, exact: true });
      await cell(0).focus();

      await cell(7).focus();
      // 8, 9 and 10 are disabled.
      await page.keyboard.press("ArrowRight");
      await expect(cell(11)).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(cell(7)).toBeFocused();

      // Column 2 below row 0 is disabled all the way down.
      await cell(2).focus();
      await page.keyboard.press("ArrowDown");
      await expect(cell(2)).toBeFocused();
      await page.keyboard.press("Control+ArrowDown");
      await expect(cell(2)).toBeFocused();
    });

    test("Home, End and Ctrl+Home/End land on enabled cells", async ({
      page,
    }) => {
      const cell = (n: number) =>
        smallGrid(page).getByRole("gridcell", { name: `${n}`, exact: true });
      await cell(7).focus();
      await page.keyboard.press("Home");
      await expect(cell(6)).toBeFocused();
      await page.keyboard.press("End");
      await expect(cell(11)).toBeFocused();
      await page.keyboard.press("Control+Home");
      await expect(cell(0)).toBeFocused();
      await page.keyboard.press("Control+End");
      await expect(cell(29)).toBeFocused();
    });

    test("swaps Left and Right in RTL", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const cell = (n: number) =>
        smallGrid(page).getByRole("gridcell", { name: `${n}`, exact: true });
      await cell(3).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(cell(4)).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(cell(3)).toBeFocused();
    });

    test("has one tab stop, on the first enabled cell until one is active", async ({
      page,
    }) => {
      const stops = smallGrid(page).locator('[role="gridcell"][tabindex="0"]');
      await expect(stops).toHaveCount(1);
      await expect(stops).toHaveText("0");
    });
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const scan = () => new AxeBuilder({ page }).include("#app").analyze();
    expect((await scan()).violations).toEqual([]);

    await bigGrid(page).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Control+End");
    await expect.poll(() => activeCell(page)).toBe("9999");
    expect((await scan()).violations).toEqual([]);

    await list(page).getByRole("option").first().focus();
    await page.keyboard.press("End");
    await expect(page.locator("#o-9999")).toBeFocused();
    expect((await scan()).violations).toEqual([]);

    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    expect((await scan()).violations).toEqual([]);
  });
});
