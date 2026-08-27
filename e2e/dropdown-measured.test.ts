import { expect, test } from "@playwright/test";
import {
  expectMenuReadsContinuously,
  isFullyInView,
  readMenuMetrics,
  readOptionBoxes,
  SLACK,
  scrollToEnd,
  stepDown,
} from "./measured-menu";

const ITEM_COUNT = 300;

test.describe("Dropdown measured item heights", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dropdown-measured.html");
    await page.getByRole("combobox", { name: "Items" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
  });

  test("options render at unequal heights", async ({ page }) => {
    const boxes = await readOptionBoxes(page);
    const heights = new Set(boxes?.options.map((option) => option.height));

    // Without this the rest of the file would pass against a uniform list.
    expect(heights.size).toBeGreaterThan(1);
  });

  test("the scrollbar spans the real length of the list", async ({ page }) => {
    const metrics = await readMenuMetrics(page);

    expect(metrics.clientHeight).toBe(300);
    // 300 wrapped options, most of them several lines tall: far taller than
    // any single assumed row height would have produced.
    expect(metrics.scrollHeight).toBeGreaterThan(ITEM_COUNT * 40);
  });

  test("scrolling to the end reveals the last option in full", async ({
    page,
  }) => {
    await scrollToEnd(page);

    const boxes = await readOptionBoxes(page);
    expect(boxes).not.toBeNull();
    const last = boxes?.options.at(-1);

    expect(last?.text).toContain(`Item ${ITEM_COUNT}`);
    expect(last?.top).toBeGreaterThanOrEqual((boxes?.menu.top ?? 0) - SLACK);
    expect(last?.bottom).toBeLessThanOrEqual((boxes?.menu.bottom ?? 0) + SLACK);
  });

  test("the option list reads continuously, with no gaps or overlaps", async ({
    page,
  }) => {
    await scrollToEnd(page);

    await expectMenuReadsContinuously(page);
  });

  test("stays correctly laid out when option heights change with the menu open", async ({
    page,
  }) => {
    await scrollToEnd(page);
    // What changing browser zoom does to this list: every option grows, and no
    // render pass says so. Zoom itself is browser chrome that no script can
    // reach, and the root font size drives the same rem-sized text through the
    // same shared observer. Doubling it more than doubles every option.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    // Let the resize observation land and any scroll correction settle.
    await page.waitForTimeout(200);

    // Every rendered option still abuts its neighbours, and between them they
    // still fill the menu: no blank band, no options laid over one another, at
    // heights nothing was measured at.
    await expectMenuReadsContinuously(page);
  });

  // Stepping and jumping are scrolled by different things, and only one of
  // them is this component's own arithmetic. A step lands on an option that is
  // already rendered, so `ListBoxMenu`'s highlight cursor scrolls it exactly,
  // from its real box. A jump lands on one that is not rendered yet, which the
  // cursor has no node for, so the measured path has to carry it. Both cases
  // need a test or the division of labour drifts unnoticed.
  test("arrowing one option at a time keeps each highlight in view", async ({
    page,
  }) => {
    const field = page.getByRole("combobox", { name: "Items" });
    const highlighted = page.locator(".bx--list-box__menu-item--highlighted");
    await page.waitForTimeout(200);

    // Far enough to walk past the bottom edge several times over, through
    // options of all three heights.
    const outOfView: number[] = [];
    for (let step = 0; step < 12; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: a step has to land before the next is judged
      const inView = await stepDown(page, field, highlighted);
      if (inView !== true) outOfView.push(step);
    }

    expect(outOfView).toEqual([]);
  });

  test("arrowing to the end of the list keeps the option in view", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Items" }).press("End");

    const highlighted = page.locator(".bx--list-box__menu-item--highlighted");
    await expect(highlighted).toHaveCount(1);
    await expect(highlighted).toContainText(`Item ${ITEM_COUNT}`);

    // The settled position is what is being judged. A jump to the end places
    // the option from the heights known at the time and again once the options
    // it landed among have been measured, so the first frame is not yet the
    // answer, and the option is a different element on either side of it.
    await expect(async () => {
      expect(await isFullyInView(highlighted)).toBe(true);
    }).toPass({ timeout: 2000 });
  });
});

test.describe("Dropdown measured item heights, reopened on a selection", () => {
  test("places the selected option in view on open", async ({ page }) => {
    await page.goto("/dropdown-measured.html");

    const field = page.getByRole("combobox", { name: "Items" });
    await field.click();
    await scrollToEnd(page);
    await page.getByRole("option", { name: /Item 300/ }).click();
    await expect(page.getByRole("listbox")).toBeHidden();

    await field.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    // Reopening re-measures from nothing, so give the placement a chance to
    // settle on the measured position rather than the estimated one.
    await page.waitForTimeout(200);

    const selected = page.locator('[role="option"][aria-selected="true"]');
    await expect(selected).toHaveCount(1);

    expect(await isFullyInView(selected)).toBe(true);
  });
});
