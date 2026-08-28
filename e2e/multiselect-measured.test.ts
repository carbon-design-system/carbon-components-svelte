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
/** Options matching either tag, plus the select-all row that always does. */
const MATCH_COUNT = ITEM_COUNT / 2 + 1;
/** The whole list, select-all row included. */
const TOTAL_COUNT = ITEM_COUNT + 1;

function field(page: Page) {
  return page.getByRole("combobox", { name: "Items" });
}

/** Send the menu to a scroll position and let the offsets settle there. */
async function scrollTo(page: Page, scrollTop: number) {
  await page.getByRole("listbox").evaluate((el, top) => {
    el.scrollTop = top;
  }, scrollTop);
  await page.waitForTimeout(100);
}

/**
 * Click an option that is already wholly inside the menu's viewport.
 *
 * Playwright scrolls a partly-hidden target into view before clicking it, so
 * clicking one of the overscanned options above the fold would move the menu
 * and there would be nothing left to say about whether checking it did.
 */
async function clickOptionInView(page: Page, nth = 0) {
  const boxes = await readOptionBoxes(page);
  expect(boxes).not.toBeNull();
  const inView = (boxes?.options ?? [])
    .map((option, index) => ({ ...option, index }))
    .filter(
      (option) =>
        option.top >= (boxes?.menu.top ?? 0) - SLACK &&
        option.bottom <= (boxes?.menu.bottom ?? 0) + SLACK,
    );
  expect(inView.length).toBeGreaterThan(nth);
  // `readOptionBoxes` orders by position, which for a windowed menu is DOM
  // order, so the index carries straight over.
  await page.getByRole("option").nth(inView[nth].index).click();
  await page.waitForTimeout(100);
}

/** The menu's scroll position and the options on screen at it. */
async function readMenuState(page: Page) {
  const boxes = await readOptionBoxes(page);
  return {
    scrollTop: await page
      .getByRole("listbox")
      .evaluate((el) => Math.round(el.scrollTop)),
    texts: boxes?.options.map((option) => option.text) ?? [],
    tops: boxes?.options.map((option) => Math.round(option.top)) ?? [],
  };
}

type MenuState = Awaited<ReturnType<typeof readMenuState>>;

/**
 * The same options in the same places, give or take `tolerance` pixels.
 *
 * A checked option is a pixel taller than an unchecked one, Carbon giving it a
 * border, so checking really does change the length of the list. Holding the
 * reader's place is the promise, not that no measurement changed: the residual
 * is bounded by that one pixel per option above the viewport, and it moves the
 * whole list together rather than spreading the options apart.
 */
function expectMenuHeld(after: MenuState, before: MenuState, tolerance = 0) {
  expect(after.texts).toEqual(before.texts);
  expect(Math.abs(after.scrollTop - before.scrollTop)).toBeLessThanOrEqual(
    tolerance,
  );
  for (const [index, top] of after.tops.entries()) {
    expect(Math.abs(top - before.tops[index])).toBeLessThanOrEqual(tolerance);
  }
}

test.describe("MultiSelect measured item heights", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/multiselect-measured.html");
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

  test("the select-all row is measured and sits above the first option", async ({
    page,
  }) => {
    const boxes = await readOptionBoxes(page);
    const selectAll = boxes?.options[0];

    // It is an option like any other: it is in the window, it has a real
    // rendered height, and the option after it starts where that height ends.
    expect(selectAll?.text).toContain("Select all");
    expect(selectAll?.height).toBeGreaterThan(0);
    await expectMenuReadsContinuously(page);
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
    await filterBy(page, field(page), "", TOTAL_COUNT);

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
    // Sorted by text, so the last option of the whole list is the highest-
    // numbered odd one.
    expect(boxes?.options.at(-1)?.text).toContain(`Odd item ${ITEM_COUNT - 1}`);
  });

  test("checking an option leaves the scroll position and the offsets alone", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    await scrollTo(page, 1200);
    const before = await readMenuState(page);
    expect(before.texts.length).toBeGreaterThan(1);

    // The default `selectionFeedback` leaves the order alone until the menu is
    // reopened, so nothing has moved and nothing should shift under the reader.
    await clickOptionInView(page);

    expectMenuHeld(await readMenuState(page), before, 1);

    // And again on the way back out.
    await clickOptionInView(page);

    expectMenuHeld(await readMenuState(page), before, 1);
  });

  test("checking the select-all row leaves the scroll position and the offsets alone", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    // Measure the top of the list first, so returning to it later is not what
    // moves the offsets.
    await scrollTo(page, 0);
    await scrollTo(page, 1200);
    const before = await readMenuState(page);

    // Select-all rebuilds every option in the list at once, which is the
    // sharpest version of the same question: a re-check is not a re-order, no
    // matter how much of the collection it replaces.
    await scrollTo(page, 0);
    await page.getByRole("option", { name: /Select all/ }).click();
    await scrollTo(page, 1200);

    expectMenuHeld(await readMenuState(page), before, 3);
  });

  test("selected options sorted to the top on reopen land at the right offsets", async ({
    page,
  }) => {
    await filterBy(page, field(page), "Even", MATCH_COUNT);
    await scrollToEnd(page);
    const last = page.getByRole("option").last();
    const lastText = (await last.textContent())?.trim();
    await last.click();

    // Close and reopen: `selectionFeedback: "top-after-reopen"` now puts the
    // checked option directly under the select-all row, and opening scrolls it
    // to the top of the viewport.
    await field(page).press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await field(page).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.waitForTimeout(150);

    const boxes = await readOptionBoxes(page);
    const selected = boxes?.options.find((option) => option.text === lastText);
    expect(selected).toBeDefined();
    // At the top of the viewport, whole, with the select-all row's real rather
    // than guessed height deciding where that is.
    expect(selected?.top).toBeGreaterThanOrEqual(
      (boxes?.menu.top ?? 0) - SLACK,
    );
    expect(selected?.top).toBeLessThanOrEqual((boxes?.menu.top ?? 0) + SLACK);
    await expectMenuReadsContinuously(page);
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
    // a time, through matches of all three heights, starting on the select-all
    // row, which is a different height again.
    const outOfView: number[] = [];
    for (let step = 0; step < 14; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: a step has to land before the next is judged
      const inView = await stepDown(page, field(page), highlighted);
      if (inView !== true) outOfView.push(step);
    }
    expect(outOfView).toEqual([]);
  });

  test("filtering down to a single match shows it whole", async ({ page }) => {
    // Two options: the match and the select-all row that always accompanies it.
    // Well below the threshold, so the list is unwindowed, which is why the
    // count rather than `aria-setsize` says the filter has landed.
    await field(page).fill(`item ${ITEM_COUNT}`);

    const options = page.getByRole("option");
    await expect(options).toHaveCount(2);
    await expect(options.nth(1)).toContainText(`Even item ${ITEM_COUNT}`);
    expect(await isFullyInView(options.nth(1))).toBe(true);
  });

  test("filtering down to no matches leaves the select-all row alone in the menu", async ({
    page,
  }) => {
    await field(page).fill("no such option");

    // The select-all row is not something a filter matches, so it stays.
    await expect(page.getByRole("option")).toHaveCount(1);
    await expect(page.getByRole("option")).toContainText("Select all");

    // The menu comes back correct rather than stuck at the one-option list's
    // offsets, which is the part an emptied set could quietly break.
    await filterBy(page, field(page), "Even", MATCH_COUNT);

    await expectMenuReadsContinuously(page);
    await scrollToEnd(page);
    const boxes = await readOptionBoxes(page);
    expect(boxes?.options.at(-1)?.text).toContain(`Even item ${ITEM_COUNT}`);
  });
});
