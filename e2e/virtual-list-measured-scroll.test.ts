import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** The row at the top of the viewport: its index and its offset from the top. */
function readAnchorRow(list: Locator) {
  return list.evaluate((el) => {
    const box = el.getBoundingClientRect();
    for (const row of el.querySelectorAll<HTMLElement>("[data-row]")) {
      const top = row.getBoundingClientRect().top - box.top;
      if (top >= 0) return { index: Number(row.dataset.row), top };
    }
    return null;
  });
}

/** Where row `index` sits from the viewport's top, or null if not rendered. */
function readRowTop(list: Locator, index: number) {
  return list.evaluate((el, index) => {
    const row = el.querySelector(`[data-row="${index}"]`);
    if (!row) return null;
    return row.getBoundingClientRect().top - el.getBoundingClientRect().top;
  }, index);
}

test.describe("VirtualList measured", () => {
  test("rows stay put while rows above them are measured", async ({ page }) => {
    await page.goto("/virtual-list-measured-scroll.html");
    const list = page.getByTestId("list");
    await expect(list).toBeVisible();

    await list.evaluate((el) => {
      el.scrollTop = 20000;
    });
    await page.waitForTimeout(300);

    const step = 25;
    for (let i = 0; i < 40; i++) {
      const anchor = await readAnchorRow(list);
      if (!anchor) throw new Error("no row in view");
      await list.evaluate((el, step) => {
        el.scrollTop -= step;
      }, step);
      await page.waitForTimeout(120);
      const top = await readRowTop(list, anchor.index);
      // The reader moved up by `step`; the row they were looking at moves
      // down by the same, whatever the rows above it measure.
      expect(top, `step ${i}, row ${anchor.index}`).toBeCloseTo(
        anchor.top + step,
        0,
      );
    }
  });
});
