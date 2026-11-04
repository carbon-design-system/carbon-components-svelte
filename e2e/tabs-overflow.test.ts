import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

const NEXT = ".bx--tab--overflow-nav-button--next";
const PREV = ".bx--tab--overflow-nav-button--previous";
const HIDDEN = "bx--tab--overflow-nav-button--hidden";

/** Whether the tab lies within its tab list's scroll viewport. */
function insideList(tab: Locator) {
  return tab.evaluate((node) => {
    const navRect = node.closest("[role=tablist]")?.getBoundingClientRect();
    const tabRect = node.getBoundingClientRect();
    return Boolean(
      navRect &&
      tabRect.left >= navRect.left - 1 &&
      tabRect.right <= navRect.right + 1,
    );
  });
}

test.describe("Tabs overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tabs-overflow.html");
  });

  test("shows scroll buttons when the tab list overflows", async ({ page }) => {
    // At the start, the forward button is visible and the backward one hidden.
    await expect(page.locator(NEXT)).not.toHaveClass(new RegExp(HIDDEN));
    await expect(page.locator(PREV)).toHaveClass(new RegExp(HIDDEN));
  });

  test("forward button scrolls the list and reveals the backward button", async ({
    page,
  }) => {
    const nav = page.getByRole("tablist");
    expect(await nav.evaluate((n) => n.scrollLeft)).toBe(0);

    await page.locator(NEXT).click();

    await expect
      .poll(() => nav.evaluate((n) => n.scrollLeft))
      .toBeGreaterThan(0);
    await expect(page.locator(PREV)).not.toHaveClass(new RegExp(HIDDEN));
  });

  test("keyboard navigation keeps the focused tab visible", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Tab label 1", exact: true }).focus();

    // Arrow through several variable-width tabs; the focused tab must stay
    // within the scroll viewport rather than drifting off-screen.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("ArrowRight");
    }

    const focused = page.locator("[role=tab]:focus");
    await expect(focused).toHaveAttribute("aria-selected", "true");

    // The list scrolls the tab into view after the selection renders, so
    // poll until it lands.
    await expect.poll(() => insideList(focused)).toBe(true);
  });
});

// In RTL the list starts at the right, and browsers report `scrollLeft`
// from 0 there down to a negative value at the left end.
for (const variant of ["", "&vertical"]) {
  const name = variant ? "TabsVertical row" : "Tabs";

  test.describe(`${name} overflow in RTL`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/tabs-overflow.html?dir=rtl${variant}`);
    });

    test("tracks the start, middle and end of the list", async ({ page }) => {
      const nav = page.getByRole("tablist");
      const prev = page.locator(PREV);
      const next = page.locator(NEXT);
      const hidden = new RegExp(HIDDEN);

      // Start: only the button toward the end shows, at the left.
      await expect(prev).toHaveClass(hidden);
      await expect(next).not.toHaveClass(hidden);
      const [navBox, nextBox] = await Promise.all([
        nav.boundingBox(),
        next.boundingBox(),
      ]);
      expect(nextBox && navBox && nextBox.x < navBox.x).toBe(true);

      // Middle: the end button scrolls toward the left end.
      await next.click();
      await expect
        .poll(() => nav.evaluate((node) => node.scrollLeft))
        .toBeLessThan(0);
      await expect(prev).not.toHaveClass(hidden);
      await expect(next).not.toHaveClass(hidden);

      // End: selecting the last tab scrolls it into view.
      await page.getByRole("tab", { selected: true }).focus();
      await page.keyboard.press("End");
      const last = page.getByRole("tab", { name: "Tab label 10" });
      await expect(last).toHaveAttribute("aria-selected", "true");
      await expect(next).toHaveClass(hidden);
      await expect(prev).not.toHaveClass(hidden);
      await expect.poll(() => insideList(last)).toBe(true);

      // The start button scrolls back toward the right.
      const end = await nav.evaluate((node) => node.scrollLeft);
      await prev.click();
      await expect
        .poll(() => nav.evaluate((node) => node.scrollLeft))
        .toBeGreaterThan(end);
      await expect(next).not.toHaveClass(hidden);
    });
  });
}
