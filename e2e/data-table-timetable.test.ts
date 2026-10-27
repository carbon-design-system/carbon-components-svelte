import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function open(page: Page, query = "") {
  await page.goto(`/data-table-timetable.html?${query}`);
  await expect(page.locator("tbody tr").first()).toBeVisible();
}

/**
 * The share of the focused cell the user can see: what the scroll region
 * clips, a pinned column or the sticky header hides does not count.
 */
function visibleShare(page: Page) {
  return page.evaluate(() => {
    const cell = document.activeElement as HTMLElement;
    const box = cell.getBoundingClientRect();
    const port = (
      document.querySelector(".bx--data-table_inner-container") as HTMLElement
    ).getBoundingClientRect();
    const pin = document
      .querySelector("thead .bx--table-column--pinned-start-edge")
      ?.getBoundingClientRect();
    const head = document.querySelector("thead th")?.getBoundingClientRect();
    if (!pin || !head) return 0;
    const rtl = getComputedStyle(cell).direction === "rtl";
    // The pinned cell is what covers the rest, so it only meets the header.
    const pinned = cell.classList.contains("bx--table-column--pinned-start");
    const left = Math.max(box.left, port.left, rtl || pinned ? 0 : pin.right);
    const right = Math.min(
      box.right,
      port.right,
      rtl && !pinned ? pin.left : Number.POSITIVE_INFINITY,
    );
    const top = Math.max(box.top, port.top, head.bottom);
    const bottom = Math.min(box.bottom, port.bottom);
    const visible = Math.max(0, right - left) * Math.max(0, bottom - top);
    return visible / (box.width * box.height);
  });
}

/** The visible share of the focused cell after each of `count` presses of `key`. */
async function walk(page: Page, key: string, count: number) {
  const shares: number[] = [];
  for (let i = 0; i < count; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: each press follows the last
    await page.keyboard.press(key);
    shares.push(await visibleShare(page));
  }
  return shares;
}

async function focusFirstCell(page: Page) {
  await page.locator("tbody td[tabindex='0']").focus();
}

test.describe("DataTable timetable", () => {
  test("highlights the row and column under the pointer", async ({ page }) => {
    await open(page);

    await page.locator("tbody tr:nth-child(3) td:nth-child(4)").hover();

    await expect(
      page.locator("tbody tr.bx--data-table--highlighted-row"),
    ).toHaveCount(1);
    await expect(
      page.locator("thead th.bx--data-table--highlighted-column"),
    ).toHaveText("103");
    await expect(
      page.locator("tbody td.bx--data-table--highlighted-column"),
    ).toHaveCount(24);
    const [row, column, plain] = await page.evaluate(() => {
      const fill = (selector: string) =>
        getComputedStyle(document.querySelector(selector) as Element)
          .backgroundColor;
      return [
        fill("tbody tr:nth-child(3) td:nth-child(2)"),
        fill("tbody tr:nth-child(1) td:nth-child(4)"),
        fill("tbody tr:nth-child(1) td:nth-child(2)"),
      ];
    });
    expect(row).not.toBe(plain);
    expect(column).not.toBe(plain);
  });

  test("shows a focus ring on the focused cell and drives the cross from it", async ({
    page,
  }) => {
    await open(page);
    await focusFirstCell(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");

    const outline = await page.evaluate(
      () => getComputedStyle(document.activeElement as Element).outlineStyle,
    );
    expect(outline).toBe("solid");
    await expect(
      page.locator("tbody tr.bx--data-table--highlighted-row"),
    ).toHaveCount(1);
    await expect(
      page.locator("thead th.bx--data-table--highlighted-column"),
    ).toHaveText("101");
  });

  test("keeps the focused cell clear of the pinned column and the header", async ({
    page,
  }) => {
    await open(page);
    await focusFirstCell(page);

    // Out to the far column, then back across every column to the pin.
    await page.keyboard.press("End");
    expect(await visibleShare(page)).toBe(1);
    expect(await walk(page, "ArrowLeft", 30)).toEqual(Array(30).fill(1));

    // Down to the last row, then back up every row to the header.
    await page.keyboard.press("Control+End");
    expect(await walk(page, "ArrowUp", 23)).toEqual(Array(23).fill(1));
  });

  test("keeps the focused cell clear of the pinned column in RTL", async ({
    page,
  }) => {
    await open(page, "rtl");
    await focusFirstCell(page);

    await page.keyboard.press("End");
    expect(await visibleShare(page)).toBe(1);
    // In RTL the arrow toward the pin is ArrowRight.
    expect(await walk(page, "ArrowRight", 30)).toEqual(Array(30).fill(1));
  });

  test("moves focus by one tab stop and no scroll region", async ({ page }) => {
    await open(page);

    await expect(page.locator("tbody td[tabindex='0']")).toHaveCount(1);
    await expect(
      page.locator(".bx--data-table_inner-container"),
    ).not.toHaveAttribute("tabindex", /.*/);
  });

  test("outlines the focused cell in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await focusFirstCell(page);

    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as Element);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).toBe("solid");
    expect(Number.parseFloat(outline.width)).toBeGreaterThan(0);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page);
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });
});
