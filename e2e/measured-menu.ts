import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Reading a windowed, measured listbox menu in a real browser.
 *
 * Every listbox component that derives its offsets from measured option
 * heights is asked the same questions. Does the scrollbar span the real list,
 * do the options abut one another, is the option you arrowed onto actually on
 * screen? Only a layout engine can answer any of them. These are shared so each
 * component's test file states what it is checking rather than how to look.
 */

/** Rects are fractional; a pixel of slack keeps rounding out of the way. */
export const SLACK = 1;

/**
 * Drive the menu to the true end of the list. One jump is not enough on its
 * own: options measured on the way down change the total height, so the end
 * moves while you are travelling towards it.
 */
export async function scrollToEnd(page: Page) {
  let previous = -1;
  for (let attempt = 0; attempt < 20; attempt++) {
    // biome-ignore lint/performance/noAwaitInLoops: each jump must land before the next is judged
    const scrollTop = await page.evaluate(() => {
      const menu = document.querySelector('[role="listbox"]');
      if (!(menu instanceof HTMLElement)) return -1;
      menu.scrollTop = menu.scrollHeight;
      return menu.scrollTop;
    });
    if (scrollTop === previous) return scrollTop;
    previous = scrollTop;
    await page.waitForTimeout(50);
  }
  return previous;
}

/**
 * Type a filter into `field` and wait for the menu to settle on it.
 *
 * Settling is what the assertions rest on: the options a filter brings into
 * the window are only measured once they render, so the offsets a keystroke
 * produces sharpen over a frame or two before they are the real ones.
 *
 * `expectedCount` is the number of options the filter should leave, waited for
 * through `aria-setsize`. Leave it out when the match set drops below the
 * virtualization threshold, since an unwindowed list carries no `aria-setsize`.
 */
export async function filterBy(
  page: Page,
  field: Locator,
  text: string,
  expectedCount?: number,
) {
  await field.fill(text);
  if (expectedCount !== undefined) {
    await expect(page.getByRole("option").first()).toHaveAttribute(
      "aria-setsize",
      String(expectedCount),
    );
  }
  await page.waitForTimeout(100);
}

/** The menu's own scroll geometry. */
export function readMenuMetrics(page: Page) {
  return page.getByRole("listbox").evaluate((el) => ({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    scrollTop: el.scrollTop,
  }));
}

/** Where the menu is scrolled to, which is what "the menu moved" means. */
export async function readMenuScrollTop(page: Page) {
  return (await readMenuMetrics(page)).scrollTop;
}

/** Every rendered option's box, in the order they are laid out. */
export function readOptionBoxes(page: Page) {
  return page.evaluate(() => {
    const menu = document.querySelector('[role="listbox"]');
    if (!(menu instanceof HTMLElement)) return null;
    const menuBox = menu.getBoundingClientRect();
    const options = Array.from(menu.querySelectorAll('[role="option"]')).map(
      (option) => {
        const box = option.getBoundingClientRect();
        return {
          text: option.textContent?.trim() ?? "",
          top: box.top,
          bottom: box.bottom,
          height: box.height,
        };
      },
    );
    options.sort((a, b) => a.top - b.top);
    return { menu: { top: menuBox.top, bottom: menuBox.bottom }, options };
  });
}

export type OptionBoxes = NonNullable<
  Awaited<ReturnType<typeof readOptionBoxes>>
>;

/** Whether the option is wholly inside its menu's scroll viewport. */
export function isFullyInView(option: Locator) {
  return option.evaluate((el, slack) => {
    const menu = el.closest('[role="listbox"]');
    if (!(menu instanceof HTMLElement)) return null;
    const menuBox = menu.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return (
      box.top >= menuBox.top - slack && box.bottom <= menuBox.bottom + slack
    );
  }, SLACK);
}

/**
 * Arrow down one option and report whether the new highlight ends up fully in
 * view. The pause matters: it is the settled position being judged, after any
 * measurement batch has landed and had its chance to move the option.
 */
export async function stepDown(
  page: Page,
  field: Locator,
  highlighted: Locator,
) {
  await field.press("ArrowDown");
  await page.waitForTimeout(60);
  return isFullyInView(highlighted);
}

/** The option the highlight is on, by the text it renders. */
export async function readHighlightedOption(page: Page) {
  const text = await page
    .locator(".bx--list-box__menu-item--highlighted")
    .first()
    .textContent();
  return text?.trim() ?? "";
}

/**
 * Put the pointer on whatever option the menu's bottom edge runs through,
 * which is the option a hover would move the menu for: measured placement asks
 * whether an option is fully visible rather than merely rendered, so a clipped
 * one would be pulled out from under the pointer.
 *
 * A mouse move rather than a locator hover, because hovering a locator scrolls
 * it into view first, which is the very thing being judged.
 */
export async function hoverBottomEdge(page: Page) {
  const box = await page.getByRole("listbox").boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 3);
}

/** Options must abut one another: no blank gap, no overlap. */
export function expectContiguous(boxes: OptionBoxes) {
  expect(boxes.options.length).toBeGreaterThan(1);
  for (let index = 1; index < boxes.options.length; index++) {
    const gap = boxes.options[index].top - boxes.options[index - 1].bottom;
    expect(gap).toBeLessThan(SLACK);
    expect(gap).toBeGreaterThan(-SLACK);
  }
}

/** Rendered options must reach both edges of the viewport, leaving no blank. */
export function expectViewportCovered(boxes: OptionBoxes) {
  const first = boxes.options[0];
  const last = boxes.options[boxes.options.length - 1];
  expect(first.top).toBeLessThanOrEqual(boxes.menu.top + SLACK);
  expect(last.bottom).toBeGreaterThanOrEqual(boxes.menu.bottom - SLACK);
}

/** Assert the option list reads continuously and fills the menu. */
export async function expectMenuReadsContinuously(page: Page) {
  const boxes = await readOptionBoxes(page);
  expect(boxes).not.toBeNull();
  if (!boxes) return;
  expectContiguous(boxes);
  expectViewportCovered(boxes);
}
