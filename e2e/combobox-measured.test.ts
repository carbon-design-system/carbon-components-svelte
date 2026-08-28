import { expect, type Page, test } from "@playwright/test";
import {
  expectMenuReadsContinuously,
  filterBy,
  hoverBottomEdge,
  isFullyInView,
  readMenuMetrics,
  readMenuScrollTop,
  readOptionBoxes,
  SLACK,
  scrollToEnd,
  stepDown,
} from "./measured-menu";

const ITEM_COUNT = 300;
/** Options matching either tag: half the list, still above the threshold. */
const MATCH_COUNT = ITEM_COUNT / 2;

function field(page: Page) {
  return page.getByRole("combobox", { name: "Items" });
}

test.describe("ComboBox measured item heights", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/combobox-measured.html");
    await field(page).click();
    await expect(page.getByRole("listbox")).toBeVisible();
  });

  test("hovering the option the bottom edge cuts off leaves the menu alone", async ({
    page,
  }) => {
    const held = await readMenuScrollTop(page);

    await hoverBottomEdge(page);
    await page.waitForTimeout(200);

    // The pointer highlights whatever it lands on. Bringing a clipped option
    // fully into view would scroll the list out from under the reader.
    expect(await readMenuScrollTop(page)).toBe(held);
  });
  test("options render at unequal heights while filtered", async ({ page }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);

    const boxes = await readOptionBoxes(page);
    const heights = new Set(boxes?.options.map((option) => option.height));

    // Without this the rest of the file would pass against a uniform list.
    expect(heights.size).toBeGreaterThan(1);
  });

  test("the scrollbar spans the real length of the matching options", async ({
    page,
  }) => {
    const unfiltered = await readMenuMetrics(page);

    await filterBy(page, field(page), "Even", MATCH_COUNT);
    const filtered = await readMenuMetrics(page);

    expect(filtered.clientHeight).toBe(300);
    // Taller than any single assumed row height would have produced, and
    // shorter than the whole list: the scrollbar describes the matches alone.
    expect(filtered.scrollHeight).toBeGreaterThan(MATCH_COUNT * 40);
    expect(filtered.scrollHeight).toBeLessThan(unfiltered.scrollHeight);
  });

  test("scrolling a filtered list to the end reveals the last match in full", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    await scrollToEnd(page);

    // The end being the real end rather than the one a single assumed row
    // height would have put there: the scrollbar has to account for the whole
    // length of the matches before arriving at it means anything.
    const metrics = await readMenuMetrics(page);
    expect(metrics.scrollHeight).toBeGreaterThan(MATCH_COUNT * 40);

    const boxes = await readOptionBoxes(page);
    expect(boxes).not.toBeNull();
    const last = boxes?.options.at(-1);

    // The last *matching* option, one of the tallest, wholly inside the menu.
    expect(last?.text).toContain(`Even item ${ITEM_COUNT}`);
    expect(last?.top).toBeGreaterThanOrEqual((boxes?.menu.top ?? 0) - SLACK);
    expect(last?.bottom).toBeLessThanOrEqual((boxes?.menu.bottom ?? 0) + SLACK);
  });

  test("a filtered list reads continuously, with no gaps or overlaps", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    await scrollToEnd(page);

    await expectMenuReadsContinuously(page);
  });

  test("no offsets survive a filter that changes which options match", async ({
    page,
  }) => {
    // Measure one tag's options to the end of the list, then switch tags. Every
    // height now held describes an option that is no longer at that position.
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    await scrollToEnd(page);

    await filterBy(page, field(page), "Odd", MATCH_COUNT);

    await expectMenuReadsContinuously(page);
    await scrollToEnd(page);
    const boxes = await readOptionBoxes(page);
    expect(boxes?.options.at(-1)?.text).toContain(`Odd item ${ITEM_COUNT - 1}`);
  });

  test("clearing the filter restores the offsets of the whole list", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    const filtered = await readMenuMetrics(page);
    await scrollToEnd(page);
    await filterBy(page, field(page), "", ITEM_COUNT);

    // Well clear of the half-list the filter had narrowed to. Comparing
    // against the reading taken before the filter would prove less than it
    // looks: both are dominated by the estimate for options nobody has
    // scrolled to yet. Reaching the whole list's true last option below is
    // what actually settles it.
    expect((await readMenuMetrics(page)).scrollHeight).toBeGreaterThan(
      filtered.scrollHeight * 1.5,
    );
    await expectMenuReadsContinuously(page);
    await scrollToEnd(page);
    const boxes = await readOptionBoxes(page);
    expect(boxes?.options.at(-1)?.text).toContain(`Even item ${ITEM_COUNT}`);
  });

  // Stepping and jumping are scrolled by different things, and only one of
  // them is this component's own arithmetic. A step lands on an option that is
  // already rendered, so `ListBoxMenu`'s highlight cursor scrolls it exactly,
  // from its real box. A jump lands on one that is not rendered yet, which the
  // cursor has no node for, so the measured path has to carry it. Under a
  // filter both run against heights measured moments earlier for a set of
  // options that had only just come into being.
  test("arrowing through a filtered list scrolls each option fully into view", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);

    const highlighted = page.locator(".bx--list-box__menu-item--highlighted");

    // Far enough to walk past the bottom edge several times over, one option at
    // a time, through matches of all three heights.
    const outOfView: number[] = [];
    for (let step = 0; step < 14; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: a step has to land before the next is judged
      const inView = await stepDown(page, field(page), highlighted);
      if (inView !== true) outOfView.push(step);
    }
    expect(outOfView).toEqual([]);

    await field(page).press("End");
    await expect(highlighted).toContainText(`Even item ${ITEM_COUNT}`);
    expect(await isFullyInView(highlighted)).toBe(true);
  });

  test("filtering down to a single match shows it whole", async ({ page }) => {
    await filterBy(page, field(page), `item ${ITEM_COUNT}`, 1);

    const options = page.getByRole("option");
    await expect(options).toHaveCount(1);
    await expect(options).toContainText(`Even item ${ITEM_COUNT}`);
    expect(await isFullyInView(options)).toBe(true);
  });

  test("filtering down to no matches leaves an empty menu that recovers", async ({
    page,
  }) => {
    await field(page).fill("no such option");

    await expect(page.getByRole("option")).toHaveCount(0);
    // Still mounted, though an empty menu has nothing to give it a height.
    await expect(page.getByRole("listbox")).toBeAttached();

    // The menu comes back correct rather than stuck at the empty list's
    // offsets, which is the part an empty set could quietly break.
    await filterBy(page, field(page), "Even", MATCH_COUNT);

    await expectMenuReadsContinuously(page);
    await scrollToEnd(page);
    const boxes = await readOptionBoxes(page);
    expect(boxes?.options.at(-1)?.text).toContain(`Even item ${ITEM_COUNT}`);
  });

  test("selecting a filtered option keeps the field and menu consistent", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    await scrollToEnd(page);

    await page
      .getByRole("option", {
        name: new RegExp(`Even item ${ITEM_COUNT}`),
      })
      .click();

    await expect(page.getByRole("listbox")).toBeHidden();
    // The field carries the whole label, filler words and all, so this is
    // anchored on the part that names the option rather than repeating it.
    await expect(field(page)).toHaveValue(
      new RegExp(`^Even item ${ITEM_COUNT}\\b`),
    );
  });
});
